# backend/routes/dashboard.py
from fastapi import APIRouter, Request, HTTPException
from queries import (
    get_valor_total_faturado_query,
    get_valor_total_frete_query,
    get_valor_total_devolucao_query,
    get_total_produtos_sem_venda,
    get_categorias_query,
    get_faturamento_mensal_query,
    get_faturamento_por_marketplace_query
)
from utils import montar_grafico_barras
from datetime import datetime, timedelta
import locale

router = APIRouter()

@router.get("/dashboard")
def dashboard(request: Request, start_date: str = None, end_date: str = None):
    print("##### STARTING DASHBOARD CALL #####")

    schema = request.headers.get("x-schema")
    if not schema:
        raise HTTPException(status_code=400, detail="Schema não fornecido no header")
    print(f"Schema recebido: {schema}")

    if start_date and end_date:
        start = datetime.strptime(start_date, "%Y-%m-%d")
        end = datetime.strptime(end_date, "%Y-%m-%d")
    else:
        end = datetime.today()
        start = end - timedelta(days=365)

    start_str = start.strftime("%Y-%m-%d")
    end_str = end.strftime("%Y-%m-%d")
    print(f"Período filtrado: {start_str} até {end_str}")

    try:
        # KPIs
        valor_faturado = get_valor_total_faturado_query(schema, start_str, end_str)
        faturamento = {
            "valor_atual": valor_faturado,
            "indicador": 0,
            "cor": "text-white",
        }

        valor_frete = get_valor_total_frete_query(schema, start_str, end_str)
        frete = {"valor_atual": valor_frete}

        valor_devolucao, qtd_devolucoes = get_valor_total_devolucao_query(schema, start_str, end_str)
        devolucao = {
            "valor_atual": valor_devolucao,
            "qtd": qtd_devolucoes,
        }

        produtos_sem_venda = get_total_produtos_sem_venda(schema, start_str, end_str)

        categorias = get_categorias_query(schema, start_str, end_str)
        grafico_categoria = montar_grafico_barras(
            categorias, "categoria", "quantidade_total", "Distribuição por Categoria"
        )

        # Faturamento Mensal
        faturamento_mensal = get_faturamento_mensal_query(schema, start_str, end_str)
        locale.setlocale(locale.LC_TIME, 'pt_BR.UTF-8')
        grafico_mensal = {
            "labels": [
                datetime.strptime(item["mes"], "%Y-%m").strftime("%B %Y").title()
                for item in faturamento_mensal
            ],
            "faturamento": [item["faturamento"] for item in faturamento_mensal],
            "ticket_medio": [round(item["ticket_medio"], 2) for item in faturamento_mensal],
        }

        # Faturamento por Marketplace
        grafico_marketplace = get_faturamento_por_marketplace_query(schema, start_str, end_str)

        return {
            "faturamento": faturamento,
            "frete": frete,
            "devolucao": devolucao,
            "produtosSemVenda": produtos_sem_venda,
            "grafico_categoria": grafico_categoria,
            "grafico_mensal": grafico_mensal,
            "grafico_marketplace": grafico_marketplace,
        }

    except Exception as e:
        print(f"Erro ao calcular KPIs: {e}")
        raise HTTPException(status_code=500, detail="Erro ao gerar dashboard")
