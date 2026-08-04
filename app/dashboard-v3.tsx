"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  AssistantChartView,
  DemandTrendChart,
  DonutChart,
  SupplyMap,
} from "./dashboard-charts";
import { makeDemoSnapshot } from "./dashboard-demo";
import type {
  ApiEnvelope,
  AssistantAnswer,
  DashboardSnapshot,
  DemandTotal,
} from "./dashboard-types";

type RangeKey = "7d" | "30d" | "month";
type AssistantState = "idle" | "requesting" | "recording" | "transcribing" | "analyzing" | "done" | "error";

const REFRESH_INTERVAL_MS = 30_000;
const MAX_RECORDING_MS = 30_000;
const MAX_AUDIO_BYTES = 5 * 1024 * 1024;

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function shanghaiParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
}

function dateAtShanghai(date: Date) {
  const values = shanghaiParts(date);
  return `${values.year}-${values.month}-${values.day}`;
}

function rangeParams(range: RangeKey) {
  const now = new Date();
  const current = dateAtShanghai(now);
  const start = new Date(`${current}T00:00:00+08:00`);
  if (range === "7d") start.setDate(start.getDate() - 6);
  if (range === "30d") start.setDate(start.getDate() - 29);
  if (range === "month") start.setDate(1);
  return {
    start_at: `${dateAtShanghai(start)}T00:00:00+08:00`,
    end_at: now.toISOString(),
  };
}

function formatNumber(value: number, maximumFractionDigits = 0) {
  return new Intl.NumberFormat("zh-CN", { maximumFractionDigits }).format(value);
}

function formatCurrency(value: number) {
  if (value >= 10_000) return `${formatNumber(value / 10_000, 1)} 万元`;
  return `${formatNumber(value, 0)} 元`;
}

function demandText(items: DemandTotal[]) {
  if (!items.length) return "暂无有效需求";
  return items.map((item) => `${formatNumber(item.quantity, 2)} ${item.unit}`).join(" · ");
}

function statusText(status: AssistantState, seconds: number) {
  const labels: Record<AssistantState, string> = {
    idle: "点击麦克风开始提问",
    requesting: "等待麦克风授权…",
    recording: `正在录音 ${pad(Math.floor(seconds / 60))}:${pad(seconds % 60)}，再次点击结束`,
    transcribing: "正在转写语音…",
    analyzing: "正在分析园区数据…",
    done: "分析完成",
    error: "请求未完成，请重试",
  };
  return labels[status];
}

function PanelTitle({ title, meta }: { title: string; meta?: string }) {
  return (
    <div className="panel-heading">
      <h2>{title}</h2>
      {meta ? <span>{meta}</span> : null}
    </div>
  );
}

