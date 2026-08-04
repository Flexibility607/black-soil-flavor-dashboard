"use client";

import type { EChartsOption } from "echarts";
import { useEffect, useMemo, useRef, useState } from "react";

import type {
  AssistantChart,
  ChannelMetric,
  DailyTrendPoint,
  DashboardSnapshot,
} from "./dashboard-types";
import { chartTheme } from "./dashboard-theme";

function EChart({ option, mapData, ariaLabel }: { option: EChartsOption; mapData?: object | null; ariaLabel: string }) {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!elementRef.current || (mapData === null)) return;
    let disposed = false;
    let resizeObserver: ResizeObserver | undefined;
    let instance: import("echarts").ECharts | undefined;

    void import("echarts").then((echarts) => {
      if (disposed || !elementRef.current) return;
      if (mapData) echarts.registerMap("northeast", mapData as never);
      instance = echarts.init(elementRef.current, undefined, { renderer: "canvas" });
      instance.setOption(option, { notMerge: true });
      resizeObserver = new ResizeObserver(() => instance?.resize());
      resizeObserver.observe(elementRef.current);
    });

    return () => {
      disposed = true;
      resizeObserver?.disconnect();
      instance?.dispose();
    };
  }, [mapData, option]);

  return <div aria-label={ariaLabel} className="chart-canvas" ref={elementRef} role="img" />;
}

export function DonutChart({
  metric,
  value,
}: {
  metric: ChannelMetric[];
  value: "operation_order_count" | "sales_amount";
}) {
  const title = value === "operation_order_count" ? "经营订单量" : "营业额";
  const option = useMemo<EChartsOption>(() => {
    const total = metric.reduce((sum, item) => sum + item[value], 0);
    return {
      animationDuration: 650,
      color: [chartTheme.ice, chartTheme.green],
      textStyle: { fontFamily: chartTheme.font },
      tooltip: { trigger: "item", backgroundColor: chartTheme.paper, borderColor: chartTheme.grid, textStyle: { color: chartTheme.text } },
      legend: {
        bottom: 2,
        itemWidth: 9,
        itemHeight: 9,
        textStyle: { color: chartTheme.muted, fontSize: 12 },
      },
      graphic: [
        {
          type: "text",
          left: "center",
          top: "39%",
          style: {
            text: title,
            fill: chartTheme.muted,
              font: `12px "${chartTheme.font}"`,
            textAlign: "center",
          },
        },
        {
          type: "text",
          left: "center",
          top: "48%",
          style: {
            text: value === "sales_amount" ? `¥${(total / 10_000).toFixed(1)}万` : total.toLocaleString("zh-CN"),
            fill: chartTheme.text,
            font: `700 21px ${chartTheme.font}`,
            textAlign: "center",
          },
        },
      ],
      series: [
        {
          type: "pie",
          radius: ["55%", "74%"],
          center: ["50%", "47%"],
          avoidLabelOverlap: true,
          label: {
            show: true,
            position: "outside",
            color: chartTheme.text,
            fontSize: 12,
            formatter: "{d}%",
          },
          labelLine: { length: 8, length2: 7, lineStyle: { color: chartTheme.grid } },
          itemStyle: { borderColor: chartTheme.paper, borderWidth: 2 },
          data: metric.map((item) => ({ name: item.display_name, value: item[value] })),
        },
      ],
    };
  }, [metric, title, value]);
  return <EChart ariaLabel={`${title}渠道占比环形图`} option={option} />;
}

export function DemandTrendChart({ points }: { points: DailyTrendPoint[] }) {
  const option = useMemo<EChartsOption>(() => {
    const grouped = new Map<string, { traditional: number; third: number }>();
    points.forEach((point) => {
      const current = grouped.get(point.date) ?? { traditional: 0, third: 0 };
      const quantity = point.demand_totals.reduce((sum, item) => sum + item.quantity, 0);
      if (point.channel_type === "THIRD_SPACE") current.third += quantity;
      else current.traditional += quantity;
      grouped.set(point.date, current);
    });
    const rows = [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b));
    return {
      animationDuration: 700,
      color: [chartTheme.ice, chartTheme.green],
      textStyle: { fontFamily: chartTheme.font },
      grid: { top: 35, left: 44, right: 14, bottom: 29 },
      legend: { top: 0, right: 4, textStyle: { color: chartTheme.muted, fontSize: 11 }, itemWidth: 14, itemHeight: 2 },
      tooltip: { trigger: "axis", backgroundColor: chartTheme.paper, borderColor: chartTheme.grid, textStyle: { color: chartTheme.text } },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: rows.map(([date]) => date.slice(5)),
        axisLine: { lineStyle: { color: chartTheme.grid } },
        axisLabel: { color: chartTheme.muted, fontSize: 10, interval: Math.max(Math.floor(rows.length / 6) - 1, 0) },
        axisTick: { show: false },
      },
      yAxis: {
        type: "value",
        splitNumber: 3,
        axisLabel: { color: chartTheme.muted, fontSize: 10 },
        splitLine: { lineStyle: { color: chartTheme.grid, type: "dashed" } },
      },
      series: [
        {
          name: "传统门店",
          type: "line",
          smooth: 0.35,
          symbol: "none",
          lineStyle: { width: 2 },
          areaStyle: { opacity: 0.08 },
          data: rows.map(([, values]) => values.traditional),
        },
        {
          name: "第三空间",
          type: "line",
          smooth: 0.35,
          symbol: "none",
          lineStyle: { width: 3 },
          areaStyle: { opacity: 0.16 },
          data: rows.map(([, values]) => values.third),
        },
      ],
    };
  }, [points]);
  return <EChart ariaLabel="传统门店与第三空间每日需求趋势折线图" option={option} />;
}

