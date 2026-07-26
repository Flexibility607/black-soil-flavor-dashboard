"use client";

import { useEffect, useMemo, useState } from "react";

type Tone = "green" | "amber" | "blue" | "red";
type Theme = "night" | "day";

const metrics: Array<{
  label: string;
  value: string;
  unit: string;
  tone: Tone;
}> = [
  { label: "入园企业", value: "18", unit: "家", tone: "green" },
  { label: "今日可用产能", value: "8,730", unit: "kg", tone: "green" },
  { label: "未来 72 小时需求", value: "4,480", unit: "kg", tone: "amber" },
  { label: "近 7 日承接订单", value: "11,180", unit: "kg", tone: "green" },
  { label: "当前运输任务", value: "8", unit: "项", tone: "blue" },
  { label: "近 7 日已结算", value: "48.63", unit: "万元", tone: "amber" },
];

const stages: Array<{
  label: string;
  value: string;
  note: string;
  status: string;
  tone: Tone;
}> = [
  { label: "供给主体", value: "18 家", note: "8 类食品加工", status: "主体在线", tone: "green" },
  { label: "生产汇聚", value: "8,730 kg", note: "今日可调度", status: "产能充足", tone: "green" },
  { label: "订单协同", value: "4,480 kg", note: "未来 72 小时", status: "8 笔待履约", tone: "amber" },
  { label: "冷链履约", value: "8 项", note: "13 辆车在册", status: "2 项关注", tone: "red" },
  { label: "交付结算", value: "¥48.63 万", note: "近 7 日", status: "结算正常", tone: "blue" },
];

const companies = [
  { name: "企业 A01", category: "速冻食品", value: 1680 },
  { name: "企业 A02", category: "净菜加工", value: 1420 },
  { name: "企业 A03", category: "烘焙食品", value: 1250 },
  { name: "企业 A04", category: "冷链饮品", value: 1160 },
  { name: "企业 A05", category: "豆制食品", value: 980 },
  { name: "企业 A06", category: "粮油制品", value: 870 },
  { name: "企业 A07", category: "肉类加工", value: 760 },
  { name: "企业 A08", category: "复合调味", value: 610 },
];

const shares = [
  { label: "A01", value: 16.5 },
  { label: "A02", value: 14.5 },
  { label: "A03", value: 13.2 },
  { label: "A04", value: 11.8 },
  { label: "A05", value: 10.5 },
  { label: "A06", value: 8.8 },
  { label: "A07", value: 7.5 },
  { label: "A08", value: 6.8 },
  { label: "A09", value: 5.7 },
  { label: "A10", value: 4.7 },
];

const shareGroups = [
  ...shares.slice(0, 5),
  { label: "其余企业", value: 33.5 },
];

const days = ["07-19", "07-20", "07-21", "07-22", "07-23", "07-24", "07-25"];
const orderTrend = [1320, 1510, 1390, 1760, 1600, 1700, 1900];
const salesTrend = [5.42, 6.18, 5.89, 7.34, 6.95, 7.69, 9.16];

const demands = [
  { date: "07-26 07:30", partner: "合作方 B01", category: "速冻食品", value: 760 },
  { date: "07-26 09:00", partner: "合作方 B02", category: "净菜加工", value: 680 },
  { date: "07-26 14:00", partner: "合作方 B03", category: "冷链饮品", value: 540 },
  { date: "07-27 06:30", partner: "合作方 B04", category: "烘焙食品", value: 430 },
  { date: "07-27 08:00", partner: "合作方 B05", category: "粮油制品", value: 920 },
  { date: "07-27 12:30", partner: "合作方 B06", category: "豆制食品", value: 360 },
  { date: "07-28 07:00", partner: "合作方 B07", category: "肉类加工", value: 510 },
  { date: "07-28 10:30", partner: "合作方 B08", category: "复合调味", value: 280 },
];

const tasks = [
  { id: "TASK-001", route: "园区 → 配送节点 01", vehicle: "大型冷藏车", status: "正常" },
  { id: "TASK-002", route: "园区 → 配送节点 02", vehicle: "冷藏厢式车", status: "温度关注" },
  { id: "TASK-003", route: "园区 → 配送节点 03", vehicle: "大型冷藏车", status: "正常" },
  { id: "TASK-004", route: "园区 → 配送节点 04", vehicle: "保温厢式车", status: "正常" },
  { id: "TASK-005", route: "园区 → 配送节点 05", vehicle: "中型冷藏车", status: "到达偏晚" },
];

const policies = [
  "农业产业化龙头企业培育政策观察",
  "数字乡村与农产品供应链数据应用",
];

