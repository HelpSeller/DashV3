// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import MasterPanel from "./pages/MasterPanel";
import ProtectedRoute from "./components/ProtectedRoute";
import SelectSchema from "./pages/SelectSchema";
import LayoutPrivate from "./components/layout/LayoutPrivate";
import Produtos from "./pages/Produtos";
import Calculadora from './pages/Calculadora';
import Loja from './pages/Loja';
import Produto from "./pages/Produto_Loja";
import Checkout from './pages/Checkout';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/select-schema"
          element={
            <ProtectedRoute>
              <SelectSchema />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <LayoutPrivate showDateFilter={true} />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
        </Route>

        <Route
          path="/produtos"
          element={
            <ProtectedRoute>
              <LayoutPrivate showDateFilter={true} />
            </ProtectedRoute>
          }
        >
          <Route index element={<Produtos />} />
        </Route>

        <Route
          path="/vendas"
          element={
            <ProtectedRoute>
              <LayoutPrivate showDateFilter={true}>
                <div>💳 Página Vendas (em construção)</div>
              </LayoutPrivate>
            </ProtectedRoute>
          }
        />
        <Route
          path="/notificacoes"
          element={
            <ProtectedRoute>
              <LayoutPrivate showDateFilter={false}>
                <div>🔔 Página Notificações</div>
              </LayoutPrivate>
            </ProtectedRoute>
          }
        />
        <Route
          path="/perfil"
          element={
            <ProtectedRoute>
              <LayoutPrivate showDateFilter={false}>
                <div>👤 Página Perfil</div>
              </LayoutPrivate>
            </ProtectedRoute>
          }
        />
        <Route
          path="/master"
          element={
            <ProtectedRoute>
              <LayoutPrivate showDateFilter={false}>
                <MasterPanel />
              </LayoutPrivate>
            </ProtectedRoute>
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <LayoutPrivate showDateFilter={true}>
              </LayoutPrivate>
            </ProtectedRoute>
          }
        />
        <Route
          path="/calculadora"
          element={
            <ProtectedRoute>
              <LayoutPrivate showDateFilter={false} />
            </ProtectedRoute>
          }
        >
          <Route index element={<Calculadora />} />
        </Route>

        <Route
          path="/loja"
          element={
            <ProtectedRoute>
              <LayoutPrivate showDateFilter={false}>
                <Loja />
              </LayoutPrivate>
            </ProtectedRoute>
          }
        />
        <Route
          path="/produto/:id"
          element={
            <ProtectedRoute>
              <LayoutPrivate showDateFilter={false}>
                <Produto />
              </LayoutPrivate>
            </ProtectedRoute>
          }
        />
        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <LayoutPrivate showDateFilter={false}>
                <Checkout />
              </LayoutPrivate>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
