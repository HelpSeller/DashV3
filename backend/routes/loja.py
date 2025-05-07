from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from database import get_db
from ecommerce.models import ProdutoLoja  # ajuste conforme sua estrutura
from ecommerce.schemas import ProdutoCreate, Produto

router = APIRouter(prefix="/loja", tags=["Loja de Extensões"])


# 🔷 ROTAS PARA O ADMINISTRADOR / INTERNO
@router.get("/produtos", response_model=list[Produto])
def listar_produtos(db: Session = Depends(get_db)):
    """
    Lista todos os produtos ativos da loja usando ORM.
    """
    return db.query(ProdutoLoja).filter(ProdutoLoja.ativo == True).all()


@router.post("/produtos", response_model=Produto)
def criar_produto(produto: ProdutoCreate, db: Session = Depends(get_db)):
    """
    Cria um novo produto na loja de extensões.
    """
    db_produto = ProdutoLoja(**produto.dict())
    db.add(db_produto)
    db.commit()
    db.refresh(db_produto)
    return db_produto


# 🔷 ROTAS PARA O CLIENTE FINAL (frontend público)
@router.get("/public")
def listar_produtos_publicamente(db=Depends(get_db)):
    """
    Lista apenas nome, descrição e preço para exibição no frontend.
    """
    query = "SELECT id, nome, descricao, preco FROM public.produtos_loja WHERE ativo = true"
    result = db.execute(query).fetchall()
    return [dict(row) for row in result]


@router.post("/carrinho/adicionar")
def adicionar_ao_carrinho(payload: dict = Body(...), db: Session = Depends(get_db)):
    produto_id = payload.get("produto_id")
    quantidade = payload.get("quantidade", 1)

    if not produto_id:
        raise HTTPException(status_code=400, detail="produto_id é obrigatório.")

    db.execute(
        "INSERT INTO public.carrinho (produto_id, quantidade) VALUES (%s, %s)",
        (produto_id, quantidade)
    )
    db.commit()
    return {"message": "Produto adicionado ao carrinho com sucesso."}


@router.get("/carrinho")
def listar_carrinho(db: Session = Depends(get_db)):
    query = '''
        SELECT c.id, p.nome, p.descricao, p.preco, c.quantidade
        FROM public.carrinho c
        JOIN public.produtos_loja p ON p.id = c.produto_id
        ORDER BY c.id DESC
    '''
    result = db.execute(query).fetchall()
    return [dict(row) for row in result]


@router.post("/carrinho/finalizar")
def finalizar_compra(db: Session = Depends(get_db)):
    carrinho = db.execute('''
        SELECT produto_id, quantidade, preco
        FROM public.carrinho c
        JOIN public.produtos_loja p ON p.id = c.produto_id
    ''').fetchall()

    if not carrinho:
        raise HTTPException(status_code=400, detail="Carrinho vazio.")

    total = sum(item["preco"] * item["quantidade"] for item in carrinho)

    pedido = db.execute(
        "INSERT INTO public.pedidos (total) VALUES (%s) RETURNING id",
        (total,)
    )
    pedido_id = pedido.fetchone()[0]

    for item in carrinho:
        db.execute(
            '''
            INSERT INTO public.pedidos_itens (pedido_id, produto_id, quantidade, preco_unitario)
            VALUES (%s, %s, %s, %s)
            ''',
            (pedido_id, item["produto_id"], item["quantidade"], item["preco"])
        )

    db.execute("DELETE FROM public.carrinho")
    db.commit()

    return {
        "message": "Compra finalizada com sucesso!",
        "pedido_id": pedido_id,
        "total": float(total)
    }


@router.get("/pedidos")
def listar_pedidos(db: Session = Depends(get_db)):
    pedidos = db.execute("SELECT * FROM public.pedidos ORDER BY id DESC").fetchall()
    resultado = []

    for pedido in pedidos:
        itens = db.execute(
            '''
            SELECT p.nome, i.quantidade, i.preco_unitario
            FROM public.pedidos_itens i
            JOIN public.produtos_loja p ON p.id = i.produto_id
            WHERE i.pedido_id = %s
            ''',
            (pedido["id"],)
        ).fetchall()

        resultado.append({
            "id": pedido["id"],
            "data": pedido["data"],
            "total": float(pedido["total"]),
            "itens": [dict(item) for item in itens]
        })

    return resultado
