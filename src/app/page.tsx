"use client";

import { useState, useMemo } from "react";
import {
  Zap, Fuel, TrendingUp, TrendingDown, AlertTriangle,
  Plus, Trash2, BarChart2, Clock, DollarSign, Settings,
  CheckCircle2, XCircle, Battery, BatteryLow, BatteryMedium, BatteryFull, X
} from "lucide-react";

type PowerSource = "nepa" | "generator" | "solar" | "none";
type FuelType = "petrol" | "diesel" | "gas";

interface PowerLog {
  id: string;
  date: string;
  source: PowerSource;
  hours: number;
  note?: string;
}

interface FuelLog {
  id: string;
  date: string;
  fuelType: FuelType;
  litres: number;
  pricePerLitre: number;
  totalCost: number;
}

interface Settings {
  genCapacity: number; // kVA
  fuelConsumptionPerHour: number; // litres/hr
  currentFuelPrice: number; // ₦ per litre
  nepaMonthlyBill: number; // ₦
  location: string;
}

const SEED_POWER_LOGS: PowerLog[] = [
  { id: "p1", date: "2026-03-22", source: "nepa", hours: 3, note: "Morning supply" },
  { id: "p2", date: "2026-03-22", source: "generator", hours: 8, note: "Rest of day on gen" },
  { id: "p3", date: "2026-03-21", source: "nepa", hours: 2 },
  { id: "p4", date: "2026-03-21", source: "generator", hours: 10 },
  { id: "p5", date: "2026-03-20", source: "nepa", hours: 5 },
  { id: "p6", date: "2026-03-20", source: "generator", hours: 6 },
  { id: "p7", date: "2026-03-19", source: "nepa", hours: 1 },
  { id: "p8", date: "2026-03-19", source: "generator", hours: 11 },
  { id: "p9", date: "2026-03-18", source: "nepa", hours: 4 },
  { id: "p10", date: "2026-03-18", source: "generator", hours: 7 },
];

const SEED_FUEL_LOGS: FuelLog[] = [
  { id: "f1", date: "2026-03-22", fuelType: "petrol", litres: 10, pricePerLitre: 1350, totalCost: 13500 },
  { id: "f2", date: "2026-03-20", fuelType: "petrol", litres: 15, pricePerLitre: 1320, totalCost: 19800 },
  { id: "f3", date: "2026-03-18", fuelType: "petrol", litres: 12, pricePerLitre: 1300, totalCost: 15600 },
  { id: "f4", date: "2026-03-15", fuelType: "petrol", litres: 20, pricePerLitre: 1280, totalCost: 25600 },
];

const DEFAULT_SETTINGS: Settings = {
  genCapacity: 3.5,
  fuelConsumptionPerHour: 1.2,
  currentFuelPrice: 1350,
  nepaMonthlyBill: 8500,
  location: "Benin City",
};

function fmtNaira(n: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(n);
}

function genId() { return Math.random().toString(36).slice(2, 9); }

const SOURCE_CONFIG: Record<PowerSource, { label: string; color: string; bg: string; border: string }> = {
  nepa:      { label: "NEPA/PHCN", color: "#00e5a0", bg: "rgba(0,229,160,0.1)",  border: "rgba(0,229,160,0.3)"  },
  generator: { label: "Generator", color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.3)" },
  solar:     { label: "Solar",     color: "#60a5fa", bg: "rgba(96,165,250,0.1)", border: "rgba(96,165,250,0.3)" },
  none:      { label: "No Power",  color: "#ef4444", bg: "rgba(239,68,68,0.1)",  border: "rgba(239,68,68,0.3)"  },
};

type Tab = "dashboard" | "power-log" | "fuel-log" | "settings";

