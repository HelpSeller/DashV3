import React from "react";
import { useCarrinhoStore } from "@/store/carrinho";
import { useNavigate } from "react-router-dom";

export default function Carrinho() {
  const itens = useCarrinhoStore((state) => state.itens);
  const removerProduto = useCarrinhoStore((state) => state.removerProduto);
  const total = useCarrinhoStore((state) => state.totalValor());
  const navigate = useNavigate();

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold mb-4">Seu Carrinho</h1>

      {itens.length === 0 ? (
        <p className="text-gray-300">Seu carrinho está vazio.</p>
      ) : (
        <div className="space-y-4">
          {itens.map((item) => (
            <div
              key={item.id}
              className="bg-gray-800 p-4 rounded-xl flex justify-between items-center"
            >
              <div>
                <h2 className="text-lg font-semibold">{item.nome}</h2>
                <p className="text-gray-400 text-sm">
                  {item.quantidade}x R$ {Number(item.preco).toFixed(2)}
                </p>
              </div>
              <button
                onClick={() => removerProduto(item.id)}
                className="text-red-400 hover:text-red-600 text-sm"
              >
                Remover
              </button>
            </div>
          ))}

          <div className="mt-6 text-right">
            <p className="text-lg font-bold text-green-400">
              Total: R$ {Number(total).toFixed(2)}
            </p>
            <button
              onClick={() => navigate("/checkout")}
              className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl transition"
            >
              Finalizar Compra
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
