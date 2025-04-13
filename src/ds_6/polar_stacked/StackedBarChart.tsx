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
        console.log("data=>>>", filtredNames);
        console.log("filterModel", filterModel);
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
    const chartDataMap: Record<string, any> = {};
    let maxSum = 0;

    selectedDatesUnique.forEach((dt) => {
      const row: any = { dt };
      selectedOrgNamesUnique.forEach((org) => {
        colorsCategories.forEach((cat) => {
          row[`${org}_${cat.name}`] = 0;
        });
      });
      chartDataMap[dt] = row;
    });

    koobData.forEach((item) => {
      if (selectedDatesUnique.includes(item.dt)) {
        const row = chartDataMap[item.dt];
        if (row) {
          const key = `${item.org_name}_${item.name}`;
          row[key] = (row[key] || 0) + item.value;
        }
      }
    });

    selectedDatesUnique.forEach((dt) => {
      const row = chartDataMap[dt];
      selectedOrgNamesUnique.forEach((org) => {
        let orgTotal = 0;
        colorsCategories.forEach((cat) => {
          orgTotal += row[`${org}_${cat.name}`];
        });
        if (orgTotal > maxSum) maxSum = orgTotal;
        row[`${org}_total`] = orgTotal;
      });
    });

    Object.values(chartDataMap).forEach((row: any) => {
      selectedOrgNamesUnique.forEach((org) => {
        colorsCategories.forEach((cat) => {
          const key = `${org}_${cat.name}`;
          row[key] = maxSum > 0 ? (row[key] * 100) / maxSum : 0;
        });
      });
    });

    return Object.values(chartDataMap);
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
            style={{ marginRight: "16px", fontSize: "16px", color: "#292929" }}
          >
            {item.ind}. {item.orgName}
          </span>
        ))}
      </div>
    );
  };
  //потом
  const orgIndexMap = orgNameWithIndex.reduce((acc, cur) => {
    acc[cur.orgName] = cur.ind;
    return acc;
  }, {} as Record<string, number>);

  const normalizedChartData = getNormalizedChartData();

  return (
    <div className="container">
      <h1 className="title">Итоги за май 2024 года в разрезе услуг</h1>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={normalizedChartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
        >
          <CartesianGrid stroke="#6A6A6A33" vertical={false} />
          <XAxis
            dataKey="dt"
            tickLine={false}
            axisLine={false}
            tick={{
              textAnchor: "middle",
              fontSize: 18,
            }}
            tickFormatter={(tick) => {
              const parts = tick.split("-");
              return `${parts[2]}.${parts[1]}.${parts[0]}`;
            }}
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 20, 40, 60, 80, 100]}
            tickFormatter={(value) => `${value}`}
            tick={{ fontSize: 14 }}
          />
          <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
          <Legend content={renderCustomLegend} />
          {selectedOrgNamesUnique.map((org) =>
            colorsCategories.map((cat, catIndex) => {
              return (
                <Bar
                  key={`${org}_${cat.name}`}
                  dataKey={`${org}_${cat.name}`}
                  stackId={org}
                  fill={cat.color}
                  name={cat.name}
                  shape={<RoundedGapBar />}
                ></Bar>
              );
            })
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StackedBarChart;
