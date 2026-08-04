import type {
  ChannelType,
  DailyTrendPoint,
  DashboardSnapshot,
  DemandTotal,
} from "./dashboard-types";

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function demand(unit: string, quantity: number): DemandTotal[] {
  return [{ unit, quantity }];
}

function demoTrend(): DailyTrendPoint[] {
  const points: DailyTrendPoint[] = [];
  const today = new Date();
  for (let offset = 29; offset >= 0; offset -= 1) {
    const day = new Date(today);
    day.setUTCDate(today.getUTCDate() - offset);
    const wave = Math.round(Math.sin(offset / 2.4) * 7);
    const rows: Array<[ChannelType, number, number, number, number]> = [
      ["TRADITIONAL_STORE", 36 + wave, 1_260 + wave * 18, 242 + wave * 2, 18_600 + wave * 180],
      ["THIRD_SPACE", 22 - Math.round(wave / 2), 760 - wave * 8, 188 - wave, 16_900 - wave * 130],
    ];
    rows.forEach(([channel, preorderCount, kilograms, orderCount, sales]) => {
      points.push({
        date: isoDate(day),
        channel_type: channel,
        preorder_count: preorderCount,
        demand_totals: demand("公斤", kilograms),
        operation_order_count: orderCount,
        sales_amount: sales,
      });
    });
  }
  return points;
}

export function makeDemoSnapshot(): DashboardSnapshot {
  const now = new Date();
  const start = new Date(now);
  start.setUTCDate(now.getUTCDate() - 29);
  return {
    park_id: "PARK-DEMO-001",
    park_name: "哈尔滨新安食品产业园",
    range_start: `${isoDate(start)}T00:00:00+08:00`,
    range_end: now.toISOString(),
    headline: {
      preorder_count: 1_842,
      demand_totals: [
        { unit: "公斤", quantity: 64_820 },
        { unit: "件", quantity: 12_460 },
        { unit: "箱", quantity: 3_280 },
      ],
      operation_order_count: 12_845,
      sales_amount: 2_856_300,
      currency: "CNY",
    },
    channel_mix: [
      {
        channel_type: "TRADITIONAL_STORE",
        display_name: "传统门店",
        preorder_count: 1_160,
        demand_totals: demand("公斤", 42_560),
        operation_order_count: 7_520,
        operation_order_share: 58.5,
        sales_amount: 1_628_091,
        sales_share: 57,
      },
      {
        channel_type: "THIRD_SPACE",
        display_name: "第三空间",
        preorder_count: 682,
        demand_totals: demand("公斤", 22_260),
        operation_order_count: 5_325,
        operation_order_share: 41.5,
        sales_amount: 1_228_209,
        sales_share: 43,
      },
    ],
    daily_trend: demoTrend(),
    third_spaces: [
      {
        store_id: "DEMO-THIRD-CHANGCHUN",
        store_name: "长春冰雪新天地",
        city: "长春市",
        longitude: 125.3235,
        latitude: 43.8171,
        preorder_count: 256,
        demand_totals: demand("公斤", 8_720),
        operation_order_count: 2_142,
        sales_amount: 486_320,
        last_report_date: isoDate(now),
        last_report_status: "COMPLETE",
        is_demo: true,
      },
      {
        store_id: "DEMO-THIRD-SHENYANG",
        store_name: "沈阳青年公园驿站",
        city: "沈阳市",
        longitude: 123.4315,
        latitude: 41.8057,
        preorder_count: 224,
        demand_totals: demand("公斤", 7_430),
        operation_order_count: 1_786,
        sales_amount: 411_760,
        last_report_date: isoDate(now),
        last_report_status: "COMPLETE",
        is_demo: true,
      },
      {
        store_id: "DEMO-THIRD-JIAMUSI",
        store_name: "佳木斯松花江会客厅",
        city: "佳木斯市",
        longitude: 130.3189,
        latitude: 46.7998,
        preorder_count: 202,
        demand_totals: demand("公斤", 6_110),
        operation_order_count: 1_397,
        sales_amount: 330_129,
        last_report_date: isoDate(now),
        last_report_status: "INCOMPLETE",
        is_demo: true,
      },
    ],
    map_nodes: [
      {
        node_id: "PARK-DEMO-001",
        node_type: "PARK",
        display_name: "新安食品产业园",
        city: "哈尔滨市",
        longitude: 126.6424,
        latitude: 45.7567,
      },
      {
        node_id: "DEMO-TRAD-QIQIHAR",
        node_type: "TRADITIONAL_STORE",
        display_name: "齐齐哈尔传统门店",
        city: "齐齐哈尔市",
        longitude: 123.9182,
        latitude: 47.3543,
      },
      {
        node_id: "DEMO-TRAD-DALIAN",
        node_type: "TRADITIONAL_STORE",
        display_name: "大连传统门店",
        city: "大连市",
        longitude: 121.6147,
        latitude: 38.914,
      },
      ...[
        ["DEMO-THIRD-CHANGCHUN", "长春冰雪新天地", "长春市", 125.3235, 43.8171],
        ["DEMO-THIRD-SHENYANG", "沈阳青年公园驿站", "沈阳市", 123.4315, 41.8057],
        ["DEMO-THIRD-JIAMUSI", "佳木斯松花江会客厅", "佳木斯市", 130.3189, 46.7998],
      ].map(([nodeId, name, city, longitude, latitude]) => ({
        node_id: String(nodeId),
        node_type: "THIRD_SPACE" as const,
        display_name: String(name),
        city: String(city),
        longitude: Number(longitude),
        latitude: Number(latitude),
      })),
    ],
    map_edges: [
      { source_id: "PARK-DEMO-001", target_id: "DEMO-TRAD-QIQIHAR", channel_type: "TRADITIONAL_STORE" },
      { source_id: "PARK-DEMO-001", target_id: "DEMO-TRAD-DALIAN", channel_type: "TRADITIONAL_STORE" },
      { source_id: "PARK-DEMO-001", target_id: "DEMO-THIRD-CHANGCHUN", channel_type: "THIRD_SPACE" },
      { source_id: "PARK-DEMO-001", target_id: "DEMO-THIRD-SHENYANG", channel_type: "THIRD_SPACE" },
      { source_id: "PARK-DEMO-001", target_id: "DEMO-THIRD-JIAMUSI", channel_type: "THIRD_SPACE" },
    ],
    data_quality: {
      store_count: 5,
      reporting_store_count: 5,
      missing_store_classification_count: 0,
      missing_coordinate_count: 0,
      missing_report_count: 0,
      report_coverage: 100,
      warnings: [],
    },
    demo_mode: true,
  };
}
