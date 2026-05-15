"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BadgeEuro,
  CalendarDays,
  Gauge,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import {
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  ClubDashboard,
  PlayerProfile,
  TransferRumour,
} from "@/types/football";
import {
  calcAnnualAmortization,
  calcAnnualSquadCost,
  calcReliabilityRank,
  calcReliabilityScore,
  categoryClassName,
  statsToRadarData,
  statusLabel,
} from "@/lib/calc";

function formatMoney(value: number) {
  return `€${value.toFixed(1)}m`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function PlayerImage({ src, name }: { src?: string; name: string }) {
  if (src) {
    return <img className="avatarImage" src={src} alt={name} />;
  }

  return <div className="avatarFallback">{name.slice(0, 1)}</div>;
}

function KpiCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="kpiCard">
      <div className="kpiIcon">{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{sub}</p>
    </div>
  );
}

function TransferCard({ item }: { item: TransferRumour }) {
  const score = calcReliabilityScore(item);
  const rank = calcReliabilityRank(score);

  const amortization = calcAnnualAmortization({
    feeMillion: item.feeMillion,
    contractYears: item.contractYears,
  });

  const annualSquadCost = calcAnnualSquadCost({
    feeMillion: item.feeMillion,
    annualWageMillion: item.annualWageMillion,
    contractYears: item.contractYears,
  });

  return (
    <article className="transferCard">
      <div className="transferTop">
        <PlayerImage src={item.photoUrl} name={item.playerName} />

        <div className="transferInfo">
          <div className="transferTitle">
            <h3>{item.playerName}</h3>
            <span className={`rank rank${rank}`}>Rank {rank}</span>
          </div>

          <p className="route">
            {item.fromClub} → {item.toClub}
          </p>

          <div className="miniTags">
            <span>{item.position}</span>
            <span>{item.age}歳</span>
            <span>{statusLabel(item.status)}</span>
            <span>{formatDate(item.updatedAt)}更新</span>
          </div>
        </div>
      </div>

      <div className="transferMetrics">
        <div>
          <span>移籍金</span>
          <strong>{formatMoney(item.feeMillion)}</strong>
        </div>
        <div>
          <span>年俸</span>
          <strong>{formatMoney(item.annualWageMillion)}</strong>
        </div>
        <div>
          <span>年償却費</span>
          <strong>{formatMoney(amortization)}</strong>
        </div>
        <div>
          <span>年コスト</span>
          <strong>{formatMoney(annualSquadCost)}</strong>
        </div>
      </div>

      <div className="reliabilityBox">
        <div>
          <span>信頼度スコア</span>
          <strong>{score}/100</strong>
        </div>

        <div className="bar">
          <div style={{ width: `${score}%` }} />
        </div>

        <p>
          情報源: {item.sourceName} / source tier {item.sourceTier} / cross source{" "}
          {item.crossSourceCount}
        </p>
      </div>
    </article>
  );
}

function PlayerAnalysis({ player }: { player: PlayerProfile }) {
  const radarData = statsToRadarData(player.stats);

  return (
    <section className="panel full">
      <div className="panelHeader">
        <div>
          <p className="sectionTag">Player Analysis</p>
          <h2>{player.name}</h2>
        </div>

        <span className={categoryClassName(player.developmentCategory)}>
          {player.developmentCategory}
        </span>
      </div>

      <div className="playerSummary">
        <PlayerImage src={player.photoUrl} name={player.name} />
        <div>
          <strong>
            {player.position} / {player.age}歳
          </strong>
          <p>
            市場価値 {formatMoney(player.marketValueMillion)} / 年俸{" "}
            {formatMoney(player.wageMillion)}
          </p>
          <p>契約満了: {player.contractUntil}</p>
        </div>
      </div>

      <div className="chartGrid">
        <div className="chartBox">
          <h3>六角形スタッツ</h3>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
              <Radar
                dataKey="value"
                stroke="#60a5fa"
                fill="#60a5fa"
                fillOpacity={0.35}
              />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="chartBox">
          <h3>市場価値推移</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={player.marketValueTrend}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => [`€${value}m`, "市場価値"]} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#34d399"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="reasonBox">
        <strong>育成枠判定理由</strong>
        <p>{player.developmentReason}</p>
      </div>
    </section>
  );
}

