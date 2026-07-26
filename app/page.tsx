"use client";

/*

import { useEffect, useMemo, useState } from "react";

const metrics = [
  { label: "入园企业", value: "18", unit: "家", note: "覆盖 8 类食品加工", tone: "green" },
  { label: "今日可用产能", value: "8,730", unit: "kg", note: "较昨日 +6.8%", tone: "green" },
  { label: "未来 72 小时需求", value: "4,480", unit: "kg", note: "8 笔协同需求", tone: "gold" },
  { label: "近 7 日承接订单", value: "11,180", unit: "kg", note: "峰值 1,900 kg", tone: "green" },
  { label: "当前运输任务", value: "8", unit: "项", note: "6 正常 · 2 需关注", tone: "blue" },
  { label: "近 7 日已结算", value: "48.63", unit: "万元", note: "环比 +12.4%", tone: "gold" },
];

const stages = [
  { index: "01", label: "供给主体", value: "18 家", note: "8 类产业品类", tone: "green" },
  { index: "02", label: "生产汇聚", value: "8,730 kg", note: "今日可调度", tone: "green" },
  { index: "03", label: "订单协同", value: "4,480 kg", note: "未来 72 小时", tone: "gold" },
  { index: "04", label: "冷链履约", value: "8 项", note: "2 项任务需关注", tone: "blue", alert: true },
  { index: "05", label: "交付结算", value: "¥48.63 万", note: "近 7 日已结算", tone: "gold" },
];

const companies = [
  { name: "企业 A01", category: "速冻食品", value: 1680 },
  { name: "企业 A02", category: "净菜加工", value: 1420 },
  { name: "企业 A03", category: "烘焙食品", value: 1250 },
  { name: "企业 A04", category: "冷链饮品", value: 1160 },
  { name: "企业 A05", category: "豆制食品", value: 980 },
  { name: "企业 A06", category: "粮油制品", value: 870 },
];

const days = ["07-19", "07-20", "07-21", "07-22", "07-23", "07-24", "07-25"];
const orderTrend = [1320, 1510, 1390, 1760, 1600, 1700, 1900];
const salesTrend = [5.42, 6.18, 5.89, 7.34, 6.95, 7.69, 9.16];

const demands = [
  { day: "07-26", time: "07:30", partner: "合作方 B01", category: "速冻食品", value: 760 },
  { day: "07-26", time: "09:00", partner: "合作方 B02", category: "净菜加工", value: 680 },
  { day: "07-26", time: "14:00", partner: "合作方 B03", category: "冷链饮品", value: 540 },
  { day: "07-27", time: "06:30", partner: "合作方 B04", category: "烘焙食品", value: 430 },
  { day: "07-27", time: "08:00", partner: "合作方 B05", category: "粮油制品", value: 920 },
];

const alerts = [
  { id: "TASK-DEMO-002", title: "冷藏温度短时超限", detail: "配送节点 02 · 高于阈值 1.8℃" },
  { id: "TASK-DEMO-005", title: "预计到达时间偏晚", detail: "配送节点 05 · 晚于计划 18 min" },
];

function TrendBars({
  values,
  max,
  tone,
  formatter,
}: {
  values: number[];
  max: number;
  tone: "green" | "gold";
  formatter: (value: number) => string;
}) {
  return (
    <div className={`trend-bars trend-${tone}`}>
      {values.map((value, index) => (
        <div className="trend-column" key={`${tone}-${days[index]}`}>
          <span className="trend-value">{formatter(value)}</span>
          <div className="trend-rail">
            <span style={{ height: `${Math.max((value / max) * 100, 14)}%` }} />
          </div>
          <span className="trend-day">{days[index]}</span>
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const [scale, setScale] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const resize = () => {
      setScale(Math.min(window.innerWidth / 1920, window.innerHeight / 1080));
    };
    const fullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
      resize();
    };
    resize();
    window.addEventListener("resize", resize);
    document.addEventListener("fullscreenchange", fullscreenChange);
    return () => {
      window.removeEventListener("resize", resize);
      document.removeEventListener("fullscreenchange", fullscreenChange);
    };
  }, []);

  const dashboardStyle = useMemo(
    () => ({ "--dashboard-scale": scale }) as React.CSSProperties,
    [scale],
  );

  const toggleFullscreen = async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await document.documentElement.requestFullscreen();
    }
  };

  return (
    <main className="screen-wrap">
      <section className="dashboard" style={dashboardStyle} aria-label="黑土寻味·产销闭环大屏">
        <header className="topbar">
          <div className="brand">
            <div className="brand-mark" aria-hidden="true">
              <span>土</span>
            </div>
            <div>
              <strong>黑土寻味</strong>
              <small>TASTE OF BLACK SOIL</small>
            </div>
          </div>

          <div className="title-block">
            <span className="eyebrow">BLACK SOIL DATA HUB&nbsp;&nbsp;/&nbsp;&nbsp;黑土地绿色食品产业协同大屏</span>
            <h1>黑土寻味·产销闭环</h1>
          </div>

          <div className="topbar-status">
            <div className="cutoff">
              <span>数据截至</span>
              <strong>2026-07-25&nbsp;&nbsp;16:30</strong>
            </div>
            <span className="demo-badge"><i />演示数据</span>
            <button type="button" className="fullscreen-button" onClick={toggleFullscreen}>
              <span className="fullscreen-icon" aria-hidden="true" />
              {isFullscreen ? "退出全屏" : "进入全屏"}
            </button>
          </div>
        </header>

        <section className="metric-strip" aria-label="核心经营指标">
          {metrics.map((metric) => (
            <article className={`metric metric-${metric.tone}`} key={metric.label}>
              <div className="metric-heading">
                <span>{metric.label}</span>
                <i aria-hidden="true" />
              </div>
              <div className="metric-number">
                <strong>{metric.value}</strong>
                <span>{metric.unit}</span>
              </div>
              <small>{metric.note}</small>
            </article>
          ))}
        </section>

        <section className="hero-chain" aria-labelledby="chain-title">
          <div className="hero-topline">
            <div>
              <span className="section-kicker">DATA CORE 01 / INDUSTRY COLLABORATION</span>
              <h2 id="chain-title">黑土产销协同脉络</h2>
            </div>
            <p>
              <span>供给、订单、履约与经营结果形成一条可追溯闭环</span>
              <strong><i />2 项运输任务需要关注</strong>
            </p>
          </div>

          <div className="furrow-canvas" aria-label="从供给到结算的产业协同流程">
            <div className="signal-ruler" aria-hidden="true">
              <span>N43° 52&apos; / BLACK SOIL PARK</span>
              <span>5 DATA NODES · SYNC 30S</span>
              <span>FLOW STATUS / ACTIVE</span>
            </div>
            <div className="furrow-line furrow-line-one" />
            <div className="furrow-line furrow-line-two" />
            <div className="furrow-line furrow-line-three" />
            <div className="chain-track">
              {stages.map((stage, index) => (
                <div className="stage-group" key={stage.index}>
                  <article className={`stage stage-${stage.tone} ${stage.alert ? "stage-alert" : ""}`}>
                    <span className="stage-index">{stage.index}</span>
                    <div className="stage-orb" aria-hidden="true">
                      <i />
                    </div>
                    <span className="stage-label">{stage.label}</span>
                    <strong>{stage.value}</strong>
                    <small>{stage.note}</small>
                    {stage.alert && <span className="alert-pin">2</span>}
                  </article>
                  {index < stages.length - 1 && <div className={`track-segment segment-${index + 1}`} />}
                </div>
              ))}
            </div>
            <div className="feedback-path">
              <span>经营数据反哺生产计划</span>
              <i aria-hidden="true">←</i>
            </div>
            <div className="hero-insight">
              <span>今日协同摘要</span>
              <strong>生产供给稳定，未来需求集中在冷冻与净菜品类</strong>
            </div>
          </div>
        </section>

        <section className="bottom-grid">
          <article className="panel capacity-panel">
            <div className="panel-heading">
              <div>
                <span className="section-kicker">DATA NODE 02 / SUPPLY CAPACITY</span>
                <h2>重点企业可用产能</h2>
              </div>
              <span className="soft-badge">Top 6 占比 84.3%</span>
            </div>
            <div className="capacity-list">
              {companies.map((company) => (
                <div className="capacity-row" key={company.name}>
                  <div className="capacity-meta">
                    <strong>{company.name}</strong>
                    <span>{company.category}</span>
                    <b>{company.value.toLocaleString()} kg</b>
                  </div>
                  <div className="capacity-rail">
                    <span style={{ width: `${(company.value / 1680) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="panel trend-panel">
            <div className="panel-heading">
              <div>
                <span className="section-kicker">DATA NODE 03 / SEVEN-DAY PULSE</span>
                <h2>订单与经营脉动</h2>
              </div>
              <span className="soft-badge">近 7 日</span>
            </div>
            <div className="trend-layout">
              <section className="trend-block">
                <div className="trend-title">
                  <span>承接订单量</span>
                  <strong>11,180 <small>kg</small></strong>
                </div>
                <TrendBars
                  values={orderTrend}
                  max={1900}
                  tone="green"
                  formatter={(value) => `${(value / 1000).toFixed(1)}k`}
                />
              </section>
              <section className="trend-block">
                <div className="trend-title">
                  <span>已结算销售额</span>
                  <strong>48.63 <small>万元</small></strong>
                </div>
                <TrendBars
                  values={salesTrend}
                  max={9.16}
                  tone="gold"
                  formatter={(value) => value.toFixed(1)}
                />
              </section>
            </div>
          </article>

          <article className="panel demand-panel">
            <div className="panel-heading">
              <div>
                <span className="section-kicker">DATA NODE 04 / UPCOMING DEMAND</span>
                <h2>未来 72 小时协同计划</h2>
              </div>
              <span className="soft-badge gold-badge">4,480 kg</span>
            </div>
            <div className="demand-layout">
              <div className="schedule">
                {demands.map((demand) => (
                  <div className="schedule-row" key={`${demand.partner}-${demand.time}`}>
                    <div className="schedule-time">
                      <strong>{demand.time}</strong>
                      <span>{demand.day}</span>
                    </div>
                    <i aria-hidden="true" />
                    <div className="schedule-detail">
                      <strong>{demand.partner}</strong>
                      <span>{demand.category}</span>
                    </div>
                    <b>{demand.value} kg</b>
                  </div>
                ))}
              </div>
              <aside className="alert-stack" aria-label="需要关注的运输任务">
                <div className="alert-heading">
                  <span>协同提醒</span>
                  <strong>2 项</strong>
                </div>
                {alerts.map((alert) => (
                  <div className="alert-item" key={alert.id}>
                    <span>{alert.id}</span>
                    <strong>{alert.title}</strong>
                    <small>{alert.detail}</small>
                  </div>
                ))}
              </aside>
            </div>
          </article>
        </section>

        <footer className="footer">
          <span><i className="status-dot" />数据链路正常 · DEMO_ONLY</span>
          <span>所有企业、订单与运输数据均为脱敏演示数据</span>
          <span>TASTE OF BLACK SOIL · PARK E02</span>
        </footer>
      </section>
    </main>
  );
}
*/

export { default } from "./dashboard-v3";