function PanelTitle({
  title,
  meta,
}: {
  title: string;
  meta?: string;
}) {
  return (
    <div className="panel-title">
      <h2>{title}</h2>
      {meta ? <span>{meta}</span> : null}
    </div>
  );
}

function TrendBars({
  values,
  max,
  tone,
  formatter,
}: {
  values: number[];
  max: number;
  tone: "green" | "amber";
  formatter: (value: number) => string;
}) {
  return (
    <div className={`trend trend--${tone}`}>
      {values.map((value, index) => (
        <div className="trend__item" key={`${tone}-${days[index]}`}>
          <span className="trend__value">{formatter(value)}</span>
          <span className="trend__rail">
            <i style={{ "--bar": `${Math.max((value / max) * 100, 12)}%` } as React.CSSProperties} />
          </span>
          <span className="trend__day">{days[index]}</span>
        </div>
      ))}
    </div>
  );
}

export default function DashboardV3() {
  const [scale, setScale] = useState(1);
  const [theme, setTheme] = useState<Theme>("night");
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const resize = () => {
      setScale(Math.min(window.innerWidth / 1920, window.innerHeight / 1080));
    };
    const syncFullscreen = () => setIsFullscreen(Boolean(document.fullscreenElement));
    resize();
    window.addEventListener("resize", resize);
    document.addEventListener("fullscreenchange", syncFullscreen);
    return () => {
      window.removeEventListener("resize", resize);
      document.removeEventListener("fullscreenchange", syncFullscreen);
    };
  }, []);

  const dashboardStyle = useMemo(
    () => ({ "--dashboard-scale": scale }) as React.CSSProperties,
    [scale],
  );

  const toggleFullscreen = async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }
    await document.documentElement.requestFullscreen();
  };

  return (
    <main className="screen" data-theme={theme}>
      <section className="dashboard-v3" style={dashboardStyle} data-theme={theme} aria-label="黑土寻味·产销闭环大屏">
        <header className="masthead">
          <div className="identity">
            <span className="identity__mark" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <div>
              <strong>黑土寻味</strong>
              <span>园区 E02 · 绿色食品产业协同</span>
            </div>
          </div>
          <div className="masthead__title">
            <h1>黑土寻味·产销闭环</h1>
          </div>
          <div className="masthead__status">
            <div className="masthead__status-top">
              <span className="masthead__health"><i /> 数据链路正常</span>
              <div className="masthead__controls" aria-label="大屏控制">
                <button type="button" onClick={toggleFullscreen}>
                  {isFullscreen ? "退出全屏" : "全屏"}
                </button>
                <button
                  type="button"
                  aria-pressed={theme === "day"}
                  onClick={() => setTheme((current) => current === "night" ? "day" : "night")}
                >
                  {theme === "night" ? "开灯" : "关灯"}
                </button>
                <button type="button" onClick={() => window.location.reload()}>
                  刷新
                </button>
              </div>
            </div>
            <div className="time-lockup" aria-label="2026 年 7 月 25 日 16 点 30 分">
              <strong>16:30</strong>
              <span>2026<br />07.25</span>
            </div>
          </div>
        </header>

        <section className="metric-strip" aria-label="核心经营指标">
          {metrics.map((metric) => (
            <article className={`metric metric--${metric.tone}`} key={metric.label}>
              <span className="metric__label">{metric.label}</span>
              <div className="metric__value">
                <strong>{metric.value}</strong>
                <span>{metric.unit}</span>
              </div>
            </article>
          ))}
        </section>

        <section className="operations">
          <article className="loop-map">
            <div className="loop-map__intro">
              <div>
                <h2><strong>产销</strong><span>协同链路</span></h2>
              </div>
            </div>

            <div className="loop-map__path">
              {stages.map((stage, index) => (
                <div className="loop-stage-wrap" key={stage.label}>
                  <article className={`loop-stage loop-stage--${stage.tone}`}>
                    <span className="loop-stage__index">{String(index + 1).padStart(2, "0")}</span>
                    <i className="loop-stage__node" aria-hidden="true" />
                    <div>
                      <h3>{stage.label}</h3>
                      <strong>{stage.value}</strong>
                      <p>{stage.note}</p>
                    </div>
                    <span className="loop-stage__status">{stage.status}</span>
                  </article>
                  {index < stages.length - 1 ? <span className="loop-stage__connector" aria-hidden="true" /> : null}
                </div>
              ))}
            </div>

            <aside className="loop-map__signals" aria-label="关键协同信号">
              <div className="signal-card signal-card--demand">
                <span>未来 72 小时需求</span>
                <strong>4,480<small>kg</small></strong>
              </div>
              <div className="signal-card signal-card--alert">
                <span>运输任务需关注</span>
                <strong>2<small>项</small></strong>
              </div>
            </aside>

          </article>

          <div className="detail-grid">
            <article className="panel capacity-panel">
              <PanelTitle title="企业产能与订单构成" meta="Top 8 产能" />
              <div className="capacity-list">
                {companies.map((company, index) => (
                  <div
                    className={`capacity-row capacity-row--${Math.min(index + 1, 6)}`}
                    key={company.name}
                  >
                    <strong>{company.name}</strong>
                    <span>{company.category}</span>
                    <i>
                      <b style={{ "--bar": `${(company.value / 1680) * 100}%` } as React.CSSProperties} />
                    </i>
                    <em>{company.value.toLocaleString()} kg</em>
                  </div>
                ))}
              </div>
              <div className="share-block">
                <div className="share-block__heading">
                  <strong>订单构成</strong>
                  <span>10 家企业 · 11,180 kg</span>
                </div>
                <div className="share-bar" aria-label="企业订单占比">
                  {shareGroups.map((share, index) => (
                    <i
                      className={`share-bar__item share-bar__item--${index + 1}`}
                      style={{ "--share": `${share.value}%` } as React.CSSProperties}
                      key={share.label}
                    />
                  ))}
                </div>
                <div className="share-legend">
                  {shareGroups.map((share, index) => (
                    <span key={share.label}>
                      <i className={`share-legend__key share-legend__key--${index + 1}`} />
                      {share.label} {share.value}%
                    </span>
                  ))}
                </div>
              </div>
            </article>

            <div className="middle-stack">
              <article className="panel trend-panel">
                <PanelTitle title="近 7 日订单与结算" meta="07-19 至 07-25" />
                <div className="trend-grid">
                  <section>
                    <div className="trend-heading">
                      <span>承接订单量</span>
                      <strong>11,180 <small>kg</small></strong>
                    </div>
                    <TrendBars values={orderTrend} max={1900} tone="green" formatter={(value) => `${(value / 1000).toFixed(1)}k`} />
                  </section>
                  <section>
                    <div className="trend-heading">
                      <span>已结算销售额</span>
                      <strong>48.63 <small>万元</small></strong>
                    </div>
                    <TrendBars values={salesTrend} max={9.16} tone="amber" formatter={(value) => value.toFixed(1)} />
                  </section>
                </div>
              </article>

              <article className="panel tasks-panel">
                <PanelTitle title="运输履约进度" meta="关键线路 5 / 8" />
                <div className="task-head" aria-hidden="true">
                  <span>任务</span><span>线路 / 车型</span><span>路径节点</span><span>状态</span>
                </div>
                <div className="task-list">
                  {tasks.map((task) => {
                    const isAlert = task.status !== "正常";
                    return (
                      <div className={`task-row ${isAlert ? "task-row--alert" : ""}`} key={task.id}>
                        <strong>{task.id}</strong>
                        <span>{task.route}<small>{task.vehicle}</small></span>
                        <span className="route-nodes" aria-label="起点、装车、在途、交接、到达五个路径节点">
                          <i>起</i><i>装</i><i>途</i><i>交</i><i>达</i>
                        </span>
                        <em>{task.status}</em>
                      </div>
                    );
                  })}
                </div>
              </article>
            </div>

            <article className="panel demand-panel">
              <PanelTitle title="未来 72 小时协同计划" meta="共 4,480 kg" />
              <div className="demand-table">
                {demands.map((demand) => (
                  <div className="demand-row" key={`${demand.partner}-${demand.date}`}>
                    <span>{demand.date}</span>
                    <strong>{demand.partner}</strong>
                    <span>{demand.category}</span>
                    <em>{demand.value} kg</em>
                  </div>
                ))}
              </div>

              <div className="resource-strip" aria-label="运输资源概况">
                <div><strong>8</strong><span>展示任务</span></div>
                <div><strong>13</strong><span>在册车辆</span></div>
                <div><strong>¥8,560</strong><span>预计费用</span></div>
                <div className="resource-strip__alert"><strong>2</strong><span>异常任务</span></div>
              </div>

              <div className="policy-list">
                <div className="policy-list__heading">
                  <strong>政策与产业信息</strong>
                  <span>演示扩展 · 来源待接入</span>
                </div>
                {policies.map((policy) => (
                  <p key={policy}><i />{policy}</p>
                ))}
              </div>
            </article>
          </div>
        </section>

        <footer className="status-footer">
          <span><i /> 数据链路正常 · DEMO_ONLY</span>
          <span>企业、订单、物流与政策信息均为脱敏演示内容</span>
          <span>园区 E02 · 黑土寻味产销协同展示</span>
        </footer>
      </section>
    </main>
  );
}
