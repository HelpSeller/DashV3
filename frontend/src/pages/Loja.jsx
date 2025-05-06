import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

export default function Loja() {
  const [produtos, setProdutos] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:8000/ecommerce/produtos').then((res) => {
      setProdutos(res.data);
    });
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-4">Catálogo de Produtos</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {produtos.map((produto) => (
          <div
            key={produto.id}
            className="bg-white rounded-2xl shadow-md p-4 flex flex-col justify-between"
          >
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-2">{produto.nome}</h2>
              <p className="text-sm text-gray-600 mb-4">
                {produto.descricao?.slice(0, 140) || 'Sem descrição disponível.'}
              </p>
            </div>
            <div className="mt-auto">
              <p className="text-center text-green-600 font-semibold text-lg mb-2">
                R$ {Number(produto.preco).toFixed(2)}
              </p>
              <Link
                to={`/produto/${produto.id}`}
                className="block text-center text-sm bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
              >
                Ver detalhes
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
