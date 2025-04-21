import { Navigate } from 'react-router-dom'

// Função utilitária para checar token
const isAuthenticated = () => {
  const token = localStorage.getItem('token')
  return !!token
}

export default function ProtectedRoute({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }
  return children
}
