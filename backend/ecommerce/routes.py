from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .models import ProdutoLoja
from .schemas import ProdutoCreate, Produto
from database import get_db

router = APIRouter(prefix="/ecommerce", tags=["ecommerce"])

@router.get("/produtos", response_model=list[Produto])
def listar_produtos(db: Session = Depends(get_db)):
    return db.query(ProdutoLoja).filter(ProdutoLoja.ativo == True).all()

@router.post("/produtos", response_model=Produto)
def criar_produto(produto: ProdutoCreate, db: Session = Depends(get_db)):
    db_produto = ProdutoLoja(**produto.dict())
    db.add(db_produto)
    db.commit()
    db.refresh(db_produto)
    return db_produto
