import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './SelectSchema.css';

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

  const handleConfirm = () => {
    if (!selected) {
      setError("Selecione um schema para continuar.");
      return;
    }

    // ✅ Salva schema e redireciona
    localStorage.setItem("selectedSchema", selected);
    navigate("/dashboard");
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
