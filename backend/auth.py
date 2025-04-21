from fastapi import APIRouter, HTTPException, Request, Body
from fastapi.responses import JSONResponse
from jose import jwt, JWTError
from datetime import datetime, timedelta
from utils import verify_password, get_engine
from database import get_connection
import psycopg2
import os

router = APIRouter()

SECRET_KEY = os.getenv("SECRET_KEY", "secreto123")
ALGORITHM = "HS256"

# 🛡️ Gera JWT Token com expiração
def gerar_token(data: dict):
    expire = datetime.utcnow() + timedelta(minutes=60)
    data.update({"exp": expire})
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)

# 🔍 Verifica token Bearer
def verify_token(request: Request):
    token = request.headers.get("Authorization")
    if not token or not token.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token ausente ou malformado")
    try:
        token = token.split(" ")[1]
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")

# 🔐 Login com busca em `public.usuarios` e fallback em `schema.funcionarios`
@router.post("/login")
def login(request: Request, data: dict = Body(...)):
    from sqlalchemy import text
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        raise HTTPException(status_code=400, detail="Usuário e senha são obrigatórios.")

    # 1️⃣ Tenta logar no schema public
    try:
        conn = get_connection(schema="public")
        cur = conn.cursor()
        cur.execute("""
            SELECT usuario, senha_hash, is_master, schemas_autorizados 
            FROM usuarios 
            WHERE usuario = %s
        """, (username,))
        user = cur.fetchone()
        cur.close()
        conn.close()

        if user and verify_password(password, user[1]):
            schemas = user[3] if user[3] else []
            token = gerar_token({
                "sub": user[0],
                "schema": "public",  # corrigido!
                "is_master": user[2],
                "schemas_autorizados": schemas
            })
            return {
                "access_token": token,
                "token_type": "bearer",
                "schemas": schemas  # 👈 ESSENCIAL para o front funcionar!
            }
    except Exception as e:
        print("Erro ao verificar no public:", e)

    # 2️⃣ Itera nos outros schemas procurando na tabela funcionarios
    try:
        engine = get_engine()
        with engine.connect() as connection:
            result = connection.execute(text("""
                SELECT schema_name FROM information_schema.schemata
                WHERE schema_name NOT IN ('public', 'pg_catalog', 'information_schema')
            """))
            schemas = [row[0] for row in result.fetchall()]

        for schema in schemas:
            try:
                conn = get_connection(schema=schema)
                cur = conn.cursor()
                cur.execute(f"""
                    SELECT usuario, senha_hash, is_master 
                    FROM "{schema}".funcionarios 
                    WHERE usuario = %s
                """, (username,))
                user = cur.fetchone()
                cur.close()
                conn.close()

                if user and verify_password(password, user[1]):
                    token = gerar_token({
                        "sub": user[0],
                        "schema": schema,
                        "is_master": user[2],
                        "schemas_autorizados": [schema]
                    })
                    return {
                        "access_token": token,
                        "token_type": "bearer",
                        "schemas": [schema]  # 👈 envia para o select-schema.jsx
                    }
            except Exception as inner:
                print(f"[{schema}] Erro ao verificar funcionarios: {inner}")

    except Exception as e:
        print("Erro ao iterar schemas:", e)

    raise HTTPException(status_code=401, detail="Usuário ou senha incorretos.")

# 📥 Lista schemas autorizados do token
@router.get("/schemas")
def listar_schemas(request: Request):
    payload = verify_token(request)
    return payload.get("schemas_autorizados", [])
