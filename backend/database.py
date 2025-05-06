# Arquivo: database.py
import os
from sqlalchemy import create_engine
from dotenv import load_dotenv
import psycopg2
import pandas as pd

# Carrega variáveis de ambiente do .env
load_dotenv(dotenv_path=".env")

# Credenciais do banco
user = os.getenv("POSTGRESQL_USER")
password = os.getenv("POSTGRESQL_PASSWORD")
host = os.getenv("POSTGRESQL_HOST")
port = os.getenv("POSTGRESQL_PORT", "5432")
db = os.getenv("POSTGRESQL_DB")

# URL para SQLAlchemy
DATABASE_URL = f"postgresql+psycopg2://{user}:{password}@{host}:{port}/{db}"
engine = create_engine(DATABASE_URL)

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

def buscar_usuario_por_email(email: str, schema=None):
    conn = get_connection(schema)
    cur = conn.cursor()
    try:
        cur.execute("SELECT * FROM usuarios WHERE email = %s", (email,))
        return cur.fetchone()
    finally:
        cur.close()
        conn.close()

def atualizar_senha_temporaria(email: str, senha_hash: str, schema=None):
    conn = get_connection(schema)
    cur = conn.cursor()
    try:
        cur.execute("UPDATE usuarios SET senha_hash = %s WHERE email = %s", (senha_hash, email))
        conn.commit()
    finally:
        cur.close()
        conn.close()

def executar_query_lista(query: str, params=None, schema=None):
    conn = get_connection(schema)
    cur = conn.cursor()
    try:
        cur.execute(query, params)
        return cur.fetchall()
    finally:
        cur.close()
        conn.close()

def executar_query_df(query: str, params=None, schema=None):
    conn = get_connection(schema)
    try:
        df = pd.read_sql_query(query, conn, params=params)
        return df
    finally:
        conn.close()
