from sqlalchemy import Column, Integer, String, Text, Numeric, Boolean, TIMESTAMP, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class ProdutoLoja(Base):
    __tablename__ = "produtos_loja"
    __table_args__ = {"schema": "public"}

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String, unique=True, nullable=False)
    nome = Column(String, nullable=False)
    descricao = Column(Text)
    preco = Column(Numeric(10, 2), nullable=False)
    estoque = Column(Integer, default=0)
    categoria_id = Column(Integer, ForeignKey("public.categorias.id"), nullable=True)
    ativo = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
