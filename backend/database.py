# Arquivo: database.py
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
import psycopg2
import pandas as pd

# Carrega variáveis do .env
load_dotenv(dotenv_path=".env")

# Credenciais
user = os.getenv("POSTGRESQL_USER")
password = os.getenv("POSTGRESQL_PASSWORD")
host = os.getenv("POSTGRESQL_HOST")
port = os.getenv("POSTGRESQL_PORT", "5432")
db = os.getenv("POSTGRESQL_DB")

# URL SQLAlchemy
DATABASE_URL = f"postgresql+psycopg2://{user}:{password}@{host}:{port}/{db}"

# Engine e sessão para uso com ORM
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# ✅ Base declarativa para os modelos
Base = declarative_base()

# ✅ get_db para uso com FastAPI e headers dinâmicos de schema
def get_db(schema=None):
    connection = engine.connect()
    if schema:
        connection.execute(text(f"SET search_path TO {schema}"))
    db = SessionLocal(bind=connection)
    try:
        yield db
    finally:
        db.close()
        connection.close()

# 🔁 Conexão direta com psycopg2
def get_connection(schema=None):
    conn = psycopg2.connect(
        host=host,
        database=db,
        user=user,
        password=password,
        port=port
    )
    if schema:
        cur = conn.cursor()
        cur.execute(f"SET search_path TO {schema};")
        cur.close()
    return conn

# 🔧 Execução simples (INSERT, UPDATE, DELETE)
def executar_comando(query, params=None, schema=None):
    conn = get_connection(schema)
    cur = conn.cursor()
    try:
        cur.execute(query, params)
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cur.close()
        conn.close()

# 📥 Busca um único usuário por e-mail
def buscar_usuario_por_email(email: str, schema=None):
    conn = get_connection(schema)
    cur = conn.cursor()
    try:
        cur.execute("SELECT * FROM usuarios WHERE email = %s", (email,))
        return cur.fetchone()
    finally:
        cur.close()
        conn.close()

# 🔐 Atualiza a senha do usuário
def atualizar_senha_temporaria(email: str, senha_hash: str, schema=None):
    conn = get_connection(schema)
    cur = conn.cursor()
    try:
        cur.execute("UPDATE usuarios SET senha_hash = %s WHERE email = %s", (senha_hash, email))
        conn.commit()
    finally:
        cur.close()
        conn.close()

# 📋 Executa uma query que retorna lista
def executar_query_lista(query: str, params=None, schema=None):
    conn = get_connection(schema)
    cur = conn.cursor()
    try:
        cur.execute(query, params)
        return cur.fetchall()
    finally:
        cur.close()
        conn.close()

# 📊 Executa uma query que retorna DataFrame
def executar_query_df(query: str, params=None, schema=None):
    conn = get_connection(schema)
    try:
        df = pd.read_sql_query(query, conn, params=params)
        return df
    finally:
        conn.close()
