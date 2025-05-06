import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function SelectSchema() {
  const navigate = useNavigate();
  const [schemas, setSchemas] = useState([]);
  const [selected, setSelected] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSchemas = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        const res = await api.get("/schemas", {
          headers: { Authorization: `Bearer ${token}` }
        });

        setSchemas(res.data || []);
      } catch (err) {
        console.error("Erro ao buscar schemas:", err);
        setError("Falha ao buscar schemas.");
      }
    };

    fetchSchemas();
  }, []);

  const handleConfirm = async () => {
    if (!selected) {
      setError("Selecione um schema para continuar.");
      return;
    }
  
    const token = localStorage.getItem("token");
  
    try {
      const res = await api.post("/auth/select-schema", { schema: selected }, {
        headers: { Authorization: `Bearer ${token}` }
      });
  
      const novoToken = res.data.access_token;
  
      // Substitui o token antigo pelo novo, com o schema embutido
      localStorage.setItem("token", novoToken);
      localStorage.setItem("selectedSchema", selected);
  
      navigate("/dashboard");
    } catch (err) {
      console.error("Erro ao selecionar schema:", err);
      setError("Erro ao selecionar o schema. Tente novamente.");
    }
  };

  return (
    <div className="select-container">
      <h2>📁 Escolha o schema para acessar:</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <select value={selected} onChange={(e) => setSelected(e.target.value)}>
        <option value="">-- Selecione --</option>
        {schemas.map((schema, idx) => (
          <option key={idx} value={schema}>
            {schema}
          </option>
        ))}
      </select>

      <button onClick={handleConfirm}>Confirmar</button>
    </div>
  );
}
