import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Login from "./pages/Login"
import Dashboard from "./pages/Dashboard"
import MasterPanel from "./pages/MasterPanel"
import ProtectedRoute from "./components/ProtectedRoute"
import SelectSchema from "./pages/SelectSchema" // ✅ Esta linha é ESSENCIAL

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/select-schema" element={<ProtectedRoute><SelectSchema /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/master" element={<ProtectedRoute><MasterPanel /></ProtectedRoute>} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      </Routes>
    </Router>
  )
}

export default App
