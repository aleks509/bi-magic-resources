import { KoobFiltersService, useService } from "bi-internal/services";
import React, { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { unique } from "../../utils/uniqueItem";
import "./styles.css";

const StackedBarChart = (props: any) => {
  const { cfg, subspace, dp } = props;

  const [koobData, setKoobData] = useState<any[]>([]);
  const filterModel = useService<KoobFiltersService>(KoobFiltersService);

  const colorsCategories = [
    { name: "Бюджет", color: "#75D742" },
    { name: "ОМС", color: "#E7C825" },
    { name: "ДМС", color: "#F07F2D" },
    { name: "Платные услуги", color: "#F15050" },
  ];

  useEffect(() => {
    dp.getKoobData(subspace)
      .then((rawData: any[]) => {
        const filtredNames = rawData.filter((el) => el.name !== "Личный шифр");
        setKoobData(filtredNames);
      })
      .catch((error) => {
        console.error("Ошибка при получении данных:", error);
      });
  }, [subspace, subspace?.filters, cfg]);

  const selectedDatesUnique = unique(koobData.map((el) => el.dt)).slice(0, 2);

  const selectedOrgNamesUnique = unique(koobData.map((el) => el.org_name));

  const orgNameWithIndex = selectedOrgNamesUnique.map((orgName, index) => ({
    orgName,
    ind: index + 1,
  }));

  const getNormalizedChartData = () => {
    const chartData: any[] = [];

    let maxSum = 0;

    selectedDatesUnique.forEach((dt) => {
      selectedOrgNamesUnique.forEach((org) => {
        const total = koobData
          .filter((el) => el.dt === dt && el.org_name === org)
          .reduce((sum, item) => sum + item.value, 0);

        if (total > maxSum) {
          maxSum = total;
        }
      });
    });

    selectedDatesUnique.forEach((dt) => {
      selectedOrgNamesUnique.forEach((org) => {
        const entry: any = {
          label: `${dt} — ${org}`,
          dt,
          org,
        };

        colorsCategories.forEach((category) => {
          const matched = koobData.find(
            (item) =>
              item.dt === dt &&
              item.org_name === org &&
              item.name === category.name
          );
          const rawValue = matched?.value || 0;
          entry[category.name] = maxSum > 0 ? (rawValue * 100) / maxSum : 0;
        });

        chartData.push(entry);
      });
    });

    return chartData;
  };

  const RoundedGapBar = (props: any) => {
    const { x, y, width, height, fill } = props;
    const gap = 2;
    return (
      <rect
        x={x}
        y={y + gap}
        width={width}
        height={height - gap}
        fill={fill}
        rx={4}
        ry={4}
      />
    );
  };

  const renderCustomLegend = () => {
    return (
      <div className="custom-legend">
        {orgNameWithIndex.map((item) => (
          <span
            key={item.ind}
            style={{ marginRight: "16px", fontSize: "14px", color: "#292929" }}
          >
            {item.ind}. {item.orgName}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="container">
      <h1 className="title">Итоги за май 2024 года в разрезе услуг</h1>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart
          data={getNormalizedChartData()}
          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
        >
          <CartesianGrid stroke="#6A6A6A33" vertical={false} />
          <XAxis
            dataKey="dt"
            interval={0}
            angle={-45}
            textAnchor="end"
            tick={false}
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 20, 40, 60, 80, 100]}
            tickFormatter={(value) => `${value}`}
            tick={{ fontSize: 14 }}
          />
          <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
          <Legend content={renderCustomLegend} />
          {colorsCategories.map((cat) => (
            <Bar
              key={cat.name}
              dataKey={cat.name}
              stackId="a"
              fill={cat.color}
              name={cat.name}
              shape={<RoundedGapBar />}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StackedBarChart;
