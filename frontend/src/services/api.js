import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000", // ajuste se necessário
});

// Interceptor de requisição: adiciona token automaticamente
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Interceptor de resposta: verifica se o token expirou ou é inválido
api.interceptors.response.use(
  response => response,
  error => {
    if (
      error.response &&
      error.response.status === 401 &&
      (error.response.data?.detail === "Token inválido" || error.response.data?.detail === "Token expirado")
    ) {
      localStorage.removeItem("token");
      localStorage.removeItem("selectedSchema");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;