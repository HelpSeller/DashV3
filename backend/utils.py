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

# 📈 Comparação de períodos
def comparar_periodos(schema, func, inicio_str, fim_str):
    inicio = datetime.strptime(inicio_str, "%Y-%m-%d").date()
    fim = datetime.strptime(fim_str, "%Y-%m-%d").date()
    intervalo = fim - inicio

    inicio_anterior = inicio - intervalo - timedelta(days=1)
    fim_anterior = inicio - timedelta(days=1)

    inicio_anterior_str = inicio_anterior.strftime("%Y-%m-%d")
    fim_anterior_str = fim_anterior.strftime("%Y-%m-%d")

    valor_atual = func(schema, inicio_str, fim_str)
    valor_anterior = func(schema, inicio_anterior_str, fim_anterior_str)

    if not valor_anterior or valor_anterior == 0:
        indicador = "↑ 100%" if valor_atual > 0 else "0%"
        cor = "text-blue-500" if valor_atual >= 0 else "text-red-500"
    else:
        variacao = ((valor_atual - valor_anterior) / valor_anterior) * 100
        seta = "↑" if variacao >= 0 else "↓"
        cor = "text-blue-500" if variacao >= 0 else "text-red-500"
        indicador = f"{seta} {abs(variacao):.2f}%"

    return valor_atual, valor_anterior, indicador, cor

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

def montar_grafico_linhas(schema, query_func, campo_x, campo_y, titulo):
    from queries import executar_query_df

    query = query_func(schema)
    df = executar_query_df(query)

    if df.empty:
        return {
            "data": [],
            "layout": {"title": titulo}
        }

    return {
        "data": [{
            "x": df[campo_x].tolist(),
            "y": df[campo_y].tolist(),
            "type": "scatter",
            "mode": "lines+markers",
            "marker": {"color": "rgb(40, 167, 69)"}
        }],
        "layout": {
            "title": titulo,
            "xaxis": {"title": campo_x},
            "yaxis": {"title": campo_y}
        }
    }

