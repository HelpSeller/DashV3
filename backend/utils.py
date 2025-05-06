import pandas as pd
from sqlalchemy import create_engine
import psycopg2
import os
import random
import string
import bcrypt
import smtplib
from email.mime.text import MIMEText
from io import BytesIO
from PIL import Image
from dotenv import load_dotenv
from datetime import datetime, timedelta

load_dotenv()

# 🔐 Conexão com banco
def get_engine():
    url = f"postgresql+psycopg2://{os.getenv('POSTGRESQL_USER')}:{os.getenv('POSTGRESQL_PASSWORD')}@{os.getenv('POSTGRESQL_HOST')}:{os.getenv('POSTGRESQL_PORT')}/{os.getenv('POSTGRESQL_DB')}"
    return create_engine(url)

def hash_password(password):
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def get_connection():
    return psycopg2.connect(
        dbname=os.getenv("POSTGRESQL_DB"),
        user=os.getenv("POSTGRESQL_USER"),
        password=os.getenv("POSTGRESQL_PASSWORD"),
        host=os.getenv("POSTGRESQL_HOST"),
        port=os.getenv("POSTGRESQL_PORT", "5432")
    )

# 📦 Querys utilitárias
def executar_query_lista(query):
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query)
            return cur.fetchall()

def load_data(query: str) -> pd.DataFrame:
    if isinstance(query, pd.DataFrame):
        return query

    try:
        engine = get_engine()
        with engine.connect() as conn:
            return pd.read_sql(query, conn)
    except Exception as e:
        print("Erro ao executar query:", e)
        return pd.DataFrame()


# 🧠 Outros utilitários
def convert_to_datetime(df: pd.DataFrame, col_name: str) -> pd.DataFrame:
    if col_name in df.columns:
        df[col_name] = pd.to_datetime(df[col_name], errors="coerce", dayfirst=True)
        if pd.api.types.is_datetime64tz_dtype(df[col_name]):
            df[col_name] = df[col_name].dt.tz_localize(None)
    return df

def gerar_senha_provisoria(tamanho=8):
    return ''.join(random.choices(string.ascii_letters + string.digits, k=tamanho))

def enviar_email(destinatario: str, senha: str):
    msg = MIMEText(f"Sua nova senha provisória é: {senha}\n\nAcesse o sistema e altere assim que possível.")
    msg['Subject'] = 'Recuperação de Senha - HelpSeller'
    msg['From'] = os.getenv("EMAIL_REMETENTE")
    msg['To'] = destinatario

    try:
        with smtplib.SMTP('smtp.zoho.com', 587) as server:
            server.starttls()
            server.login(os.getenv("EMAIL_REMETENTE"), os.getenv("EMAIL_SENHA"))
            server.send_message(msg)
        print("📨 E-mail enviado com sucesso")
    except Exception as e:
        print(f"❌ Erro ao enviar e-mail: {e}")

def get_schemas_do_usuario_logado(usuario):
    if usuario == "helpseller":
        query = """
            SELECT schema_name FROM information_schema.schemata
            WHERE schema_name LIKE '%_tiny'
            ORDER BY schema_name;
        """
        return [row[0].replace("_tiny", "") for row in executar_query_lista(query)]

    # Caso o usuário tenha schemas autorizados em outro lugar (por exemplo, token)
    return []

def listar_todos_schemas():
    query = """
        SELECT schema_name
        FROM information_schema.schemata
        WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'public')
        ORDER BY schema_name;
    """
    return [row[0] for row in executar_query_lista(query)]

def carregar_logo_global():
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT logo FROM public.global_config WHERE id = 1;")
        result = cur.fetchone()
        cur.close()
        conn.close()

        if result and result[0]:
            imagem = BytesIO(result[0])
            return Image.open(imagem)
    except Exception as e:
        print("Erro ao carregar logo:", e)
    return None

def listar_notificacoes(schema, usuario):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(f'''
        SELECT id, mensagem, lida, criada_em
        FROM "{schema}".notificacoes
        WHERE usuario_destino = %s
        ORDER BY criada_em DESC
    ''', (usuario,))
    resultado = cur.fetchall()
    cur.close()
    conn.close()
    return resultado

def marcar_notificacoes_como_lidas(schema, usuario):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(f'''
        UPDATE "{schema}".notificacoes
        SET lida = TRUE
        WHERE usuario_destino = %s AND lida = FALSE
    ''', (usuario,))
    conn.commit()
    cur.close()
    conn.close()

def contar_notificacoes_nao_lidas(schema, usuario):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(f'''
        SELECT COUNT(*) FROM "{schema}".notificacoes
        WHERE usuario_destino = %s AND lida = FALSE
    ''', (usuario,))
    count = cur.fetchone()[0]
    cur.close()
    conn.close()
    return count

def get_user(conn, username):
    cur = conn.cursor()
    cur.execute("SELECT usuario, senha_hash, is_master FROM usuarios WHERE usuario = %s", (username,))
    row = cur.fetchone()
    cur.close()
    if row:
        return {
            "usuario": row[0],
            "senha_hash": row[1],
            "is_master": row[2]
        }
    return None

def verify_password(plain_password, hashed_password):
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

# utils.py

def montar_grafico_barras(data, campo_x, campo_y, titulo):
    import pandas as pd

    if isinstance(data, pd.DataFrame):
        if data.empty:
            return {"data": [], "layout": {"title": titulo}}
        x = data[campo_x].tolist()
        y = data[campo_y].astype(float).tolist()
    elif isinstance(data, list) and len(data) > 0:
        x = [item[campo_x] for item in data]
        y = [float(item[campo_y]) for item in data]
    else:
        return {"data": [], "layout": {"title": titulo}}

    return {
        "data": [{
            "x": x,
            "y": y,
            "type": "bar",
            "marker": {"color": "rgb(0, 123, 255)"}
        }],
        "layout": {
            "title": titulo,
            "xaxis": {"title": campo_x},
            "yaxis": {"title": campo_y}
        }
    }

def get_data_periodo(start_date: str = None, end_date: str = None):
    try:
        if start_date:
            start = datetime.strptime(start_date, "%Y-%m-%d")
        else:
            today = datetime.today()
            start = today.replace(day=1)

        if end_date:
            end = datetime.strptime(end_date, "%Y-%m-%d")
        else:
            end = datetime.today()

        return start.strftime("%Y-%m-%d"), end.strftime("%Y-%m-%d")
    except Exception as e:
        raise ValueError(f"Erro ao processar datas: {e}")

def montar_grafico_linhas(schema, query_func, campo_x, campo_y, titulo, start_date=None, end_date=None):
    """
    Monta um gráfico de linhas baseado nos dados fornecidos.
    """

    dados = query_func(schema, start_date, end_date)

    # 🛡️ Se não houver dados ou dados inválidos, monta um gráfico vazio
    if not dados or not isinstance(dados, list):
        return {
            "title": titulo,
            "xAxis": {"type": "category", "data": []},
            "yAxis": {"type": "value"},
            "series": [
                {"data": [], "type": "line", "smooth": True}
            ]
        }

    # 🛡️ Garante que cada item tenha pelo menos dois campos
    x = []
    y = []

    for item in dados:
        if isinstance(item, (list, tuple)) and len(item) >= 2:
            x.append(item[0])
            y.append(item[1])
        else:
            # Item inválido, ignora
            continue

    return {
        "title": titulo,
        "xAxis": {"type": "category", "data": x},
        "yAxis": {"type": "value"},
        "series": [
            {"data": y, "type": "line", "smooth": True}
        ]
    }
