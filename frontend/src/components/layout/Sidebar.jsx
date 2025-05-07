import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import "./Sidebar.css";

export default function Sidebar({ isOpen, toggleSidebar }) {
  const navigate = useNavigate();
  const [nomeUsuario, setNomeUsuario] = useState("Usuário");
  const [modulosAtivos, setModulosAtivos] = useState([]);

  useEffect(() => {
    const username = localStorage.getItem("username") || "Usuário";
    setNomeUsuario(username);

    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        const modulos = decoded.modulos_ativos || [];
        setModulosAtivos(modulos);
      } catch (err) {
        console.error("Erro ao decodificar token:", err);
        setModulosAtivos([]);
      }
    }
  }, []);

  const links = [
    { label: "Dashboard", to: "/dashboard" },
    { label: "Produtos", to: "/produtos" },
    { label: "Vendas", to: "/vendas" },
    { label: "Financeiro", to: "/financeiro" },
    { label: "Agendar Consultoria", to: "/agendamento"},
    { label: "Notificações", to: "/notificacoes" },
    { label: "Loja de Extensões", to: "/loja" },
    { label: "Ferramentas", to: "/pedidos" },
    { label: "Meu Perfil", to: "/perfil" },
  ];

  // Adiciona Calculadora se estiver habilitado no token
  if (modulosAtivos.includes("calculadora")) {
    links.push({ label: "Calculadora", to: "/calculadora" });
  }

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <>
      <div
        className={`sidebar-overlay ${isOpen ? "visible" : "hidden"}`}
        onClick={toggleSidebar}
      />
      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <div className="username">{nomeUsuario}</div>
          <div
            className="profile-link"
            onClick={() => {
              navigate("/perfil");
              toggleSidebar();
            }}
          >
            Ver perfil
          </div>
        </div>

        <nav className="sidebar-links">
          {links.map((link) => (
            <div
              key={link.to}
              className="sidebar-link"
              onClick={() => {
                navigate(link.to);
                toggleSidebar();
              }}
            >
              {link.label}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
