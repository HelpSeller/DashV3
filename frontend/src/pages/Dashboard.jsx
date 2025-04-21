import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Plot from "react-plotly.js";
import CountUp from "react-countup"; // animação dos números
import "./Dashboard.css";

export default function Dashboard() {
  const navigate = useNavigate();
  const [faturamento, setFaturamento] = useState(null);
  const [frete, setFrete] = useState(null);
  const [devolucao, setDevolucao] = useState(null);
  const [produtosSemVenda, setProdutosSemVenda] = useState(0);
  const [notificacoes, setNotificacoes] = useState(3);
  const [graficoCategoria, setGraficoCategoria] = useState(null);
  const [graficoSubcategoria, setGraficoSubcategoria] = useState(null);
  const [graficoMensal, setGraficoMensal] = useState(null);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");
  const schema = localStorage.getItem("selectedSchema");

  useEffect(() => {
    if (!token || !schema) {
      navigate("/login");
      return;
    }

    const fetchData = async () => {
      try {
        const headers = {
          Authorization: `Bearer ${token}`,
          "x-schema": schema,
        };

        const [dashRes, catRes] = await Promise.all([
          api.get("/dashboard", { headers }),
          api.get("/grafico-categorias", { headers }),
        ]);

        setFaturamento(dashRes.data.faturamento);
        setFrete(dashRes.data.frete);
        setDevolucao(dashRes.data.devolucao);
        setProdutosSemVenda(dashRes.data.produtosSemVenda);
        setGraficoCategoria(catRes.data);
        setGraficoMensal(dashRes.data.grafico_mensal);
      } catch (err) {
        console.error("Erro ao carregar dashboard:", err);
        if (err.response?.status === 401) {
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCategoriaClick = async (categoria) => {
    try {
      const res = await api.get("/grafico-subcategorias", {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-schema": schema,
        },
        params: { categoria },
      });
      setGraficoSubcategoria(res.data);
    } catch (err) {
      console.error("Erro ao carregar subcategorias", err);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Carregando dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-row">
        <Card
          title="💰 Faturamento"
          value={faturamento?.valor_atual}
          sub={`↑ ${faturamento?.indicador || 0}`}
          color={faturamento?.cor || "text-white"}
        />
        <Card
          title="🚚 Frete"
          value={frete?.valor_atual}
          sub=""
          color="text-green-500"
        />
        <Card
          title="🔁 Devoluções"
          value={devolucao?.valor_atual}
          sub={`📦 ${devolucao?.qtd || 0} devoluções`}
          color="text-red-500"
        />
        <Card
          title="📦 Produtos Sem Vendas"
          value={produtosSemVenda}
          sub="Com estoque > 0"
          color="text-yellow-400"
        />
        <Card
          title="🔔 Notificações"
          value={notificacoes}
          sub="Gerencie tarefas"
          color="text-white"
          isButton
        />
      </div>

      <div className="dashboard-graphs">
        <div className="dashboard-column">
          <h3 className="graph-title">📊 Categorias</h3>
          {graficoCategoria && (
            <Plot
              data={graficoCategoria.data.map((d) => ({
                ...d,
                pull: 0.05,
                marker: { line: { color: "#fff", width: 2 } },
                hoverinfo: "label+percent+value",
                sort: false,
                automargin: true,
              }))}
              layout={{
                ...graficoCategoria.layout,
                height: 350,
                showlegend: true,
                paper_bgcolor: "#1a2433",
                plot_bgcolor: "#1a2433",
                font: { color: "white" },
              }}
              onClick={(event) => {
                const categoriaClicada = event.points[0]?.label;
                if (categoriaClicada) handleCategoriaClick(categoriaClicada);
              }}
              config={{ displayModeBar: false }}
            />
          )}
        </div>
        <div className="dashboard-column">
          <h3 className="graph-title">📁 Subcategorias</h3>
          {graficoSubcategoria ? (
            <Plot
              data={graficoSubcategoria.data.map((d) => ({
                ...d,
                marker: { line: { color: "#fff", width: 2 } },
                hoverinfo: "label+percent+value",
              }))}
              layout={{
                ...graficoSubcategoria.layout,
                height: 350,
                showlegend: true,
                paper_bgcolor: "#1a2433",
                plot_bgcolor: "#1a2433",
                font: { color: "white" },
              }}
              config={{ displayModeBar: false }}
            />
          ) : (
            <div className="empty-chart-placeholder">
              <p>👈 Selecione uma categoria para ver as subcategorias</p>
            </div>
          )}
        </div>
      </div>

      <div className="dashboard-full">
        {graficoMensal && (
          <Plot
            data={graficoMensal.data}
            layout={{
              ...graficoMensal.layout,
              paper_bgcolor: "#1a2433",
              plot_bgcolor: "#1a2433",
              font: { color: "white" },
              title: {
                text: "📈 Faturamento Mensal",
                font: {
                  size: 20,
                  color: "#fff",
                  family: "Segoe UI",
                },
                xref: "container",
                x: 0.05,
              },
              xaxis: {
                tickfont: { color: "#ccc" },
                title: { text: "Mês", font: { color: "#ccc" } },
              },
              yaxis: {
                tickfont: { color: "#ccc" },
                title: { text: "Faturamento (R$)", font: { color: "#ccc" } },
              },
              height: 400,
            }}
            config={{ displayModeBar: false }}
          />
        )}
      </div>
    </div>
  );
}

function Card({ title, value, sub, color, isButton }) {
  return (
    <div className="dashboard-card">
      <p className="card-title">{title}</p>
      <p className={`card-value ${color}`}>
        <CountUp
          start={0}
          end={parseFloat(value || 0)}
          duration={1.2}
          separator="."
          decimal=","
          prefix={title.includes("R$") || title.includes("Faturamento") ? "R$ " : ""}
        />
      </p>
      {isButton ? (
        <button
          className="btn-ver"
          onClick={() => (window.location.href = "/notificacoes")}
        >
          Ver notificações
        </button>
      ) : (
        <p className="card-sub">{sub}</p>
      )}
    </div>
  );
}
