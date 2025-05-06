from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from database import get_connection
from auth import verify_token

router = APIRouter()

# 📘 Modelo para cálculo de preço
class DadosCalculo(BaseModel):
    sku: str
    marketplace: str
    custoAquisicao: float
    impostosCompra: float
    difal: float
    frete: float
    embalagem: float
    custoFixo: float
    faturamentoEstimado: float
    despesaFixaPct: float
    markup: float
    comissaoVendedor: float
    comissaoHelpSeller: float
    comissaoMarketplace: float

# 🧮 Calculadora de preço com histórico
@router.post("/api/calcular")
def calcular(dados: DadosCalculo, request: Request):
    usuario = verify_token(request)
    print("Usuário identificado:", usuario)

    if not usuario or "schema" not in usuario:
        raise HTTPException(status_code=401, detail="Token inválido ou schema não encontrado")

    schema = usuario["schema"]

    def to_number(v): return float(v) if v else 0.0

    custo_total = (
        to_number(dados.custoAquisicao)
        + to_number(dados.custoAquisicao) * to_number(dados.impostosCompra) / 100
        + to_number(dados.custoAquisicao) * to_number(dados.difal) / 100
        + to_number(dados.frete)
        + to_number(dados.embalagem)
        + to_number(dados.custoFixo)
        + to_number(dados.faturamentoEstimado) * to_number(dados.despesaFixaPct) / 100
    )

    preco_recomendado = custo_total / (
        1 - (
            to_number(dados.markup)
            + to_number(dados.comissaoVendedor)
            + to_number(dados.comissaoHelpSeller)
            + to_number(dados.comissaoMarketplace)
        ) / 100
    )

    comissao_marketplace_reais = preco_recomendado * to_number(dados.comissaoMarketplace) / 100
    comissao_vendedor_reais = preco_recomendado * to_number(dados.comissaoVendedor) / 100
    comissao_helpseller_reais = preco_recomendado * to_number(dados.comissaoHelpSeller) / 100

    rentabilidade = ((preco_recomendado - custo_total) / preco_recomendado) * 100
    margem_liquida = (
        (preco_recomendado - custo_total - comissao_marketplace_reais - comissao_vendedor_reais - comissao_helpseller_reais)
        / preco_recomendado
    ) * 100

    try:
        conn = get_connection(schema=schema)
        cur = conn.cursor()
        cur.execute(f"""
            INSERT INTO {schema}.historico 
                (codigo, marketplace, preco_venda, rentabilidade, comissao_marketplace)
            VALUES (%s, %s, %s, %s, %s)
        """, (
            dados.sku,
            dados.marketplace,
            preco_recomendado,
            rentabilidade,
            comissao_marketplace_reais
        ))
        conn.commit()
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Erro ao salvar histórico: {e}")

    return {
        "preco_recomendado": round(preco_recomendado, 2),
        "custo_total": round(custo_total, 2),
        "rentabilidade_pct": round(rentabilidade, 2),
        "margem_liquida_pct": round(margem_liquida, 2),
        "margemLucroLiquida": round(margem_liquida, 2),  # 👈 esta linha garante que o front exiba corretamente
        "comissao_marketplace_reais": round(comissao_marketplace_reais, 2),
        "comissao_vendedor_reais": round(comissao_vendedor_reais, 2),
        "comissao_helpseller_reais": round(comissao_helpseller_reais, 2)
    }

# 🔍 Busca produto(s) por código
@router.get("/api/calculadora/produtos")
def buscar_produtos_calculadora(sku: str, request: Request):
    usuario = verify_token(request)
    schema = usuario.get("schema")
    print("SCHEMA UTILIZADO:", schema)

    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute(f"SET search_path TO {schema};")

        cur.execute("""
            SELECT codigo, nome, preco_custo_medio
            FROM tiny_products
            WHERE codigo ILIKE %s
        """, (f"%{sku}%",))

        dados = cur.fetchall()
        cur.close()
        conn.close()

        return [{"codigo": d[0], "nome": d[1], "custoMedio": d[2]} for d in dados]

    except Exception as e:
        print("Erro ao buscar produtos:", e)
        raise HTTPException(status_code=500, detail="Erro ao buscar produtos")

# 🔠 Autocomplete: busca código ou nome
@router.get("/api/calculadora/skus")
def listar_skus(filtro: str, request: Request):
    usuario = verify_token(request)
    schema = usuario.get("schema")
    print("SCHEMA AUTOCOMPLETE:", schema)

    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute(f"SET search_path TO {schema};")

        cur.execute("""
            SELECT codigo, nome
            FROM tiny_products
            WHERE codigo ILIKE %s OR nome ILIKE %s
            LIMIT 15
        """, (f"%{filtro}%", f"%{filtro}%"))

        resultados = cur.fetchall()
        cur.close()
        conn.close()

        return [{"codigo": r[0], "nome": r[1]} for r in resultados]

    except Exception as e:
        print("Erro ao buscar sugestões:", e)
        raise HTTPException(status_code=500, detail="Erro ao buscar SKUs")
    
@router.get("/api/historico")
def listar_historico(request: Request):
    usuario = verify_token(request)

    if not usuario or "schema" not in usuario:
        raise HTTPException(status_code=401, detail="Token inválido ou schema não encontrado")

    schema = usuario["schema"]

    try:
        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute(f"""
            SELECT codigo, marketplace, preco_venda, rentabilidade, comissao_marketplace
            FROM {schema}.historico
            ORDER BY created_at DESC
            LIMIT 100
        """)

        colunas = [desc[0] for desc in cursor.description]
        dados = [dict(zip(colunas, linha)) for linha in cursor.fetchall()]
        return dados

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()
