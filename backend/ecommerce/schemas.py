from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ProdutoLojaSchema(BaseModel):
    id: int
    codigo: str
    nome: str
    descricao: Optional[str] = None
    preco: float
    estoque: int
    categoria_id: Optional[int] = None
    ativo: bool
    created_at: datetime

    class Config:
        orm_mode = True
