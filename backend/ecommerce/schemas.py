from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# 🟩 Schema de entrada (para criação de produtos)
class ProdutoCreate(BaseModel):
    codigo: str
    nome: str
    descricao: Optional[str] = None
    preco: float
    estoque: int
    categoria_id: Optional[int] = None
    ativo: bool = True

# 🟦 Schema completo com ID e created_at (retorno no GET/POST)
class Produto(ProdutoCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True  # substitui orm_mode no Pydantic v2