export default function DashboardClient() {
  const [data, setData] = useState<ClubDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [rankFilter, setRankFilter] = useState<
    "all" | "S" | "A" | "B" | "C" | "D"
  >("all");

  async function fetchDashboard() {
    setLoading(true);

    try {
      const res = await fetch("/api/dashboard", { cache: "no-store" });
      const json = await res.json();
      setData(json);
      setSelectedPlayerId(json.players?.[0]?.id ?? null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDashboard();

    const timer = window.setInterval(() => {
      fetchDashboard();
    }, 5 * 60 * 1000);

    return () => window.clearInterval(timer);
  }, []);

  const sortedRumours = useMemo(() => {
    if (!data) return [];

    return [...data.transferRumours]
      .map((item) => {
        const score = calcReliabilityScore(item);
        const rank = calcReliabilityRank(score);
        return { ...item, score, rank };
      })
      .filter((item) => rankFilter === "all" || item.rank === rankFilter)
      .sort((a, b) => b.score - a.score);
  }, [data, rankFilter]);

  const selectedPlayer = useMemo(() => {
    if (!data) return null;
    return data.players.find((p) => p.id === selectedPlayerId) ?? data.players[0];
  }, [data, selectedPlayerId]);

  const totalMarketValue = useMemo(() => {
    if (!data) return 0;
    return data.players.reduce((sum, p) => sum + p.marketValueMillion, 0);
  }, [data]);

  if (!data) {
    return (
      <main className="loadingPage">
        <div className="loadingCard">
          <RefreshCw className="spin" />
          <p>{loading ? "データ取得中..." : "データを取得できませんでした"}</p>
          <button onClick={fetchDashboard}>再読み込み</button>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <section className="hero">
        <div className="clubIdentity">
          {data.logoUrl ? (
            <img className="clubLogo" src={data.logoUrl} alt={data.clubName} />
          ) : (
            <div className="clubLogoFallback">{data.clubName.slice(0, 1)}</div>
          )}

          <div>
            <p className="eyebrow">Football Intelligence Dashboard</p>
            <h1>{data.clubName}</h1>
            <p>
              移籍噂、信頼度、償却費、給与コスト、スタッツ、市場価値推移、育成枠を一画面で確認。
            </p>
          </div>
        </div>

        <div className="heroAction">
          <span>Last updated</span>
          <strong>{formatDate(data.lastUpdated)}</strong>
          <button onClick={fetchDashboard}>
            <RefreshCw size={16} />
            更新
          </button>
        </div>
      </section>

      <section className="kpiGrid">
        <KpiCard
          icon={<ShieldCheck size={20} />}
          label="League"
          value={data.league}
          sub="Club profile"
        />
        <KpiCard
          icon={<TrendingUp size={20} />}
          label="Market value"
          value={formatMoney(totalMarketValue)}
          sub="登録選手サンプル合計"
        />
        <KpiCard
          icon={<BadgeEuro size={20} />}
          label="Wage cost"
          value={formatMoney(data.wageCost.annualWageCostMillion)}
          sub={`source: ${data.wageCost.sourceName}`}
        />
        <KpiCard
          icon={<CalendarDays size={20} />}
          label="Fixtures"
          value={`${data.fixtures.length}`}
          sub="Upcoming matches"
        />
      </section>

      <section className="mainGrid">
        <section className="panel large">
          <div className="panelHeader">
            <div>
              <p className="sectionTag">Transfer Intelligence</p>
              <h2>移籍噂・信頼度Rank・償却費</h2>
            </div>

            <div className="filterGroup">
              {["all", "S", "A", "B", "C", "D"].map((rank) => (
                <button
                  key={rank}
                  className={rankFilter === rank ? "active" : ""}
                  onClick={() => setRankFilter(rank as typeof rankFilter)}
                >
                  {rank === "all" ? "全て" : `Rank ${rank}`}
                </button>
              ))}
            </div>
          </div>

          <div className="transferList">
            {sortedRumours.map((item) => (
              <TransferCard key={item.id} item={item} />
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panelHeader">
            <div>
              <p className="sectionTag">Squad</p>
              <h2>選手選択</h2>
            </div>
          </div>

          <div className="playerPicker">
            {data.players.map((player) => (
              <button
                key={player.id}
                className={selectedPlayerId === player.id ? "active" : ""}
                onClick={() => setSelectedPlayerId(player.id)}
              >
                <PlayerImage src={player.photoUrl} name={player.name} />
                <div>
                  <strong>{player.name}</strong>
                  <span>
                    {player.position} / {formatMoney(player.marketValueMillion)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panelHeader">
            <div>
              <p className="sectionTag">Schedule</p>
              <h2>試合日程</h2>
            </div>
          </div>

          <div className="fixtureList">
            {data.fixtures.map((fixture) => (
              <div className="fixtureCard" key={fixture.id}>
                <span>{fixture.competition}</span>
                <strong>
                  {fixture.home} vs {fixture.away}
                </strong>
                <p>{fixture.date}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="panel financePanel">
          <div className="panelHeader">
            <div>
              <p className="sectionTag">Finance</p>
              <h2>給与コスト</h2>
            </div>
            <Gauge size={22} />
          </div>

          <div className="bigNumber">
            {formatMoney(data.wageCost.annualWageCostMillion)}
          </div>

          <p>
            Wage / Revenue:{" "}
            {data.wageCost.wageToRevenueRatio
              ? `${Math.round(data.wageCost.wageToRevenueRatio * 100)}%`
              : "不明"}
          </p>
          <p className="muted">updated: {formatDate(data.wageCost.updatedAt)}</p>
        </section>
      </section>

      {selectedPlayer && <PlayerAnalysis player={selectedPlayer} />}

      <section className="panel full">
        <div className="panelHeader">
          <div>
            <p className="sectionTag">Useful Functions</p>
            <h2>今後さらに足せる機能</h2>
          </div>
          <Activity size={22} />
        </div>

        <div className="featureGrid">
          <div>外国籍枠シミュレーター</div>
          <div>HG枠不足アラート</div>
          <div>契約満了選手ランキング</div>
          <div>市場価値 / 年俸の割安度</div>
          <div>売却益・残存簿価計算</div>
          <div>補強予算シミュレーター</div>
        </div>
      </section>
    </main>
  );
}
