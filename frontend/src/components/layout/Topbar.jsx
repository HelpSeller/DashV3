// src/components/Topbar.jsx
import NotificationBell from "../shared/NotificationBell";
import "./Topbar.css";
import { ShoppingCart } from "lucide-react";
import { useCarrinhoStore } from "../../store/carrinho";
import { useNavigate } from "react-router-dom";

export default function Topbar({ toggleSidebar, showDateFilter, onOpenFilter }) {
  const schema = localStorage.getItem("selectedSchema");
  const totalItens = useCarrinhoStore((state) => state.totalItens());
  const navigate = useNavigate();

  return (
    <header className="topbar">
      <div className="topbar-inner">

        {/* Esquerda: menu + logo */}
        <div className="topbar-left">
          <button className="menu-button" onClick={toggleSidebar} title="Abrir menu">
            <i className="fas fa-bars"></i>
          </button>
          <span className="logo-text">Help Seller</span>
        </div>

        {/* Direita: notificações + schema + filtro + carrinho */}
        <div className="topbar-right">
          <div className="topbar-actions">
            <NotificationBell />

            {schema && (
              <span className="schema-label">
                Schema: <strong>{schema}</strong>
              </span>
            )}

            {showDateFilter && (
              <button className="btn-primary" onClick={onOpenFilter}>
                <i className="fas fa-calendar-alt"></i> Filtrar por Período
              </button>
            )}

            {/* Carrinho */}
            <button
              onClick={() => navigate("/carrinho")}
              className="cart-button"
              title="Ir para o carrinho"
            >
              <ShoppingCart />
              {totalItens > 0 && (
                <span className="cart-badge">{totalItens}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
