from fastapi import APIRouter, Request, HTTPException
from queries import (
    get_valor_total_faturado_query,
    get_valor_total_frete_query,
    get_valor_total_devolucao_query,
    get_top_10_produtos_query,
    get_categorias_query,
    get_faturamento_por_marketplace_query,
    get_faturamento_mensal_query,
    get_total_produtos_sem_venda
)
from utils import comparar_periodos, montar_grafico_barras, montar_grafico_linhas
from datetime import datetime, timedelta

router = APIRouter()

@router.get("/dashboard")
def dashboard(request: Request):
    # 🚨 Captura o schema do header
    schema = request.headers.get("x-schema")
    if not schema:
        raise HTTPException(status_code=400, detail="Schema não fornecido no header")

    # 🧠 Pega intervalo dos últimos 30 dias
    end = datetime.today()
    start = end - timedelta(days=30)
    start_str = start.strftime('%Y-%m-%d')
    end_str = end.strftime('%Y-%m-%d')

    # 🔎 Consultas principais
    valor_atual, valor_anterior, indicador, cor = comparar_periodos(
        schema, get_valor_total_faturado_query, start_str, end_str
    )
    faturamento = {
        "valor_atual": valor_atual,
        "valor_anterior": valor_anterior,
        "indicador": indicador,
        "cor": cor
    }

    valor_atual_frete, _, _, _ = comparar_periodos(
        schema, get_valor_total_frete_query, start_str, end_str
    )
    frete = {"valor_atual": valor_atual_frete}

    valor_atual_devolucao, qtd = get_valor_total_devolucao_query(schema, start_str, end_str)
    devolucao = {"valor_atual": valor_atual_devolucao, "qtd": qtd}

    produtosSemVenda = get_total_produtos_sem_venda(schema, start_str, end_str)

    # 🔥 Gráficos
    categorias = get_categorias_query(schema)
    grafico_categoria = montar_grafico_barras(
        categorias, "categoria", "quantidade_total", "Distribuição por Categoria"
    )

    marketplace = get_faturamento_por_marketplace_query(schema, start_str, end_str)
    grafico_marketplace = montar_grafico_barras(
        marketplace, "marketplace", "valor_total", "Faturamento por Marketplace"
    )

    grafico_mensal = montar_grafico_linhas(
        schema=schema,
        query_func=get_faturamento_mensal_query,
        campo_x="mes",
        campo_y="faturamento",
        titulo="Faturamento Mensal"
    )

    return {
        "faturamento": faturamento,
        "frete": frete,
        "devolucao": devolucao,
        "produtosSemVenda": produtosSemVenda,
        "grafico_categoria": grafico_categoria,
        "grafico_marketplace": grafico_marketplace,
        "grafico_mensal": grafico_mensal,
    }
