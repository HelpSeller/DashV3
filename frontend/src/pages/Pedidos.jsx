import React, { useEffect, useState } from "react";
import api from "../services/api";

const Pedidos = () => {
  const [pedidos, setPedidos] = useState([]);

  useEffect(() => {
    const fetchPedidos = async () => {
      try {
        const response = await api.get("/loja/pedidos");
        setPedidos(response.data);
      } catch (error) {
        console.error("Erro ao buscar pedidos:", error);
      }
    };

    fetchPedidos();
  }, []);

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold mb-6">📦 Histórico de Pedidos</h1>

      {pedidos.length === 0 ? (
        <p className="text-gray-400">Nenhum pedido encontrado.</p>
      ) : (
        pedidos.map((pedido) => (
          <div key={pedido.id} className="mb-6 p-4 bg-[#1f1f1f] rounded-lg border border-[#333]">
            <div className="flex justify-between mb-2">
              <h2 className="text-lg font-semibold text-purple-300">
                Pedido #{pedido.id}
              </h2>
              <p className="text-sm text-gray-400">
                {new Date(pedido.data).toLocaleString("pt-BR")}
              </p>
            </div>
            <ul className="text-sm text-gray-200 mb-2">
              {pedido.itens.map((item, index) => (
                <li key={index}>
                  {item.quantidade}x {item.nome} —{" "}
                  <span className="text-green-400">
                    R$ {(item.preco_unitario * item.quantidade).toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-right font-bold text-green-400">
              Total: R$ {pedido.total.toFixed(2)}
            </p>
          </div>
        ))
      )}
    </div>
  );
};

export default Pedidos;
