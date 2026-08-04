export type ChannelType = "TRADITIONAL_STORE" | "THIRD_SPACE";

export interface DemandTotal {
  unit: string;
  quantity: number;
}

export interface ChannelMetric {
  channel_type: ChannelType;
  display_name: string;
  preorder_count: number;
  demand_totals: DemandTotal[];
  operation_order_count: number;
  operation_order_share: number | null;
  sales_amount: number;
  sales_share: number | null;
}

export interface DailyTrendPoint {
  date: string;
  channel_type: ChannelType;
  preorder_count: number;
  demand_totals: DemandTotal[];
  operation_order_count: number;
  sales_amount: number;
}

export interface ThirdSpaceMetric {
  store_id: string;
  store_name: string;
  city: string | null;
  longitude: number | null;
  latitude: number | null;
  preorder_count: number;
  demand_totals: DemandTotal[];
  operation_order_count: number;
  sales_amount: number;
  last_report_date: string | null;
  last_report_status: "COMPLETE" | "INCOMPLETE" | "MISSING" | null;
  is_demo: boolean;
}

export interface MapNode {
  node_id: string;
  node_type: "PARK" | ChannelType;
  display_name: string;
  city: string | null;
  longitude: number;
  latitude: number;
}

export interface MapEdge {
  source_id: string;
  target_id: string;
  channel_type: ChannelType;
}

export interface DashboardSnapshot {
  park_id: string | null;
  park_name: string;
  range_start: string;
  range_end: string;
  headline: {
    preorder_count: number;
    demand_totals: DemandTotal[];
    operation_order_count: number;
    sales_amount: number;
    currency: "CNY";
  };
  channel_mix: ChannelMetric[];
  daily_trend: DailyTrendPoint[];
  third_spaces: ThirdSpaceMetric[];
  map_nodes: MapNode[];
  map_edges: MapEdge[];
  data_quality: {
    store_count: number;
    reporting_store_count: number;
    missing_store_classification_count: number;
    missing_coordinate_count: number;
    missing_report_count: number;
    report_coverage: number | null;
    warnings: string[];
  };
  demo_mode: boolean;
}

export interface ApiEnvelope<T> {
  data: T;
  code: string;
  status: string;
}

export interface AssistantChart {
  kind: "donut" | "bar" | "line";
  title: string;
  categories: string[];
  series: Array<{ name: string; data: number[] }>;
  unit: string;
}

export interface AssistantAnswer {
  answer: string;
  chart: AssistantChart | null;
  data_cutoff: string;
  tools_used: Array<"overview" | "channel_mix" | "daily_trend" | "third_spaces">;
}