export default function NaijaWatts() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [powerLogs, setPowerLogs] = useState<PowerLog[]>(SEED_POWER_LOGS);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>(SEED_FUEL_LOGS);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [showPowerModal, setShowPowerModal] = useState(false);
  const [showFuelModal, setShowFuelModal] = useState(false);

  const [powerForm, setPowerForm] = useState({ source: "nepa" as PowerSource, hours: "", date: new Date().toISOString().slice(0,10), note: "" });
  const [fuelForm, setFuelForm] = useState({ fuelType: "petrol" as FuelType, litres: "", pricePerLitre: String(DEFAULT_SETTINGS.currentFuelPrice), date: new Date().toISOString().slice(0,10) });

  // Computed stats
  const stats = useMemo(() => {
    const nepaHours = powerLogs.filter(l => l.source === "nepa").reduce((a, l) => a + l.hours, 0);
    const genHours  = powerLogs.filter(l => l.source === "generator").reduce((a, l) => a + l.hours, 0);
    const totalFuelCost = fuelLogs.reduce((a, f) => a + f.totalCost, 0);
    const totalLitres   = fuelLogs.reduce((a, f) => a + f.litres, 0);
    const estGenCost = genHours * settings.fuelConsumptionPerHour * settings.currentFuelPrice;
    const totalDays = Array.from(new Set(powerLogs.map(l => l.date))).length;
    const avgNepaPerDay = totalDays > 0 ? nepaHours / totalDays : 0;
    return { nepaHours, genHours, totalFuelCost, totalLitres, estGenCost, avgNepaPerDay, totalDays };
  }, [powerLogs, fuelLogs, settings]);

  // Group logs by date for display
  const logsByDate = useMemo(() => {
    const groups: Record<string, PowerLog[]> = {};
    [...powerLogs].sort((a, b) => b.date.localeCompare(a.date)).forEach(l => {
      if (!groups[l.date]) groups[l.date] = [];
      groups[l.date].push(l);
    });
    return groups;
  }, [powerLogs]);

  // Weekly bar data (last 7 unique days)
  const weekDays = useMemo(() => {
    const days = Array.from(new Set(powerLogs.map(l => l.date))).sort().slice(-7);
    return days.map(date => {
      const dayLogs = powerLogs.filter(l => l.date === date);
      return {
        date: date.slice(5),
        nepa: dayLogs.filter(l => l.source === "nepa").reduce((a,l) => a+l.hours, 0),
        gen:  dayLogs.filter(l => l.source === "generator").reduce((a,l) => a+l.hours, 0),
      };
    });
  }, [powerLogs]);

  const addPowerLog = () => {
    if (!powerForm.hours || !powerForm.date) return;
    setPowerLogs(prev => [{
      id: genId(), date: powerForm.date, source: powerForm.source,
      hours: parseFloat(powerForm.hours), note: powerForm.note || undefined
    }, ...prev]);
    setPowerForm({ source: "nepa", hours: "", date: new Date().toISOString().slice(0,10), note: "" });
    setShowPowerModal(false);
  };

  const addFuelLog = () => {
    if (!fuelForm.litres || !fuelForm.pricePerLitre) return;
    const litres = parseFloat(fuelForm.litres);
    const price  = parseFloat(fuelForm.pricePerLitre);
    setFuelLogs(prev => [{
      id: genId(), date: fuelForm.date, fuelType: fuelForm.fuelType,
      litres, pricePerLitre: price, totalCost: litres * price
    }, ...prev]);
    setFuelForm({ fuelType: "petrol", litres: "", pricePerLitre: String(settings.currentFuelPrice), date: new Date().toISOString().slice(0,10) });
    setShowFuelModal(false);
  };

  const nepaPercent = stats.nepaHours + stats.genHours > 0
    ? Math.round((stats.nepaHours / (stats.nepaHours + stats.genHours)) * 100)
    : 0;

  const BatteryIcon = nepaPercent > 66 ? BatteryFull : nepaPercent > 33 ? BatteryMedium : nepaPercent > 10 ? BatteryLow : Battery;

  const TABS: { key: Tab; label: string }[] = [
    { key: "dashboard", label: "Dashboard" },
    { key: "power-log", label: "Power Log" },
    { key: "fuel-log", label: "Fuel" },
    { key: "settings", label: "Settings" },
  ];

  return (
    <div className="min-h-screen bg-mesh relative z-10">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[#1d2535] bg-[#080c12]/80 backdrop-blur-xl px-5 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9">
              <div className="absolute inset-0 rounded-xl bg-[#00e5a0]/20 animate-pulse" />
              <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-[#00e5a0] to-[#00b4d8] flex items-center justify-center">
                <Zap size={18} className="text-[#080c12]" fill="currentColor" />
              </div>
            </div>
            <div>
              <h1 className="font-display font-bold text-lg leading-none text-[#f0f4ff]">NaijaWatts</h1>
              <p className="text-xs text-[#5b6a8a] mt-0.5">{settings.location} · Power Tracker</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowFuelModal(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#f59e0b]/30 text-[#f59e0b] text-xs font-semibold hover:bg-[#f59e0b]/10 transition-all">
              <Fuel size={13} /> Buy Fuel
            </button>
            <button onClick={() => setShowPowerModal(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#00e5a0] text-[#080c12] text-xs font-bold hover:bg-[#00ffb3] transition-all">
              <Plus size={13} /> Log Power
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="sticky top-[73px] z-30 border-b border-[#1d2535] bg-[#080c12]/80 backdrop-blur-xl px-5">
        <div className="max-w-4xl mx-auto flex gap-1">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-3 text-sm font-medium transition-all border-b-2 ${
                tab === t.key ? "border-[#00e5a0] text-[#00e5a0]" : "border-transparent text-[#5b6a8a] hover:text-[#8896b0]"
              }`}
            >{t.label}</button>
          ))}
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-5 py-8 space-y-6">

        {/* ── DASHBOARD TAB ── */}
        {tab === "dashboard" && (
          <>
            {/* Hero status card */}
            <div className="card accent-glow p-6 animate-slide-up relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-[#00e5a0]/5 -translate-y-1/2 translate-x-1/2" />
              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <p className="text-[#5b6a8a] text-sm font-medium mb-1">Today's NEPA Score</p>
                  <div className="flex items-end gap-3">
                    <span className="font-display text-6xl font-bold gradient-text">{nepaPercent}%</span>
                    <div className="mb-2 flex flex-col gap-1">
                      {nepaPercent >= 50
                        ? <span className="flex items-center gap-1 text-xs text-[#00e5a0]"><CheckCircle2 size={12}/> Light dey</span>
                        : <span className="flex items-center gap-1 text-xs text-[#ef4444]"><XCircle size={12}/> Gen dey run</span>
                      }
                      <span className="text-xs text-[#5b6a8a]">Avg: {stats.avgNepaPerDay.toFixed(1)}h/day</span>
                    </div>
                  </div>
                  <p className="text-[#5b6a8a] text-xs mt-1">NEPA {stats.nepaHours}h · Gen {stats.genHours}h (logged)</p>
                </div>
                <BatteryIcon size={52} className={nepaPercent > 50 ? "text-[#00e5a0]" : nepaPercent > 25 ? "text-[#f59e0b]" : "text-[#ef4444]"} />
              </div>

              {/* Progress bar */}
              <div className="mt-5 h-3 rounded-full bg-[#1d2535] overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-[#00e5a0] to-[#00b4d8] transition-all duration-700"
                  style={{ width: `${nepaPercent}%` }} />
              </div>
              <div className="flex justify-between text-xs text-[#5b6a8a] mt-1.5">
                <span>0h NEPA</span><span>24h</span>
              </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Total Fuel Spent", value: fmtNaira(stats.totalFuelCost), sub: `${stats.totalLitres}L purchased`, color: "#f59e0b", icon: <Fuel size={16}/> },
                { label: "Est. Gen Cost", value: fmtNaira(stats.estGenCost), sub: `${stats.genHours}h runtime`, color: "#ef4444", icon: <TrendingUp size={16}/> },
                { label: "NEPA Bill", value: fmtNaira(settings.nepaMonthlyBill), sub: "This month", color: "#00e5a0", icon: <DollarSign size={16}/> },
                { label: "Total Power Cost", value: fmtNaira(stats.totalFuelCost + settings.nepaMonthlyBill), sub: "Fuel + NEPA bill", color: "#a78bfa", icon: <BarChart2 size={16}/> },
              ].map((s, i) => (
                <div key={s.label} className={`card p-4 animate-slide-up delay-${(i+1)*100}`}>
                  <div className="flex items-center gap-2 mb-3" style={{ color: s.color }}>
                    {s.icon}<span className="text-xs font-semibold text-[#5b6a8a]">{s.label}</span>
                  </div>
                  <p className="font-display font-bold text-xl text-[#f0f4ff] leading-none">{s.value}</p>
                  <p className="text-xs text-[#5b6a8a] mt-1">{s.sub}</p>
                </div>
              ))}
            </div>

            {/* Weekly bar chart */}
            <div className="card p-6 animate-slide-up delay-200">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-display font-bold text-[#f0f4ff]">Weekly Power Split</h3>
                  <p className="text-xs text-[#5b6a8a] mt-0.5">NEPA vs Generator hours per day</p>
                </div>
                <BarChart2 size={18} className="text-[#5b6a8a]" />
              </div>
              <div className="flex items-end gap-2 h-36">
                {weekDays.map(day => {
                  const total = day.nepa + day.gen || 1;
                  const nepaH = (day.nepa / 24) * 100;
                  const genH  = (day.gen / 24) * 100;
                  return (
                    <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full flex flex-col justify-end h-28 gap-0.5">
                        <div className="w-full rounded-t-sm" style={{ height: `${genH}%`, background: "rgba(245,158,11,0.7)" }} title={`Gen: ${day.gen}h`} />
                        <div className="w-full rounded-b-sm" style={{ height: `${nepaH}%`, background: "#00e5a0" }} title={`NEPA: ${day.nepa}h`} />
                      </div>
                      <span className="text-xs text-[#5b6a8a]">{day.date}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-5 mt-3 text-xs">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#00e5a0] inline-block"/> NEPA</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#f59e0b]/70 inline-block"/> Generator</span>
              </div>
            </div>

            {/* Insight cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="card p-4 border-l-2 border-l-[#f59e0b]">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={15} className="text-[#f59e0b]" />
                  <span className="text-xs font-semibold text-[#f59e0b]">Cost Alert</span>
                </div>
                <p className="text-sm text-[#8896b0]">
                  You spend approx. <span className="text-[#f0f4ff] font-semibold">{fmtNaira(stats.genHours * settings.fuelConsumptionPerHour * settings.currentFuelPrice / Math.max(stats.totalDays,1))}</span> daily on generator fuel.
                  That's <span className="text-[#ef4444] font-semibold">{fmtNaira((stats.genHours * settings.fuelConsumptionPerHour * settings.currentFuelPrice / Math.max(stats.totalDays,1)) * 30)}/month</span>.
                </p>
              </div>
              <div className="card p-4 border-l-2 border-l-[#00e5a0]">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 size={15} className="text-[#00e5a0]" />
                  <span className="text-xs font-semibold text-[#00e5a0]">Power Tip</span>
                </div>
                <p className="text-sm text-[#8896b0]">
                  Solar + inverter payback period at your usage: ~<span className="text-[#f0f4ff] font-semibold">18 months</span>. You'd save <span className="text-[#00e5a0] font-semibold">{fmtNaira(stats.estGenCost * 30 / Math.max(stats.totalDays,1))}</span>/month after.
                </p>
              </div>
            </div>
          </>
        )}

        {/* ── POWER LOG TAB ── */}
        {tab === "power-log" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-xl text-[#f0f4ff]">Power History</h2>
              <button onClick={() => setShowPowerModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00e5a0] text-[#080c12] text-sm font-bold hover:bg-[#00ffb3] transition-all">
                <Plus size={15}/> Log Entry
              </button>
            </div>
            {Object.entries(logsByDate).map(([date, logs]) => (
              <div key={date} className="card p-4 space-y-3">
                <p className="text-xs font-semibold text-[#5b6a8a] uppercase tracking-wider">{date}</p>
                {logs.map(log => {
                  const cfg = SOURCE_CONFIG[log.source];
                  return (
                    <div key={log.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold" style={{ color: cfg.color }}>{cfg.label}</span>
                          {log.note && <span className="text-xs text-[#5b6a8a]">· {log.note}</span>}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5 text-xs text-[#5b6a8a]">
                          <Clock size={11}/> {log.hours}h
                        </div>
                      </div>
                      <button onClick={() => setPowerLogs(p => p.filter(l => l.id !== log.id))}
                        className="text-[#5b6a8a] hover:text-[#ef4444] transition-colors">
                        <Trash2 size={14}/>
                      </button>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {/* ── FUEL LOG TAB ── */}
        {tab === "fuel-log" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-xl text-[#f0f4ff]">Fuel Purchases</h2>
              <button onClick={() => setShowFuelModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#f59e0b]/40 text-[#f59e0b] text-sm font-bold hover:bg-[#f59e0b]/10 transition-all">
                <Plus size={15}/> Log Purchase
              </button>
            </div>
            <div className="card p-5">
              <div className="grid grid-cols-3 gap-4 text-center mb-5 pb-5 border-b border-[#1d2535]">
                <div>
                  <p className="font-mono font-bold text-2xl text-[#f59e0b]">{stats.totalLitres}L</p>
                  <p className="text-xs text-[#5b6a8a] mt-1">Total Litres</p>
                </div>
                <div>
                  <p className="font-mono font-bold text-2xl text-[#f0f4ff]">{fmtNaira(stats.totalFuelCost)}</p>
                  <p className="text-xs text-[#5b6a8a] mt-1">Total Spent</p>
                </div>
                <div>
                  <p className="font-mono font-bold text-2xl text-[#00e5a0]">{fmtNaira(fuelLogs.length > 0 ? stats.totalFuelCost / stats.totalLitres : 0)}</p>
                  <p className="text-xs text-[#5b6a8a] mt-1">Avg ₦/Litre</p>
                </div>
              </div>
              <div className="space-y-3">
                {fuelLogs.map(f => (
                  <div key={f.id} className="group flex items-center gap-4 p-3 rounded-xl hover:bg-[#1d2535]/50 transition-colors">
                    <div className="w-9 h-9 rounded-xl bg-[#f59e0b]/10 flex items-center justify-center flex-shrink-0">
                      <Fuel size={16} className="text-[#f59e0b]"/>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold capitalize text-[#f0f4ff]">{f.fuelType}</span>
                        <span className="text-xs text-[#5b6a8a]">· {f.litres}L @ {fmtNaira(f.pricePerLitre)}/L</span>
                      </div>
                      <p className="text-xs text-[#5b6a8a]">{f.date}</p>
                    </div>
                    <p className="font-mono font-semibold text-[#f59e0b]">{fmtNaira(f.totalCost)}</p>
                    <button onClick={() => setFuelLogs(p => p.filter(l => l.id !== f.id))}
                      className="opacity-0 group-hover:opacity-100 text-[#5b6a8a] hover:text-[#ef4444] transition-all">
                      <Trash2 size={14}/>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── SETTINGS TAB ── */}
        {tab === "settings" && (
          <div className="space-y-4">
            <h2 className="font-display font-bold text-xl text-[#f0f4ff]">Settings</h2>
            <div className="card p-6 space-y-5">
              {[
                { label: "Location / Area", key: "location", type: "text", unit: "" },
                { label: "Generator Capacity (kVA)", key: "genCapacity", type: "number", unit: "kVA" },
                { label: "Fuel Consumption per Hour", key: "fuelConsumptionPerHour", type: "number", unit: "L/hr" },
                { label: "Current Fuel Price (₦/Litre)", key: "currentFuelPrice", type: "number", unit: "₦" },
                { label: "NEPA Monthly Bill", key: "nepaMonthlyBill", type: "number", unit: "₦" },
              ].map(field => (
                <div key={field.key}>
                  <label className="text-xs font-semibold text-[#5b6a8a] uppercase tracking-wide block mb-2">{field.label}</label>
                  <div className="flex items-center gap-2">
                    <input
                      type={field.type}
                      value={(settings as unknown as Record<string, string>)[field.key]}
                      onChange={e => setSettings(s => ({ ...s, [field.key]: field.type === "number" ? parseFloat(e.target.value)||0 : e.target.value }))}
                      className="flex-1 bg-[#1d2535] border border-[#1d2535] rounded-xl px-4 py-3 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#00e5a0]/50 transition-colors font-mono"
                    />
                    {field.unit && <span className="text-xs text-[#5b6a8a] w-12">{field.unit}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* ── POWER LOG MODAL ── */}
      {showPowerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="card w-full max-w-sm p-6 border-[#1d2535]">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display font-bold text-lg text-[#f0f4ff]">Log Power Entry</h3>
              <button onClick={() => setShowPowerModal(false)} className="text-[#5b6a8a] hover:text-[#f0f4ff]"><X size={20}/></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-[#5b6a8a] uppercase tracking-wide mb-2 block">Source</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["nepa","generator","solar","none"] as PowerSource[]).map(s => {
                    const c = SOURCE_CONFIG[s];
                    return (
                      <button key={s} onClick={() => setPowerForm(f => ({...f, source: s}))}
                        className="p-2.5 rounded-xl border text-xs font-semibold transition-all capitalize"
                        style={powerForm.source === s ? { background: c.bg, borderColor: c.border, color: c.color } : { borderColor: "#1d2535", color: "#5b6a8a" }}>
                        {c.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#5b6a8a] uppercase tracking-wide mb-2 block">Hours</label>
                <input type="number" step="0.5" value={powerForm.hours} onChange={e => setPowerForm(f => ({...f, hours: e.target.value}))}
                  placeholder="e.g. 3.5" className="w-full bg-[#1d2535] border border-[#1d2535] rounded-xl px-4 py-3 text-[#f0f4ff] focus:outline-none focus:border-[#00e5a0]/50 transition-colors font-mono text-sm" />
              </div>
              <div>
                <label className="text-xs text-[#5b6a8a] uppercase tracking-wide mb-2 block">Date</label>
                <input type="date" value={powerForm.date} onChange={e => setPowerForm(f => ({...f, date: e.target.value}))}
                  className="w-full bg-[#1d2535] border border-[#1d2535] rounded-xl px-4 py-3 text-[#f0f4ff] focus:outline-none focus:border-[#00e5a0]/50 transition-colors text-sm" />
              </div>
              <div>
                <label className="text-xs text-[#5b6a8a] uppercase tracking-wide mb-2 block">Note (optional)</label>
                <input type="text" value={powerForm.note} onChange={e => setPowerForm(f => ({...f, note: e.target.value}))}
                  placeholder="e.g. Morning supply" className="w-full bg-[#1d2535] border border-[#1d2535] rounded-xl px-4 py-3 text-[#f0f4ff] focus:outline-none focus:border-[#00e5a0]/50 transition-colors text-sm" />
              </div>
              <button onClick={addPowerLog} className="w-full py-3 rounded-xl bg-[#00e5a0] text-[#080c12] font-bold hover:bg-[#00ffb3] transition-all">
                Save Entry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── FUEL LOG MODAL ── */}
      {showFuelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="card w-full max-w-sm p-6 border-[#1d2535]">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display font-bold text-lg text-[#f0f4ff]">Log Fuel Purchase</h3>
              <button onClick={() => setShowFuelModal(false)} className="text-[#5b6a8a] hover:text-[#f0f4ff]"><X size={20}/></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-[#5b6a8a] uppercase tracking-wide mb-2 block">Fuel Type</label>
                <div className="flex gap-2">
                  {(["petrol","diesel","gas"] as FuelType[]).map(t => (
                    <button key={t} onClick={() => setFuelForm(f => ({...f, fuelType: t}))}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border capitalize transition-all ${fuelForm.fuelType === t ? "bg-[#f59e0b]/10 border-[#f59e0b]/40 text-[#f59e0b]" : "border-[#1d2535] text-[#5b6a8a]"}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#5b6a8a] uppercase tracking-wide mb-2 block">Litres</label>
                <input type="number" value={fuelForm.litres} onChange={e => setFuelForm(f => ({...f, litres: e.target.value}))}
                  placeholder="e.g. 10" className="w-full bg-[#1d2535] border border-[#1d2535] rounded-xl px-4 py-3 text-[#f0f4ff] focus:outline-none focus:border-[#f59e0b]/50 transition-colors font-mono text-sm" />
              </div>
              <div>
                <label className="text-xs text-[#5b6a8a] uppercase tracking-wide mb-2 block">Price per Litre (₦)</label>
                <input type="number" value={fuelForm.pricePerLitre} onChange={e => setFuelForm(f => ({...f, pricePerLitre: e.target.value}))}
                  className="w-full bg-[#1d2535] border border-[#1d2535] rounded-xl px-4 py-3 text-[#f0f4ff] focus:outline-none focus:border-[#f59e0b]/50 transition-colors font-mono text-sm" />
              </div>
              {fuelForm.litres && fuelForm.pricePerLitre && (
                <div className="p-3 rounded-xl bg-[#f59e0b]/10 border border-[#f59e0b]/20 text-center">
                  <span className="text-xs text-[#5b6a8a]">Total Cost: </span>
                  <span className="font-mono font-bold text-[#f59e0b]">{fmtNaira(parseFloat(fuelForm.litres||"0") * parseFloat(fuelForm.pricePerLitre||"0"))}</span>
                </div>
              )}
              <div>
                <label className="text-xs text-[#5b6a8a] uppercase tracking-wide mb-2 block">Date</label>
                <input type="date" value={fuelForm.date} onChange={e => setFuelForm(f => ({...f, date: e.target.value}))}
                  className="w-full bg-[#1d2535] border border-[#1d2535] rounded-xl px-4 py-3 text-[#f0f4ff] focus:outline-none focus:border-[#f59e0b]/50 transition-colors text-sm" />
              </div>
              <button onClick={addFuelLog} className="w-full py-3 rounded-xl bg-[#f59e0b] text-[#080c12] font-bold hover:opacity-90 transition-all">
                Save Purchase
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