export function SupplyMap({ snapshot }: { snapshot: DashboardSnapshot }) {
  const [mapData, setMapData] = useState<object | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/maps/northeast-china.geo.json")
      .then((response) => {
        if (!response.ok) throw new Error("map unavailable");
        return response.json() as Promise<object>;
      })
      .then((data) => active && setMapData(data))
      .catch(() => active && setMapData({ type: "FeatureCollection", features: [] }));
    return () => {
      active = false;
    };
  }, []);

  const option = useMemo<EChartsOption>(() => {
    const byId = new Map(snapshot.map_nodes.map((node) => [node.node_id, node]));
    const lines = snapshot.map_edges.flatMap((edge) => {
      const source = byId.get(edge.source_id);
      const target = byId.get(edge.target_id);
      if (!source || !target) return [];
      return [{
        coords: [[source.longitude, source.latitude], [target.longitude, target.latitude]],
        lineStyle: { color: edge.channel_type === "THIRD_SPACE" ? chartTheme.green : chartTheme.ice },
      }];
    });
    const nodes = snapshot.map_nodes.map((node) => ({
      name: node.city || node.display_name,
      value: [node.longitude, node.latitude, node.node_type === "PARK" ? 18 : 10],
      nodeType: node.node_type,
      itemStyle: {
        color: node.node_type === "PARK" ? chartTheme.amber : node.node_type === "THIRD_SPACE" ? chartTheme.green : chartTheme.ice,
      },
    }));
    return {
      animationDuration: 850,
      textStyle: { fontFamily: chartTheme.font },
      tooltip: {
        trigger: "item",
        backgroundColor: chartTheme.paper,
        borderColor: chartTheme.grid,
        textStyle: { color: chartTheme.text },
      },
      geo: {
        map: "northeast",
        roam: false,
        left: 6,
        right: 6,
        top: 2,
        bottom: 0,
        itemStyle: {
          areaColor: chartTheme.mapArea,
          borderColor: chartTheme.mapBorder,
          borderWidth: 1,
        },
        emphasis: { itemStyle: { areaColor: chartTheme.mapAreaHover }, label: { show: false } },
        label: { show: false },
      },
      series: [
        {
          type: "lines",
          coordinateSystem: "geo",
          zlevel: 2,
          effect: { show: true, period: 5, trailLength: 0.35, symbolSize: 4, color: chartTheme.text },
          lineStyle: { width: 1.5, opacity: 0.72, curveness: 0.16 },
          data: lines,
        },
        {
          type: "effectScatter",
          coordinateSystem: "geo",
          zlevel: 3,
          rippleEffect: { scale: 3.2, brushType: "stroke" },
          symbolSize: (value: number[]) => value[2],
          label: {
            show: true,
            position: "right",
            formatter: "{b}",
            color: chartTheme.text,
            fontSize: 11,
            textBorderColor: chartTheme.paper,
            textBorderWidth: 3,
          },
          data: nodes,
        },
        {
          type: "scatter",
          coordinateSystem: "geo",
          silent: true,
          symbolSize: 1,
          label: { show: true, formatter: "{b}", color: chartTheme.muted, fontSize: 12, fontWeight: 700 },
          data: [
            { name: "黑龙江省", value: [127.5, 48.55] },
            { name: "吉林省", value: [127.1, 43.35] },
            { name: "辽宁省", value: [126.5, 40.75] },
          ],
        },
      ],
    };
  }, [snapshot]);

  if (!mapData) return <div className="chart-loading">正在加载离线地图…</div>;
  return <EChart ariaLabel="东北三省园区、传统门店和第三空间供销网络地图" option={option} mapData={mapData} />;
}

export function AssistantChartView({ chart }: { chart: AssistantChart }) {
  const option = useMemo<EChartsOption>(() => {
    const common = {
      animationDuration: 600,
      color: [chartTheme.green, chartTheme.ice, chartTheme.amber],
      textStyle: { fontFamily: chartTheme.font },
      tooltip: { trigger: "axis" as const, backgroundColor: chartTheme.paper, borderColor: chartTheme.grid, textStyle: { color: chartTheme.text } },
      legend: { top: 2, textStyle: { color: chartTheme.muted } },
    };
    if (chart.kind === "donut") {
      return {
        ...common,
        tooltip: { ...common.tooltip, trigger: "item" },
        series: [{
          type: "pie",
          radius: ["48%", "72%"],
          center: ["50%", "55%"],
          label: { color: chartTheme.text, formatter: `{b}  {d}%` },
          data: chart.categories.map((name, index) => ({ name, value: chart.series[0]?.data[index] ?? 0 })),
        }],
      };
    }
    return {
      ...common,
      grid: { top: 38, left: 46, right: 18, bottom: 36 },
      xAxis: { type: "category", data: chart.categories, axisLabel: { color: chartTheme.muted }, axisLine: { lineStyle: { color: chartTheme.grid } } },
      yAxis: { type: "value", axisLabel: { color: chartTheme.muted }, splitLine: { lineStyle: { color: chartTheme.grid, type: "dashed" } } },
      series: chart.kind === "line"
        ? chart.series.map((series) => ({
            name: series.name,
            type: "line" as const,
            smooth: 0.35,
            data: series.data,
          }))
        : chart.series.map((series) => ({
            name: series.name,
            type: "bar" as const,
            data: series.data,
          })),
    };
  }, [chart]);
  return <EChart ariaLabel={chart.title} option={option} />;
}
