import Plot from 'react-plotly.js'

export default function ChartPlotly() {
  return (
    <div className="bg-gray-900 p-4 rounded shadow">
      <h2 className="mb-2 font-semibold">Gráfico Plotly</h2>
      <Plot
        data={[
          {
            x: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai'],
            y: [10, 15, 13, 17, 22],
            type: 'scatter',
            mode: 'lines+markers',
            marker: { color: '#10B981' }
          }
        ]}
        layout={{ width: '100%', height: 300, title: 'Crescimento de Vendas' }}
        style={{ width: '100%' }}
        useResizeHandler={true}
        config={{ responsive: true }}
      />
    </div>
  )
}
