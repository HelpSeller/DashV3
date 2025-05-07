import React, { useEffect, useState } from "react";
import api from "../services/api";

const Loja = () => {
  const [produtos, setProdutos] = useState([]);
  const [filtroBusca, setFiltroBusca] = useState([]);

  useEffect(() => {
    buscarProdutos();
  }, []);

  const buscarProdutos = async () => {
    try {
      const response = await api.get("/loja/public");
      setProdutos(response.data);
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
    }
  };

  const adicionarAoCarrinho = async (produtoId) => {
    try {
      await api.post("/loja/carrinho/adicionar", {
        produto_id: produtoId,
        quantidade: 1,
      });
      alert("Produto adicionado ao carrinho!");
    } catch (error) {
      console.error("Erro ao adicionar ao carrinho:", error);
      alert("Erro ao adicionar ao carrinho.");
    }
  };

  const produtosFiltrados = produtos.filter((produto) =>
    produto.nome.toLowerCase().includes(filtroBusca.toLowerCase())
  );

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold mb-4">🧩 Loja de Extensões</h1>

      <input
        type="text"
        placeholder="Buscar produto..."
        value={filtroBusca}
        onChange={(e) => setFiltroBusca(e.target.value)}
        className="mb-6 w-full md:w-1/2 px-4 py-2 rounded bg-[#2a2aa] text-white border border-[#444] focus:outline-none focus:ring-2 focus:ring-purple-500"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {produtosFiltrados.length === 0 ? (
          <p className="text-gray-400">Nenhum produto encontrado.</p>
        ) : (
          produtosFiltrados.map((produto) => (
            <div
              key={produto.id}
              className="bg-[#1f1f1f] p-5 rounded-xl shadow-md border border-[#2d2d2d] hover:scale-[1.02] transition-transform"
            >
              <h2 className="text-lg font-semibold text-purple-300 mb-1">
                {produto.nome}
              </h2>
              <p className="text-sm text-gray-300">{produto.descricao}</p>
              <p className="mt-3 font-bold text-green-400 text-lg">
                R$ {produto.preco.toFixed(2)}
              </p>
              <button
                onClick={() => adicionarAoCarrinho(produto.id)}
                className="mt-4 w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded"
              >
                Adicionar ao carrinho
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Loja;