function MetricCard({
  label,
  value,
  note,
  tone = "ice",
}: {
  label: string;
  value: string;
  note: string;
  tone?: "ice" | "green" | "amber";
}) {
  return (
    <article className="metric-card" data-tone={tone}>
      <span className="metric-label">{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  );
}

export default function DashboardV3() {
  const [snapshot, setSnapshot] = useState<DashboardSnapshot>(() => makeDemoSnapshot());
  const [range, setRange] = useState<RangeKey>("30d");
  const [source, setSource] = useState<"live" | "demo">("demo");
  const [now, setNow] = useState<Date | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [assistantState, setAssistantState] = useState<AssistantState>("idle");
  const [assistantError, setAssistantError] = useState<string | null>(null);
  const [assistantAnswer, setAssistantAnswer] = useState<AssistantAnswer | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [recordSeconds, setRecordSeconds] = useState(0);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const queryWindow = useMemo(() => rangeParams(range), [range]);

  const loadSnapshot = useCallback(async () => {
    const params = new URLSearchParams(queryWindow);
    try {
      const response = await fetch(`/api/public/dashboard/snapshot?${params}`, { cache: "no-store" });
      if (!response.ok) throw new Error(`snapshot ${response.status}`);
      const payload = (await response.json()) as ApiEnvelope<DashboardSnapshot>;
      if (!payload.data?.headline) throw new Error("invalid snapshot");
      setSnapshot(payload.data);
      setSource(payload.data.demo_mode ? "demo" : "live");
      setLastUpdated(new Date());
    } catch {
      setSnapshot(makeDemoSnapshot());
      setSource("demo");
      setLastUpdated(new Date());
    }
  }, [queryWindow]);

  useEffect(() => {
    const initial = window.setTimeout(() => void loadSnapshot(), 0);
    const refresh = window.setInterval(() => void loadSnapshot(), REFRESH_INTERVAL_MS);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(refresh);
    };
  }, [loadSnapshot]);

  useEffect(() => {
    const initialClock = window.setTimeout(() => setNow(new Date()), 0);
    const clock = window.setInterval(() => setNow(new Date()), 1_000);
    return () => {
      window.clearTimeout(initialClock);
      window.clearInterval(clock);
    };
  }, []);

  useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    recorderRef.current?.stream.getTracks().forEach((track) => track.stop());
  }, []);

  const finishAssistantRequest = useCallback(async (audio: Blob) => {
    if (audio.size > MAX_AUDIO_BYTES) {
      setAssistantState("error");
      setAssistantError("录音超过 5 MiB，请缩短提问时间");
      return;
    }
    try {
      setAssistantState("transcribing");
      const form = new FormData();
      const extension = audio.type.includes("ogg") ? "ogg" : audio.type.includes("mp4") ? "mp4" : "webm";
      form.append("audio", audio, `dashboard-question.${extension}`);
      const transcriptionResponse = await fetch("/api/public/assistant/transcriptions", { method: "POST", body: form });
      if (!transcriptionResponse.ok) throw new Error("语音转写服务暂时不可用");
      const transcriptionPayload = (await transcriptionResponse.json()) as ApiEnvelope<{ text: string }>;
      const question = transcriptionPayload.data.text;
      setTranscript(question);
      setAssistantState("analyzing");
      const answerResponse = await fetch("/api/public/assistant/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, ...queryWindow, park_id: snapshot.park_id }),
      });
      if (!answerResponse.ok) throw new Error("数据分析服务暂时不可用");
      const answerPayload = (await answerResponse.json()) as ApiEnvelope<AssistantAnswer>;
      setAssistantAnswer(answerPayload.data);
      setAssistantState("done");
    } catch (error) {
      setAssistantState("error");
      setAssistantError(error instanceof Error ? error.message : "语音助手请求失败");
    }
  }, [queryWindow, snapshot.park_id]);

  const stopRecording = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    timeoutRef.current = null;
    timerRef.current = null;
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }, []);

  const startRecording = useCallback(async () => {
    setAssistantError(null);
    setAssistantAnswer(null);
    setTranscript(null);
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setAssistantState("error");
      setAssistantError("当前浏览器不支持麦克风录音");
      return;
    }
    try {
      setAssistantState("requesting");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = ["audio/webm;codecs=opus", "audio/ogg;codecs=opus", "audio/mp4", "audio/webm"]
        .find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const audio = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        chunksRef.current = [];
        void finishAssistantRequest(audio);
      };
      recorder.start(250);
      setRecordSeconds(0);
      setAssistantState("recording");
      timerRef.current = setInterval(() => setRecordSeconds((value) => value + 1), 1_000);
      timeoutRef.current = setTimeout(stopRecording, MAX_RECORDING_MS);
    } catch {
      setAssistantState("error");
      setAssistantError("麦克风权限被拒绝，请在浏览器中允许后重试");
    }
  }, [finishAssistantRequest, stopRecording]);

  const toggleRecording = () => {
    if (assistantState === "recording") stopRecording();
    else if (!(["requesting", "transcribing", "analyzing"] as AssistantState[]).includes(assistantState)) void startRecording();
  };

  const clock = now ? shanghaiParts(now) : null;
  const thirdSpace = snapshot.channel_mix.find((item) => item.channel_type === "THIRD_SPACE");
  const traditional = snapshot.channel_mix.find((item) => item.channel_type === "TRADITIONAL_STORE");
  const thirdRank = [...snapshot.third_spaces].sort((a, b) => b.sales_amount - a.sales_amount).slice(0, 5);
  const dataWarningCount = snapshot.data_quality.missing_store_classification_count
    + snapshot.data_quality.missing_coordinate_count
    + snapshot.data_quality.missing_report_count;

  return (
    <main className="dashboard-shell" aria-label="黑土寻味产销协同大屏">
      <div className="dashboard-atmosphere" aria-hidden="true" />
      <section className="dashboard-stage">
        <header className="topbar">
          <div className="jipin-brand" aria-label="吉品临时文字标">
            <span className="jipin-wordmark">吉品</span>
            <span className="jipin-note">绿色食品 · 临时文字标</span>
          </div>
          <div className="title-block">
            <h1>黑土寻味 · 产销协同大屏</h1>
            <p>{snapshot.park_name} · 生产 · 需求 · 第三空间</p>
          </div>
          <div className="topbar-meta">
            <div className="range-switch" aria-label="统计周期">
              {(["7d", "30d", "month"] as RangeKey[]).map((item) => (
                <button key={item} className={range === item ? "is-active" : ""} onClick={() => setRange(item)}>
                  {item === "7d" ? "7 日" : item === "30d" ? "30 日" : "本月"}
                </button>
              ))}
            </div>
            <time dateTime={now?.toISOString()}>
              {clock ? `${clock.year}.${clock.month}.${clock.day} ${clock.hour}:${clock.minute}:${clock.second}` : "----.--.-- --:--:--"}
            </time>
          </div>
        </header>

        <div className="source-ribbon" data-source={source}>
          <span>{source === "live" ? "实时数据" : "演示数据"}</span>
          <small>
            {source === "live"
              ? `每 30 秒刷新 · 最近更新 ${lastUpdated ? lastUpdated.toLocaleTimeString("zh-CN", { hour12: false }) : "--"}`
              : "后端未连接或演示模式开启，当前数字仅用于界面演示"}
          </small>
        </div>

        <section className="metrics" aria-label="园区核心指标">
          <MetricCard label="园区有效预订单" value={`${formatNumber(snapshot.headline.preorder_count)} 笔`} note="按 required_at 统计" tone="ice" />
          <article className="metric-card metric-card--demand" data-tone="amber">
            <span className="metric-label">园区需求数量</span>
            <div className="demand-units">
              {snapshot.headline.demand_totals.map((item) => (
                <span key={item.unit}><strong>{formatNumber(item.quantity, 2)}</strong><small>{item.unit}</small></span>
              ))}
              {!snapshot.headline.demand_totals.length ? <em>暂无有效需求</em> : null}
            </div>
            <small>不同单位独立展示，未进行混合相加</small>
          </article>
          <MetricCard label="经营订单量" value={`${formatNumber(snapshot.headline.operation_order_count)} 单`} note="来源：B02 门店经营日报" tone="green" />
          <MetricCard label="园区营业额" value={formatCurrency(snapshot.headline.sales_amount)} note="传统门店与第三空间合计" tone="green" />
          <MetricCard
            label="第三空间贡献"
            value={`${formatNumber(thirdSpace?.sales_share ?? 0, 1)}%`}
            note={`营业额 ${formatCurrency(thirdSpace?.sales_amount ?? 0)}`}
            tone="green"
          />
        </section>

        <section className="content-grid">
          <div className="left-column">
            <article className="glass-panel trend-panel">
              <PanelTitle title="每日需求趋势" meta="传统门店 / 第三空间" />
              <DemandTrendChart points={snapshot.daily_trend} />
            </article>
            <article className="glass-panel ranking-panel">
              <PanelTitle title="第三空间销售排行" meta={`${snapshot.third_spaces.length} 个点位`} />
              <ol className="ranking-list">
                {thirdRank.map((store, index) => {
                  const max = thirdRank[0]?.sales_amount || 1;
                  return (
                    <li key={store.store_id}>
                      <span className="rank-index">{pad(index + 1)}</span>
                      <div className="rank-copy">
                        <div><strong>{store.store_name}</strong><small>{store.city || "城市待补充"}</small></div>
                        <span className="rank-bar"><i style={{ width: `${Math.max((store.sales_amount / max) * 100, 8)}%` }} /></span>
                      </div>
                      <div className="rank-value"><strong>{formatCurrency(store.sales_amount)}</strong><small>{formatNumber(store.operation_order_count)} 单</small></div>
                    </li>
                  );
                })}
              </ol>
            </article>
          </div>

          <article className="glass-panel map-panel">
            <PanelTitle title="东北三省供销网络" meta="EPSG:4326 · 离线边界" />
            <div className="map-legend" aria-label="地图图例">
              <span data-kind="park">园区</span>
              <span data-kind="traditional">传统门店</span>
              <span data-kind="third">第三空间</span>
            </div>
            <SupplyMap snapshot={snapshot} />
            <div className="map-footnote">
              <span>哈尔滨 · 黑龙江</span>
              <span>长春 · 吉林</span>
              <span>沈阳 · 辽宁</span>
            </div>
          </article>

          <div className="right-column">
            <article className="glass-panel mix-panel">
              <PanelTitle title="渠道经营贡献" meta="第三空间绿色强化" />
              <div className="donut-grid">
                <div><DonutChart metric={snapshot.channel_mix} value="operation_order_count" /></div>
                <div><DonutChart metric={snapshot.channel_mix} value="sales_amount" /></div>
              </div>
              <div className="mix-summary">
                <div><span>第三空间</span><strong>{formatNumber(thirdSpace?.operation_order_share ?? 0, 1)}%</strong><small>{demandText(thirdSpace?.demand_totals ?? [])}</small></div>
                <div><span>传统门店</span><strong>{formatNumber(traditional?.operation_order_share ?? 0, 1)}%</strong><small>{demandText(traditional?.demand_totals ?? [])}</small></div>
              </div>
            </article>

            <article className="glass-panel assistant-panel">
              <PanelTitle title="智能问答助手" meta="仅查询聚合数据" />
              <div className="assistant-body">
                <button
                  className="microphone"
                  data-state={assistantState}
                  type="button"
                  aria-label={assistantState === "recording" ? "结束录音" : "开始语音提问"}
                  onClick={toggleRecording}
                  disabled={assistantState === "requesting" || assistantState === "transcribing" || assistantState === "analyzing"}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Zm-7 9a1 1 0 1 1 2 0v1a5 5 0 0 0 10 0v-1a1 1 0 1 1 2 0v1a7 7 0 0 1-6 6.92V21h3a1 1 0 1 1 0 2H8a1 1 0 1 1 0-2h3v-2.08A7 7 0 0 1 5 12v-1Z" />
                  </svg>
                </button>
                <div className="assistant-status">
                  <strong>{statusText(assistantState, recordSeconds)}</strong>
                  <small>最长 30 秒 · 音频不超过 5 MiB</small>
                </div>
              </div>
              {transcript ? <p className="transcript"><span>识别结果</span>{transcript}</p> : null}
              {assistantError ? <p className="assistant-error" role="alert">{assistantError}</p> : null}
              {assistantAnswer ? (
                <button className="answer-preview" type="button" onClick={() => setAssistantState("done")}>
                  <span>分析结果</span>{assistantAnswer.answer}
                  {assistantAnswer.chart ? <strong>展开可视化 →</strong> : null}
                </button>
              ) : (
                <div className="question-examples">
                  <span>可问：第三空间营业额占比是多少？</span>
                  <span>可问：最近一周需求趋势如何？</span>
                </div>
              )}
            </article>
          </div>
        </section>

        <footer className="dashboard-footer">
          <span className="quality-dot" data-level={dataWarningCount ? "warning" : "good"} />
          <span>数据质量：日报覆盖率 {snapshot.data_quality.report_coverage ?? "--"}%</span>
          <span>缺少分类 {snapshot.data_quality.missing_store_classification_count}</span>
          <span>缺少坐标 {snapshot.data_quality.missing_coordinate_count}</span>
          <span>缺少日报 {snapshot.data_quality.missing_report_count}</span>
          <span className="footer-spacer" />
          <span>统计时区 Asia/Shanghai</span>
        </footer>
      </section>

      {assistantAnswer ? (
        <aside className="assistant-drawer" aria-label="智能问答分析结果">
          <div className="drawer-head">
            <div><span>AI DATA INSIGHT</span><h2>{assistantAnswer.chart?.title || "园区数据分析"}</h2></div>
            <button type="button" aria-label="关闭分析结果" onClick={() => { setAssistantAnswer(null); setAssistantState("idle"); }}>×</button>
          </div>
          <p>{assistantAnswer.answer}</p>
          {assistantAnswer.chart ? <div className="assistant-chart"><AssistantChartView chart={assistantAnswer.chart} /></div> : null}
          <small>数据截止 {new Date(assistantAnswer.data_cutoff).toLocaleString("zh-CN", { hour12: false })} · 聚合工具 {assistantAnswer.tools_used.join(" / ")}</small>
        </aside>
      ) : null}
    </main>
  );
}
