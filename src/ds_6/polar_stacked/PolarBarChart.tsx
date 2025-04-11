import { KoobFiltersService, useServiceItself } from "bi-internal/services";
import React, { useEffect, useState } from "react";
import {
  Legend,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import "./styles.css";

const PolarBarChart = ({ dp, subspace }: any) => {
  const [chartData, setChartData] = useState<any[]>([]);
  const koobFiltersService =
    useServiceItself<KoobFiltersService>(KoobFiltersService);

  const colors = ["#F15050", "#F07F2D", "#E7C825", "#75D742"];
  const mockValues = [20, 25, 70, 40];
  const MAX_PERCENT = 90;

  useEffect(() => {
    dp.getKoobData(subspace).then((koobResponse) => {
      const filteredNames = koobResponse
        .map((item: any) => item.name)
        .filter((name: string) => name !== "Личный шифр")
        .slice(0, 4);

      const maxValue = Math.max(...mockValues);

      const processedData = filteredNames.map((name, i) => ({
        name,
        value: (mockValues[i] / maxValue) * MAX_PERCENT,
        fill: colors[i],
      }));

      setChartData(processedData);
    });
  }, []);

  const handleClick = (data: any) => {
    const clickedName = data?.name;
    if (clickedName) {
      koobFiltersService.set({ filters: { name: ["=", clickedName] } });
    }
  };
  const renderCustomLegend = (props: any) => {
    const { payload } = props;
    return (
      <ul
        style={{
          margin: 0,
          padding: 0,
          display: "flex",
          listStyle: "none",
          fontSize: 14,
          lineHeight: "24px",
        }}
      >
        {payload.map((entry: any, index: number) => (
          <li
            key={`item-${index}`}
            style={{
              marginRight: 16,
              display: "flex",
              alignItems: "center",
            }}
          >
            <span
              style={{
                display: "inline-block",
                marginRight: 8,
                width: 10,
                height: 10,
                backgroundColor: entry.color,
              }}
            ></span>
            <span style={{ color: "#292929" }}>{entry.value}</span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div
      style={{
        backgroundColor: "#F4F7FA",
        padding: "16px",
      }}
    >
      <h1
        style={{
          fontFamily: "Golos Text",
          fontSize: "20px",
          lineHeight: "24px",
          color: "#292929",
          margin: 0,
          padding: 0,
        }}
      >
        Итоги за май 2024 года
      </h1>
      <ResponsiveContainer width="100%" height={280}>
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="20%"
          outerRadius="90%"
          barSize={15}
          data={chartData}
          startAngle={90}
          endAngle={-270}
        >
          <RadialBar
            minAngle={15}
            background
            clockWise
            dataKey="value"
            nameKey="name"
            onClick={handleClick}
            radius={5}
          />
          <Tooltip />
          <Legend content={renderCustomLegend} />
        </RadialBarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PolarBarChart;
