import React, { useEffect, useState } from "react";
import api from "../services/api";

const Carrinho = () => {
  const [itens, setItens] = useState([]);
  const [total, setTotal] = useState(0);
  const [finalizado, setFinalizado] = useState(false);
  const [pedidoInfo, setPedidoInfo] = useState(null);

  useEffect(() => {
    buscarCarrinho();
  }, []);

  const buscarCarrinho = async () => {
    try {
      const response = await api.get("/loja/carrinho");
      const dados = response.data;
      setItens(dados);

      const totalCalculado = dados.reduce(
        (acc, item) => acc + item.preco * item.quantidade,
        0
      );
      setTotal(totalCalculado);
    } catch (error) {
      console.error("Erro ao buscar carrinho:", error);
    }
  };

  const finalizarCompra = async () => {
    try {
      const response = await api.post("/loja/carrinho/finalizar");
      setFinalizado(true);
      setItens([]);
      setTotal(0);
      setPedidoInfo(response.data);
      alert(`Compra finalizada! Pedido #${response.data.pedido_id} no valor de R$ ${response.data.total.toFixed(2)}`);
    } catch (error) {
      console.error("Erro ao finalizar compra:", error);
      alert("Erro ao finalizar a compra.");
    }
  };

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold mb-6">🛒 Meu Carrinho</h1>

      {itens.length === 0 && !finalizado ? (
        <p className="text-gray-400">Seu carrinho está vazio.</p>
      ) : (
        <>
          <div className="space-y-4">
            {itens.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center bg-[#1f1f1f] p-4 rounded-lg"
              >
                <div>
                  <h2 className="text-lg font-semibold">{item.nome}</h2>
                  <p className="text-sm text-gray-400">{item.descricao}</p>
                  <p className="text-sm mt-1">
                    Quantidade: <strong>{item.quantidade}</strong>
                  </p>
                </div>
                <div className="text-green-400 font-bold">
                  R$ {(item.preco * item.quantidade).toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 text-right">
            <p className="text-xl font-semibold">
              Total: <span className="text-green-500">R$ {total.toFixed(2)}</span>
            </p>
            <button
              onClick={finalizarCompra}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded"
            >
              Finalizar Compra
            </button>
          </div>
        </>
      )}

      {finalizado && pedidoInfo && (
        <div className="mt-8 p-4 bg-green-900/20 border border-green-700 rounded-lg">
          <h2 className="text-lg font-semibold text-green-400 mb-1">
            ✅ Compra finalizada com sucesso!
          </h2>
          <p className="text-sm text-gray-300">
            Número do pedido: <strong>#{pedidoInfo.pedido_id}</strong><br />
            Valor total: <strong>R$ {pedidoInfo.total.toFixed(2)}</strong>
          </p>
        </div>
      )}
    </div>
  );
};

export default Carrinho;
