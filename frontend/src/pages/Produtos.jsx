import React, { useEffect, useState } from "react";
import Plot from "react-plotly.js";
import api from "../services/api";
import { useOutletContext } from "react-router-dom";

const Produtos = () => {
  const { startDate, endDate } = useOutletContext();
  const [produtos, setProdutos] = useState([]);
  const [produtoCampeao, setProdutoCampeao] = useState("-");
  const [faturamentoProduto, setFaturamentoProduto] = useState(0);
  const [maisDevolvido, setMaisDevolvido] = useState("-");
  const [qtdDevolucao, setQtdDevolucao] = useState(0);
  const [totalVendidos, setTotalVendidos] = useState(0);
  const [produtosSemVenda, setProdutosSemVenda] = useState(0);
  const [capitalInvestido, setCapitalInvestido] = useState(0);
  const [potencialRetorno, setPotencialRetorno] = useState(0);
  const [mapaData, setMapaData] = useState([]);
  const [statusFiltro, setStatusFiltro] = useState("Todos");
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");
  const schema = localStorage.getItem("selectedSchema");

  const headers = {
    Authorization: `Bearer ${token}`,
    "x-schema": schema,
  };

  const carregarDados = async () => {
    if (!startDate || !endDate) {
      console.warn("⛔ Datas ainda não definidas.");
      return;
    }

    const start_date = startDate.toISOString().split("T")[0];
    const end_date = endDate.toISOString().split("T")[0];

    console.log("📦 Buscando produtos:", {
      start_date,
      end_date,
      statusFiltro,
    });

    try {
      setLoading(true);

      const [
        campeao,
        devolvido,
        vendidos,
        semVenda,
        listaProdutos,
        estados,
      ] = await Promise.all([
        api.get(`/api/produto-campeao?start_date=${start_date}&end_date=${end_date}`, { headers }),
        api.get(`/api/produto-mais-devolvido?start_date=${start_date}&end_date=${end_date}`, { headers }),
        api.get(`/api/total-vendidos?start_date=${start_date}&end_date=${end_date}`, { headers }),
        api.get(`/api/sem-venda?start_date=${start_date}&end_date=${end_date}`, { headers }),
        api.get(`/api/produtos?status=${statusFiltro}&start_date=${start_date}&end_date=${end_date}`, { headers }),
        api.get(`/api/faturamento-por-estado?start_date=${start_date}&end_date=${end_date}`, { headers }),
      ]);

      setProdutoCampeao(campeao.data?.nome || "-");
      setFaturamentoProduto(campeao.data?.total || 0);
      setMaisDevolvido(devolvido.data?.nome || "-");
      setQtdDevolucao(devolvido.data?.qtd || 0);
      setTotalVendidos(vendidos.data?.total || 0);
      setProdutosSemVenda(semVenda.data?.total || 0);
      setProdutos(listaProdutos.data || []);
      setMapaData(estados.data || []);

      let capital = 0;
      let retorno = 0;
      (listaProdutos.data || []).forEach((p) => {
        capital += p.estoque * (p.preco_custo_medio || 0);
        retorno += p.estoque * p.preco;
      });

      setCapitalInvestido(capital);
      setPotencialRetorno(retorno);
    } catch (err) {
      console.error("🔥 Erro ao buscar dados dos produtos:", err?.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, [statusFiltro, startDate, endDate]);

  if (loading) return <div className="text-white">🔄 Carregando dados...</div>;

  return (
    <div className="dashboard-container">
      <h1 className="text-3xl">📦 Produtos</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card title="🏆 Produto Campeão de Vendas" value={produtoCampeao} extra={`R$ ${faturamentoProduto.toFixed(2)}`} />
        <Card title="📥 Produto Mais Devolvido" value={maisDevolvido} extra={`${qtdDevolucao} devoluções`} />
        <Card title="📦 Produtos Vendidos" value={`${totalVendidos} vendidos`} />
        <Card title="⛔ Produtos Sem Venda" value={`${produtosSemVenda} produtos`} />
        <Card title="🏦 Capital Investido" value={`R$ ${capitalInvestido.toFixed(2)}`} />
        <Card title="📈 Potencial de Retorno" value={`R$ ${potencialRetorno.toFixed(2)}`} />
      </div>

      <div className="bg-dark rounded-lg p-4 mb-6 text-white">
        <h2 className="graph-title">🗺️ Faturamento por Estado</h2>
        <Plot
          data={[
            {
              type: "choropleth",
              locationmode: "ISO-3",
              locations: mapaData.map((e) => e.estado),
              z: mapaData.map((e) => e.valor),
              colorscale: "YlOrRd",
              text: mapaData.map((e) => `${e.estado}: R$ ${e.valor.toFixed(2)}`),
            },
          ]}
          layout={{
            geo: { scope: "south america" },
            paper_bgcolor: "#1e1e1e",
            plot_bgcolor: "#1e1e1e",
            font: { color: "white" },
            margin: { t: 0, b: 0 },
          }}
          style={{ width: "100%", height: "400px" }}
        />
      </div>

      <div className="table-container">
        <h2 className="graph-title">📄 Lista de Produtos</h2>
        <div className="flex gap-4 mb-4">
          <select value={statusFiltro} onChange={(e) => setStatusFiltro(e.target.value)}>
            <option value="Todos">Todos</option>
            <option value="Vendidos">Vendidos</option>
            <option value="Sem Venda">Sem Venda</option>
          </select>
        </div>
        <table>
          <thead>
            <tr>
              <th>SKU</th>
              <th>Nome</th>
              <th>Estoque</th>
              <th>Preço</th>
              <th>CMV</th>
              <th>Lucro</th>
              <th>Sugestão</th>
            </tr>
          </thead>
          <tbody>
            {produtos.map((p, i) => (
              <tr key={i}>
                <td>{p.codigo}</td>
                <td>{p.nome}</td>
                <td>{p.estoque}</td>
                <td>R$ {p.preco}</td>
                <td>{p.preco_custo_medio ? `R$ ${p.preco_custo_medio}` : "-"}</td>
                <td>-</td>
                <td>{p.preco_custo_medio ? `R$ ${(p.preco_custo_medio * 2.6).toFixed(2)}` : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const Card = ({ title, value, extra }) => (
  <div className="card">
    <h2>{title}</h2>
    <h3>{value}</h3>
    {extra && <p>{extra}</p>}
  </div>
);

export default Produtos;
