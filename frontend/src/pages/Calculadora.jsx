import { useState, useEffect } from 'react';
import api from '../services/api';
import './Calculadora.css';

const marketplaces = {
  'Mercado Livre': 16,
  'Shopee': 14,
  'Amazon': 17,
  'Magazine Luiza': 17,
  'Netshoes': 20,
  'Nuvem Shop': 5
};

export default function Calculadora() {
  const [historico, setHistorico] = useState([]);
  const [aba, setAba] = useState('calculadora');
  const [form, setForm] = useState({
    sku: '',
    marketplace: '',
    comissaoMarketplace: '',
    custoAquisicao: '',
    impostosCompra: '',
    difal: '',
    frete: '',
    embalagem: '',
    custoFixo: '',
    faturamentoEstimado: '',
    despesaFixaPct: '',
    markup: '',
    comissaoVendedor: '',
    comissaoHelpSeller: ''
  });

  useEffect(() => {
    if (aba === 'historico') {
      const token = localStorage.getItem("token");
      api.get('/api/historico', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => setHistorico(res.data || []))
      .catch(err => console.error("Erro ao buscar histórico:", err));
    }
  }, [aba]);

  const [resultado, setResultado] = useState(null);
  const [sugestoes, setSugestoes] = useState([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  let debounceTimeout = null;

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));

    if (name === 'marketplace') {
      const comissao = marketplaces[value];
      if (comissao) {
        setForm(prev => ({ ...prev, marketplace: value, comissaoMarketplace: comissao }));
      }
    }

    if (name === 'sku') {
      setProdutoSelecionado(null);
      buscarSugestoes(value);
    }
  };

  const buscarSugestoes = (texto) => {
    if (texto.length < 2) {
      setSugestoes([]);
      return;
    }

    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(async () => {
      try {
        const res = await api.get(`/api/calculadora/skus?filtro=${texto}`);
        setSugestoes(res.data || []);
      } catch (err) {
        console.error("Erro ao buscar sugestões:", err);
      }
    }, 300);
  };

  const handleSelectProduto = async (codigo, nome) => {
    setForm(prev => ({ ...prev, sku: codigo }));
    setProdutoSelecionado(nome);
    setSugestoes([]);

    try {
      const res = await api.get(`/api/calculadora/produtos?sku=${codigo}`);
      if (res.data?.[0]?.custoMedio) {
        setForm(prev => ({ ...prev, custoAquisicao: res.data[0].custoMedio }));
      }
    } catch (err) {
      console.error("Erro ao buscar produto por código:", err);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");

      const dados = {
        ...form,
        comissaoMarketplace: parseFloat(form.comissaoMarketplace || 0),
        custoAquisicao: parseFloat(form.custoAquisicao || 0),
        impostosCompra: parseFloat(form.impostosCompra || 0),
        difal: parseFloat(form.difal || 0),
        frete: parseFloat(form.frete || 0),
        embalagem: parseFloat(form.embalagem || 0),
        custoFixo: parseFloat(form.custoFixo || 0),
        faturamentoEstimado: parseFloat(form.faturamentoEstimado || 0),
        despesaFixaPct: parseFloat(form.despesaFixaPct || 0),
        markup: parseFloat(form.markup || 0),
        comissaoVendedor: parseFloat(form.comissaoVendedor || 0),
        comissaoHelpSeller: parseFloat(form.comissaoHelpSeller || 0)
      };

      const res = await api.post('/api/calcular', dados, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setResultado(res.data);
    } catch (error) {
      alert("Erro ao calcular: " + (error.response?.data?.detail || "erro desconhecido"));
    }
  };

  return (
    <div className="calculadora-container">
      <div className="abas-wrapper">
        <div className="abas-bg">
          <button
            onClick={() => setAba('calculadora')}
            className={`aba ${aba === 'calculadora' ? 'ativa' : ''}`}
          >Calculadora</button>
          <button
            onClick={() => setAba('historico')}
            className={`aba ${aba === 'historico' ? 'ativa' : ''}`}
          >Histórico</button>
        </div>
      </div>

      <h2>Calculadora de Preços - Simples Nacional</h2>

      {aba === 'calculadora' && (
        <form onSubmit={handleSubmit} className="calculadora-form">
          <div className="row">
            <div style={{ position: 'relative' }}>
              <label>SKU do Produto:</label>
              <input name="sku" placeholder="Ex: TENIS-123" value={form.sku} onChange={handleChange} autoComplete="off" />

              {sugestoes.length > 0 && (
                <ul className="sugestoes-lista">
                  {sugestoes.map((item, index) => (
                    <li key={index} onClick={() => handleSelectProduto(item.codigo, item.nome)}>
                      {item.codigo} - {item.nome}
                    </li>
                  ))}
                </ul>
              )}

              {produtoSelecionado && (
                <p style={{ marginTop: '5px', color: '#ccc' }}>Produto: {produtoSelecionado}</p>
              )}
            </div>

            <div><label>Marketplace:</label><select name="marketplace" value={form.marketplace} onChange={handleChange}><option value="">Selecione</option>{Object.keys(marketplaces).map(mkt => (<option key={mkt} value={mkt}>{mkt}</option>))}</select></div>
            <div><label>Comissão Marketplace (%):</label><input name="comissaoMarketplace" value={form.comissaoMarketplace} onChange={handleChange} /></div>
            <div><label>Custo de Aquisição (R$):</label><input name="custoAquisicao" value={form.custoAquisicao} onChange={handleChange} /></div>
            <div><label>Impostos da Venda (%):</label><input name="impostosCompra" value={form.impostosCompra} onChange={handleChange} /></div>
            <div><label>DIFAL (%):</label><input name="difal" value={form.difal} onChange={handleChange} /></div>
            <div><label>Frete Estimado (R$):</label><input name="frete" value={form.frete} onChange={handleChange} /></div>
            <div><label>Despesa com Embalagem (R$):</label><input name="embalagem" value={form.embalagem} onChange={handleChange} /></div>
            <div><label>Custo Fixo por Pedido (R$):</label><input name="custoFixo" value={form.custoFixo} onChange={handleChange} /></div>
            <div><label>Faturamento Estimado (R$):</label><input name="faturamentoEstimado" value={form.faturamentoEstimado} onChange={handleChange} /></div>
            <div><label>Despesa Fixa (%):</label><input name="despesaFixaPct" value={form.despesaFixaPct} onChange={handleChange} /></div>
            <div><label>Lucro Desejado (markup %):</label><input name="markup" value={form.markup} onChange={handleChange} /></div>
            <div><label>Comissão Vendedor (%):</label><input name="comissaoVendedor" value={form.comissaoVendedor} onChange={handleChange} /></div>
            <div><label>Comissão Help Seller (%):</label><input name="comissaoHelpSeller" value={form.comissaoHelpSeller} onChange={handleChange} /></div>
          </div>
          <button type="submit" className="btn-primary">Calcular</button>
        </form>
      )}

    {aba === 'historico' && (
      <div className="historico-wrapper">
        <h3>Histórico de Cálculos</h3>
        <table className="historico-tabela">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Marketplace</th>
              <th>Preço Calculado</th>
              <th>Rentabilidade (%)</th>
              <th>Comissão Marketplace (R$)</th>
            </tr>
          </thead>
          <tbody>
            {historico.length > 0 ? (
              historico.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.codigo}</td>
                  <td>{item.marketplace}</td>
                  <td>R$ {item.preco_venda.toFixed(2)}</td>
                  <td>{item.rentabilidade.toFixed(2)}%</td>
                  <td>R$ {item.comissao_marketplace.toFixed(2)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5">Nenhum cálculo registrado ainda.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    )}

      {resultado && (
        <div className="resultado">
          <h3>Resultado:</h3>
          <p><b>Preço de Venda Recomendado:</b> R$ {resultado.preco_recomendado}</p>
          <p><b>Custo Total:</b> R$ {resultado.custo_total}</p>
          <p><b>Rentabilidade (%):</b> {resultado.rentabilidade_pct}%</p>
          <p><b>Margem de Lucro Líquida:</b> {resultado.margemLucroLiquida}%</p>
          <p><b>Comissão Marketplace:</b> R$ {resultado.comissao_marketplace_reais}</p>
          <p><b>Comissão Vendedor:</b> R$ {resultado.comissao_vendedor_reais}</p>
          <p><b>Comissão Help Seller:</b> R$ {resultado.comissao_helpseller_reais}</p>
          <p><b>Imposto sobre a Venda:</b> R$ {(resultado.preco_recomendado * (parseFloat(form.difal || 0) / 100)).toFixed(2)}</p>
        </div>
      )}
    </div>
  );
}