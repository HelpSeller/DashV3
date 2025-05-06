// frontend/src/components/charts/MonthlyRevenueChart.jsx
import React from "react";
import ReactEcharts from "echarts-for-react";

export default function MonthlyRevenueChart({ data, marketplaceData }) {
  if (!data || !data.labels || !data.faturamento) {
    return null;
  }

  const series = [
    {
      name: "Faturamento",
      type: "bar",
      data: data.faturamento,
      itemStyle: {
        color: "#5470C6",
      },
      barMaxWidth: 50,
    },
    {
      name: "Ticket Medio",
      type: "line",
      yAxisIndex: 1,
      data: data.ticket_medio.map(v => parseFloat(v.toFixed(2))),
      itemStyle: {
        color: "#91CC75",
      },
      smooth: true,
    },
  ];

  if (marketplaceData) {
    Object.entries(marketplaceData).forEach(([marketplace, valores]) => {
      series.push({
        name: marketplace,
        type: "line",
        data: valores,
        smooth: true,
        symbol: "circle",
        symbolSize: 8,
        lineStyle: {
          width: 2,
        },
      });
    });
  }

  const options = {
    tooltip: {
      trigger: "axis",
      backgroundColor: "#333",
      textStyle: { color: "#fff" },
      formatter: params => {
        let text = params[0].axisValueLabel + "<br/>";
        params.forEach(item => {
          text += `${item.marker} ${item.seriesName}: <b>${item.data.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</b><br/>`;
        });
        return text;
      },
    },
    legend: {
      textStyle: {
        color: "#fff",
      },
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "8%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: data.labels,
      axisLabel: {
        color: "#fff",
      },
    },
    yAxis: [
      {
        type: "value",
        name: "Faturamento",
        axisLabel: {
          color: "#fff",
        },
      },
      {
        type: "value",
        name: "Ticket Medio",
        axisLabel: {
          color: "#fff",
        },
      },
    ],
    series,
  };

  return <ReactEcharts option={options} style={{ height: "400px", width: "100%" }} />;
}
