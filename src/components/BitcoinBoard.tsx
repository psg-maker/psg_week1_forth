"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type LiveRow = {
  id: string;
  signalId: string;
  recordDate: string;
  normalizedValue: number;
  unit: string;
  sourceName: string;
  sourceUrl: string;
  sourceTime: string | null;
  firstFetchedAt: string;
  lastFetchedAt: string;
  reading: {
    signal_id: string;
    normalized_value: number;
    unit: string;
    source_name: string;
    source_url: string;
    source_time: string | null;
    fetched_at: string;
    record_timezone: "Asia/Seoul";
    record_date: string;
  };
  rawPayload: {
    trade_id: number;
    side: string;
    size: string;
    price: string;
    time: string;
  };
};

type LiveReceipt = {
  id: string;
  kind: string;
  recordDate: string;
  serverCreatedAt: string;
  sourceUrl: string;
  sourceObservedAt: string | null;
  normalizedValue: number;
  unit: string;
};

type LiveState = {
  current: LiveRow | null;
  rows: LiveRow[];
  status: {
    id: number;
    freshness: "fresh" | "stale";
    errorCode: string;
    lastAttemptAt: string;
  } | null;
  comparison: {
    state: "insufficient" | "unit_mismatch" | "comparable";
    direction: "increase" | "decrease" | "unchanged" | null;
    magnitude: number | null;
    unit: string | null;
  };
  receipts: LiveReceipt[];
};

type ReplayState = {
  schema_version: string;
  daily_readings: Array<{
    record_id: string;
    signal_id: string;
    record_date: string;
    normalized_value: number;
    unit: string;
    first_fetched_at: string;
    last_fetched_at: string;
    reading: {
      signal_id: string;
      normalized_value: number;
      unit: string;
      source_name: string;
      source_url: string;
      source_time: string | null;
      fetched_at: string;
      record_timezone: "Asia/Seoul";
      record_date: string;
    };
  }>;
  current_reading: {
    signal_id: string;
    normalized_value: number;
    unit: string;
    source_name: string;
    source_url: string;
    source_time: string | null;
    fetched_at: string;
    record_timezone: "Asia/Seoul";
    record_date: string;
  } | null;
  status: { freshness: "fresh" | "stale"; error_code: string } | null;
  last_delta: number | null;
  last_comparison: {
    state: string;
    direction: string | null;
    magnitude: number | null;
    unit: string | null;
  };
  last_run: {
    fixture_id: string | null;
    virtual_now: string | null;
    outcome: "success" | "error";
    error_code: string;
    retry_after_seconds: number | null;
  } | null;
  sequence: number;
};

const errorMessages: Record<string, string> = {
  timeout: "응답 시간이 초과되었습니다.",
  auth: "외부 데이터 원천에서 요청을 거절했습니다.",
  rate_limit: "요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.",
  offline: "네트워크에 연결할 수 없습니다.",
  schema_error: "데이터 형식이 예상과 다릅니다.",
};

const fixtureButtons = [
  { id: "T04-NORMAL-D1-A", label: "정상 D1-A" },
  { id: "T04-NORMAL-D1-B", label: "정상 D1-B" },
  { id: "T04-NORMAL-D2", label: "정상 D2" },
  { id: "T04-TIMEOUT", label: "Timeout" },
  { id: "T04-AUTH-401", label: "401 / 403" },
  { id: "T04-RATE-429", label: "429 Rate Limit" },
  { id: "T04-OFFLINE", label: "Offline" },
  { id: "T04-SCHEMA-BREAK", label: "Schema Error" },
  { id: "T04-RECOVER-D2", label: "Recover D2" },
] as const;

function formatNumber(value: number, maximumFractionDigits = 2) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits }).format(value);
}

function formatKst(iso: string | null | undefined) {
  if (!iso) return "없음";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "잘못된 시각";
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}

function deltaText(
  comparison: LiveState["comparison"] | ReplayState["last_comparison"],
) {
  if (comparison.state !== "comparable" || comparison.magnitude == null) return "비교할 이전 기록 없음";
  const sign = comparison.direction === "increase" ? "+" : comparison.direction === "decrease" ? "−" : "±";
  return `${sign}${formatNumber(comparison.magnitude)} ${comparison.unit ?? ""}`;
}

