import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { useCarrinhoStore } from "../store/carrinho";

export default function Produto_Loja() {
  const { id } = useParams();
  const [produto, setProduto] = useState(null);
  const adicionarProduto = useCarrinhoStore((state) => state.adicionarProduto);

  useEffect(() => {
    axios.get(`http://localhost:8000/ecommerce/produtos`)
      .then((res) => {
        const encontrado = res.data.find((p) => p.id === parseInt(id));
        setProduto(encontrado || null);
      });
  }, [id]);

  if (!produto) {
    return <div className="text-white p-6">Carregando produto...</div>;
  }

  return (
    <div className="p-6 flex flex-col md:flex-row gap-8 text-white">
      {/* Simulação de imagem */}
      <div className="bg-gray-800 rounded-xl w-full md:w-1/3 h-64 flex items-center justify-center text-4xl">
        🛒
      </div>

      {/* Detalhes */}
      <div className="flex-1">
        <h1 className="text-3xl font-bold mb-2">{produto.nome}</h1>
        <p className="text-gray-300 mb-4">{produto.descricao}</p>

        <p className="text-green-400 text-2xl font-semibold mb-6">
          R$ {Number(produto.preco).toFixed(2)}
        </p>

        <button
          onClick={() => adicionarProduto(produto)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl transition"
        >
          Adicionar ao Carrinho
        </button>
      </div>
    </div>
  );
}
