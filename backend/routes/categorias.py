# 📁 routes/categorias.py
from fastapi import APIRouter, Request, HTTPException
from auth import verify_token
from database import get_connection

router = APIRouter()

@router.get("/grafico-categorias")
def grafico_categorias(request: Request):
    payload = verify_token(request)
    schema = request.headers.get("x-schema")
    if not schema:
        raise HTTPException(status_code=400, detail="Schema não informado")

    conn = get_connection(schema)
    cur = conn.cursor()

    query = f"""
        SELECT 
            TRIM(SPLIT_PART(p.categoria, '>>', 1)) AS categoria,
            SUM(CAST(oi.quantidade AS NUMERIC)) AS total_vendido
        FROM {schema}.tiny_nfs nf
        JOIN {schema}.tiny_orders o ON nf.cliente_cpf_cnpj = o.cliente_cpf_cnpj
        JOIN {schema}.tiny_order_item oi ON o.id = oi.order_id
        JOIN {schema}.tiny_products p ON p.codigo = oi.codigo
        WHERE nf.tipo = 'S'
          AND nf."createdAt" >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY 1
        ORDER BY total_vendido DESC
    """
    cur.execute(query)
    rows = cur.fetchall()
    cur.close()
    conn.close()

    return {
        "labels": [r[0] for r in rows],
        "values": [float(r[1]) for r in rows]
    }

@router.get("/grafico-subcategorias")
def grafico_subcategorias(request: Request, categoria: str):
    payload = verify_token(request)
    schema = request.headers.get("x-schema")
    if not schema:
        raise HTTPException(status_code=400, detail="Schema não informado")

    conn = get_connection(schema)
    cur = conn.cursor()

    query = f"""
        SELECT 
            TRIM(SPLIT_PART(p.categoria, '>>', 2)) AS subcategoria,
            SUM(CAST(oi.quantidade AS NUMERIC)) AS total_vendido
        FROM {schema}.tiny_nfs nf
        JOIN {schema}.tiny_orders o ON nf.cliente_cpf_cnpj = o.cliente_cpf_cnpj
        JOIN {schema}.tiny_order_item oi ON o.id = oi.order_id
        JOIN {schema}.tiny_products p ON p.codigo = oi.codigo
        WHERE nf.tipo = 'S'
          AND nf."createdAt" >= CURRENT_DATE - INTERVAL '30 days'
          AND TRIM(SPLIT_PART(p.categoria, '>>', 1)) = %s
        GROUP BY 1
        ORDER BY total_vendido DESC
    """
    cur.execute(query, (categoria,))
    rows = cur.fetchall()
    cur.close()
    conn.close()

    return {
        "labels": [r[0] or "Outros" for r in rows],
        "values": [float(r[1]) for r in rows]
    }
