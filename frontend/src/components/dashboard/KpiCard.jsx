// src/components/dashboard/KpiCard.jsx
import CountUp from "react-countup";

export default function KpiCard({ title, value, sub, color, isButton }) {
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
          prefix={title.includes("Frete") || title.includes("Faturamento") || title.includes("Devoluções") ? "R$ " : ""}
        />
      </p>
      {isButton ? (
        <button className="btn-ver" onClick={() => (window.location.href = "/notificacoes")}>
          Ver notificações
        </button>
      ) : (
        <p className="card-sub">{sub}</p>
      )}
    </div>
  );
}
