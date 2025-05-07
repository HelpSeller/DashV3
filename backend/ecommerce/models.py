from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from database import Base  # use o Base declarado em database.py

class ProdutoLoja(Base):
    __tablename__ = "produtos_loja"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String, unique=True, nullable=False)
    nome = Column(String, nullable=False)
    descricao = Column(String, nullable=True)
    preco = Column(Float, nullable=False)
    estoque = Column(Integer, default=0)
    categoria_id = Column(Integer, ForeignKey("categorias.id"), nullable=True)
    ativo = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())

    # Exemplo de relacionamento (opcional)
    categoria = relationship("Categoria", back_populates="produtos", lazy="joined", uselist=False)