export function BitcoinBoard() {
  const [tab, setTab] = useState<"live" | "replay">("live");
  const [live, setLive] = useState<LiveState | null>(null);
  const [replay, setReplay] = useState<ReplayState | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const loadLive = useCallback(async () => {
    const response = await fetch("/api/live", { cache: "no-store" });
    if (!response.ok) throw new Error("실제 데이터 상태를 불러오지 못했습니다.");
    setLive((await response.json()) as LiveState);
  }, []);

  const loadReplay = useCallback(async () => {
    const response = await fetch("/api/replay", { cache: "no-store" });
    if (!response.ok) throw new Error("합성 재생 상태를 불러오지 못했습니다.");
    const body = (await response.json()) as { state: ReplayState };
    setReplay(body.state);
  }, []);

  useEffect(() => {
    Promise.all([loadLive(), loadReplay()]).catch((error) => {
      setNotice(error instanceof Error ? error.message : "초기 데이터를 불러오지 못했습니다.");
    });
  }, [loadLive, loadReplay]);

  const fetchLive = async () => {
    setBusy(true);
    setNotice(null);
    try {
      const response = await fetch("/api/live/fetch", { method: "POST" });
      const body = await response.json();
      if (body.state) setLive(body.state as LiveState);
      if (!response.ok) {
        const code = body.error_code as string | undefined;
        setNotice(code ? errorMessages[code] ?? code : "실제 데이터 조회에 실패했습니다.");
      } else {
        setNotice("Coinbase의 최신 체결가를 정상적으로 저장했습니다.");
      }
    } catch {
      setNotice("앱 서버에 연결하지 못했습니다.");
    } finally {
      setBusy(false);
    }
  };

  const runFixture = async (fixtureId: string) => {
    setBusy(true);
    setNotice(null);
    try {
      const response = await fetch(`/api/replay/${fixtureId}`, { method: "POST" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message ?? "fixture 실행 실패");
      setReplay(body.state as ReplayState);

      const allChecksPass = body.checks && Object.values(body.checks).every(Boolean);
      setNotice(
        allChecksPass
          ? `${fixtureId}: 공개 fixture의 expected 값과 일치합니다.`
          : `${fixtureId}: 실행은 완료됐지만 expected와 다른 항목이 있습니다.`,
      );
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "fixture 실행에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  };

  const resetReplay = async () => {
    setBusy(true);
    setNotice(null);
    try {
      const response = await fetch("/api/replay/reset", { method: "POST" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message ?? "초기화 실패");
      setReplay(body.state as ReplayState);
      setNotice("합성 평가 상태만 초기화했습니다. 실제 Coinbase 기록은 유지됩니다.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "초기화에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  };

  const liveStatus = live?.status;
  const replayStatus = replay?.status;
  const liveCurrent = live?.current;
  const replayCurrent = replay?.current_reading;

  const livePrice = useMemo(
    () => (liveCurrent ? `$${formatNumber(liveCurrent.normalizedValue)}` : "아직 저장된 값 없음"),
    [liveCurrent],
  );

  const evidenceDelta = useMemo(() => {
    if (!live || live.receipts.length !== 2) return null;
    const [first, second] = live.receipts;
    if (first.unit !== second.unit) return null;
    return {
      signed: second.normalizedValue - first.normalizedValue,
      unit: second.unit,
    };
  }, [live]);

  return (
    <main className="shell">
      <header className="hero">
        <p className="eyebrow">ALEPH T04 · 오늘의 진짜 정보판</p>
        <h1>오늘의 비트코인</h1>
        <p className="subtitle">
          Coinbase BTC/USD 최근 체결가를 서울 날짜 기준으로 하루 한 건 보존하고,
          데이터가 끊기면 마지막 정상값을 유지합니다.
        </p>
      </header>

      <nav className="tabs" aria-label="정보판 모드">
        <button className={tab === "live" ? "tab active" : "tab"} onClick={() => setTab("live")}>
          실제 데이터
        </button>
        <button className={tab === "replay" ? "tab active" : "tab"} onClick={() => setTab("replay")}>
          합성 장애 재생
        </button>
      </nav>

      {notice && <div className="notice">{notice}</div>}

      {tab === "live" ? (
        <section className="stack">
          <article className="panel price-panel">
            <div className="panel-head">
              <div>
                <p className="kicker">Coinbase BTC/USD 최근 체결가</p>
                <h2>{livePrice}</h2>
                <p className="unit">1 BTC · USD/BTC</p>
              </div>
              <span className={`status ${liveStatus?.freshness ?? "empty"}`}>
                {liveStatus?.freshness === "fresh"
                  ? "최신 데이터"
                  : liveStatus?.freshness === "stale"
                    ? "오래된 데이터"
                    : "대기 중"}
              </span>
            </div>

            <div className="delta-card">
              <span>전일 대비</span>
              <strong>{live ? deltaText(live.comparison) : "-"}</strong>
            </div>

            {liveStatus?.freshness === "stale" && (
              <div className="error-box">
                <strong>{errorMessages[liveStatus.errorCode] ?? liveStatus.errorCode}</strong>
                <span>마지막 정상값을 그대로 표시하고 있습니다.</span>
              </div>
            )}

            <button className="primary" onClick={fetchLive} disabled={busy}>
              {busy ? "처리 중..." : liveStatus?.freshness === "stale" ? "다시 시도" : "최신 가격 조회"}
            </button>
          </article>

          <div className="grid two">
            <article className="panel">
              <h3>데이터 정보</h3>
              <dl className="facts">
                <div><dt>출처</dt><dd>{liveCurrent?.sourceName ?? "-"}</dd></div>
                <div><dt>원천 URL</dt><dd>{liveCurrent ? <a href={liveCurrent.sourceUrl} target="_blank" rel="noreferrer">Coinbase 공개 API</a> : "-"}</dd></div>
                <div><dt>출처 시각</dt><dd>{formatKst(liveCurrent?.sourceTime)}</dd></div>
                <div><dt>조회 시각</dt><dd>{formatKst(liveCurrent?.lastFetchedAt)}</dd></div>
                <div><dt>기준 시간대</dt><dd>Asia/Seoul</dd></div>
                <div><dt>기록 날짜</dt><dd>{liveCurrent?.recordDate ?? "-"}</dd></div>
              </dl>
            </article>

            <article className="panel">
              <h3>원자료 ↔ 저장값 확인</h3>
              {liveCurrent ? (
                <div className="raw-check">
                  <div><span>원자료 price</span><code>{liveCurrent.rawPayload.price}</code></div>
                  <div><span>저장 normalized_value</span><code>{liveCurrent.normalizedValue}</code></div>
                  <div><span>원자료 time</span><code>{liveCurrent.rawPayload.time}</code></div>
                  <div><span>저장 source_time</span><code>{liveCurrent.sourceTime ?? "null"}</code></div>
                </div>
              ) : (
                <p className="muted">최신 가격 조회 후 확인할 수 있습니다.</p>
              )}
            </article>
          </div>

          <article className="panel">
            <div className="panel-head compact">
              <div>
                <h3>실제 날짜 증거</h3>
                <p className="muted">서로 다른 Asia/Seoul 날짜의 실제 조회 기록을 정확히 2건 보존합니다.</p>
              </div>
              <div className="evidence-summary">
                <strong>{live?.receipts.length ?? 0} / 2</strong>
                <span>
                  증거 2건 기준 변화: {evidenceDelta
                    ? `${evidenceDelta.signed >= 0 ? "+" : "−"}${formatNumber(Math.abs(evidenceDelta.signed))} ${evidenceDelta.unit}`
                    : "두 날짜가 모이면 계산"}
                </span>
              </div>
            </div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>서울 날짜</th><th>값</th><th>단위</th><th>원천 URL</th><th>원천 관측 시각</th><th>최초 관측 시각</th></tr></thead>
                <tbody>
                  {live?.receipts.length ? live.receipts.map((receipt) => (
                    <tr key={receipt.id}>
                      <td>{receipt.recordDate}</td>
                      <td>{formatNumber(receipt.normalizedValue)}</td>
                      <td>{receipt.unit}</td>
                      <td><a href={receipt.sourceUrl} target="_blank" rel="noreferrer">Coinbase API</a></td>
                      <td>{formatKst(receipt.sourceObservedAt)}</td>
                      <td>{formatKst(receipt.serverCreatedAt)}</td>
                    </tr>
                  )) : <tr><td colSpan={6}>아직 보존된 실제 날짜 증거가 없습니다.</td></tr>}
                </tbody>
              </table>
            </div>
          </article>

          <article className="panel">
            <h3>최근 일별 기록</h3>
            <div className="table-wrap">
              <table>
                <thead><tr><th>날짜</th><th>BTC 가격</th><th>단위</th><th>마지막 조회</th></tr></thead>
                <tbody>
                  {live?.rows.length ? live.rows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.recordDate}</td>
                      <td>${formatNumber(row.normalizedValue)}</td>
                      <td>{row.unit}</td>
                      <td>{formatKst(row.lastFetchedAt)}</td>
                    </tr>
                  )) : <tr><td colSpan={4}>기록이 없습니다.</td></tr>}
                </tbody>
              </table>
            </div>
          </article>
        </section>
      ) : (
        <section className="stack">
          <article className="panel">
            <div className="panel-head compact">
              <div>
                <h2>결정론 fixture 재생</h2>
                <p className="muted">실제 Coinbase 기록과 분리된 합성 평가 상태만 바뀝니다.</p>
              </div>
              <button className="secondary" onClick={resetReplay} disabled={busy}>Reset</button>
            </div>

            <div className="fixture-grid">
              {fixtureButtons.map((fixture) => (
                <button key={fixture.id} className="fixture" onClick={() => runFixture(fixture.id)} disabled={busy}>
                  <span>{fixture.label}</span>
                  <small>{fixture.id}</small>
                </button>
              ))}
            </div>
          </article>

          <div className="grid two">
            <article className="panel price-panel">
              <div className="panel-head">
                <div>
                  <p className="kicker">합성 현재값</p>
                  <h2>{replayCurrent ? formatNumber(replayCurrent.normalized_value) : "값 없음"}</h2>
                  <p className="unit">{replayCurrent?.unit ?? "-"}</p>
                </div>
                <span className={`status ${replayStatus?.freshness ?? "empty"}`}>
                  {replayStatus?.freshness ?? "대기 중"}
                </span>
              </div>

              <div className="delta-card">
                <span>전일 대비</span>
                <strong>{replay ? deltaText(replay.last_comparison) : "-"}</strong>
              </div>

              {replayStatus?.freshness === "stale" && (
                <div className="error-box">
                  <strong>{errorMessages[replayStatus.error_code] ?? replayStatus.error_code}</strong>
                  <span>마지막 정상값을 지우지 않고 stale로 표시했습니다.</span>
                  <button className="secondary inline" onClick={() => runFixture("T04-RECOVER-D2")} disabled={busy}>
                    다시 시도: Recover D2
                  </button>
                </div>
              )}
            </article>

            <article className="panel">
              <h3>현재 재생 상태</h3>
              <dl className="facts">
                <div><dt>freshness</dt><dd>{replayStatus?.freshness ?? "-"}</dd></div>
                <div><dt>error_code</dt><dd>{replayStatus?.error_code ?? "-"}</dd></div>
                <div><dt>행 개수</dt><dd>{replay?.daily_readings.length ?? 0}</dd></div>
                <div><dt>sequence</dt><dd>{replay?.sequence ?? 0}</dd></div>
                <div><dt>마지막 fixture</dt><dd>{replay?.last_run?.fixture_id ?? "-"}</dd></div>
                <div><dt>virtual_now</dt><dd>{replay?.last_run?.virtual_now ?? "-"}</dd></div>
              </dl>
            </article>
          </div>

          <article className="panel">
            <h3>합성 일별 기록</h3>
            <div className="table-wrap">
              <table>
                <thead><tr><th>record_id</th><th>날짜</th><th>값</th><th>단위</th><th>마지막 조회</th></tr></thead>
                <tbody>
                  {replay?.daily_readings.length ? replay.daily_readings.map((row) => (
                    <tr key={row.record_id}>
                      <td className="mono">{row.record_id}</td>
                      <td>{row.record_date}</td>
                      <td>{formatNumber(row.normalized_value)}</td>
                      <td>{row.unit}</td>
                      <td>{formatKst(row.last_fetched_at)}</td>
                    </tr>
                  )) : <tr><td colSpan={5}>Reset 상태입니다.</td></tr>}
                </tbody>
              </table>
            </div>
          </article>
        </section>
      )}

      <footer className="footer">
        <strong>검증 포인트</strong>
        <span>실제 데이터와 합성 fixture는 분리됩니다.</span>
        <span>실패는 마지막 정상값을 덮어쓰지 않습니다.</span>
        <span>같은 서울 날짜는 UPSERT, 다음 날짜는 새 행입니다.</span>
      </footer>
    </main>
  );
}
