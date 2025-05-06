import ReactECharts from 'echarts-for-react'

export default function ChartEcharts() {
  const option = {
    title: { text: 'Vendas Mensais' },
    tooltip: {},
    xAxis: {
      data: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun']
    },
    yAxis: {},
    series: [{
      name: 'Vendas',
      type: 'bar',
      data: [5, 20, 36, 10, 10, 20]
    }]
  }

  return (
    <div className="bg-gray-900 p-4 rounded shadow">
      <h2 className="mb-2 font-semibold">Gráfico ECharts</h2>
      <ReactECharts option={option} style={{ height: '300px' }} />
    </div>
  )
}
