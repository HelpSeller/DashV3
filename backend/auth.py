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
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
    usuario = payload.get("sub")

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT modulos_ativos FROM public.usuarios WHERE usuario = %s", (usuario,))
    resultado = cursor.fetchone()

    conn.close()

    if resultado and resultado[0]:
        payload["modulos_ativos"] = resultado[0]  # array de textos

    return payload
@router.post("/login")
def login(request: Request, data: dict = Body(...)):
    from sqlalchemy import text
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        raise HTTPException(status_code=400, detail="Usuário e senha são obrigatórios.")

    # 1️⃣ Login como master no schema public
    try:
        conn = get_connection(schema="public")
        cur = conn.cursor()
        cur.execute("""
            SELECT usuario, senha_hash, is_master, schemas_autorizados, modulos_ativos 
            FROM usuarios 
            WHERE usuario = %s
        """, (username,))
        user = cur.fetchone()
        cur.close()
        conn.close()

        if user and verify_password(password, user[1]):
            schemas = list(user[3]) if user[3] else []
            modulos_ativos = list(user[4]) if user[4] else []

            # 🔐 Token inicial sem schema definido — frontend escolherá depois
            token = gerar_token({
                "sub": user[0],
                "is_master": user[2],
                "schemas_autorizados": schemas,
                "modulos_ativos": modulos_ativos
            })

            return {
                "access_token": token,
                "token_type": "bearer",
                "schemas": schemas
            }
    except Exception as e:
        print("Erro ao verificar no public:", e)

    # 2️⃣ Login como funcionário em schemas
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
                    SELECT usuario, senha_hash, is_master, modulos_ativos
                    FROM "{schema}".funcionarios 
                    WHERE usuario = %s
                """, (username,))
                user = cur.fetchone()
                cur.close()
                conn.close()

                if user and verify_password(password, user[1]):
                    modulos_ativos = list(user[3]) if user[3] else []

                    token = gerar_token({
                        "sub": user[0],
                        "schema": schema,
                        "is_master": user[2],
                        "schemas_autorizados": [schema],
                        "modulos_ativos": modulos_ativos
                    })

                    return {
                        "access_token": token,
                        "token_type": "bearer",
                        "schemas": [schema]
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

# 🔄 Seleciona o schema após login e retorna novo token com schema definido
@router.post("/auth/select-schema")
def selecionar_schema(request: Request, data: dict = Body(...)):
    payload = verify_token(request)
    schema = data.get("schema")

    if not schema or schema not in payload.get("schemas_autorizados", []):
        raise HTTPException(status_code=403, detail="Schema não autorizado.")

    novo_token = gerar_token({
        "sub": payload["sub"],
        "schema": schema,
        "is_master": payload.get("is_master", False),
        "schemas_autorizados": payload.get("schemas_autorizados", []),
        "modulos_ativos": payload.get("modulos_ativos", [])
    })

    return {
        "access_token": novo_token,
        "token_type": "bearer",
        "schema": schema
    }
