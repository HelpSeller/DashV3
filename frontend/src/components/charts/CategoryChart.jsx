// src/components/charts/CategoryChart.jsx
import ReactECharts from "echarts-for-react";

export default function CategoryChart({ data, onClick }) {
  const options = {
    backgroundColor: "#1a2433",
    title: {
      text: "Categorias",
      left: "center",
      textStyle: { color: "#fff", fontSize: 18 },
    },
    tooltip: { trigger: "item" },
    legend: {
      bottom: 10,
      textStyle: { color: "#fff" },
    },
    series: [
      {
        type: "pie",
        radius: ["40%", "70%"],
        data: data.labels.map((label, i) => ({
          name: label,
          value: data.values[i],
        })),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: "rgba(0, 0, 0, 0.5)",
          },
        },
        itemStyle: {
          borderRadius: 8,
          borderColor: "#fff",
          borderWidth: 2,
        },
      },
    ],
  };

  return (
    <ReactECharts
      option={options}
      style={{ height: 400 }}
      onEvents={{ click: onClick }}
    />
  );
}
