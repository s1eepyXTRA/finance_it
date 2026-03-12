import React, { useEffect, useState, useCallback } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area, Legend, ReferenceLine,
  ComposedChart, Line,
} from 'recharts';

const CAT_COLORS: Record<string, string> = {
  'Продукты': '#D4A574',
  'Сладкое': '#E8917A',
  'Заказы на дом': '#7AAFCF',
  'Такси': '#F2C05A',
  'Интернет/Связь': '#9B8EC4',
  'Хозяйственное': '#6BBFA0',
  'Аптека': '#E07BA5',
  'Отдых/Развлечения': '#70C4B8',
};
const FALLBACK_COLORS = ['#B0937A', '#A3C4DC', '#D4B896', '#8FB8A0', '#C9A0B8', '#A0C4C0', '#D4C096', '#96A0D4'];

function getCatColor(cat: string, idx: number): string {
  return CAT_COLORS[cat] || FALLBACK_COLORS[idx % FALLBACK_COLORS.length];
}

const fmt = (n: number) => n.toLocaleString('ru-RU', { maximumFractionDigits: 0 });
const fmtDate = (d: string) => { const [, m, day] = d.split('-'); return `${day}.${m}`; };
const fmtMonth = (m: string) => {
  const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
  const [, month] = m.split('-');
  return months[parseInt(month) - 1] || m;
};

/* ---- Period helpers ---- */
type Period = '30d' | '6m' | 'all';

function getSinceDate(period: Period): string | undefined {
  if (period === 'all') return undefined;
  const d = new Date();
  if (period === '30d') d.setDate(d.getDate() - 30);
  else d.setMonth(d.getMonth() - 6);
  return d.toISOString().split('T')[0];
}

/* ---- Smooth Tooltip ---- */
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/95 backdrop-blur-md border border-border rounded-xl px-4 py-3 shadow-lg
                    pointer-events-none animate-[tooltipIn_0.15s_ease-out]">
      {label && <p className="text-[11px] text-text-secondary mb-1.5 font-medium">{label}</p>}
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2 py-0.5">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color || entry.fill }} />
          <span className="text-[11px] text-text-secondary">{entry.name}:</span>
          <span className="text-xs font-semibold text-text-primary">{fmt(entry.value)} ₽</span>
        </div>
      ))}
    </div>
  );
}

function PieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-white/95 backdrop-blur-md border border-border rounded-xl px-4 py-3 shadow-lg
                    pointer-events-none animate-[tooltipIn_0.15s_ease-out]">
      <div className="flex items-center gap-2 mb-0.5">
        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.payload.fill }} />
        <span className="text-xs font-semibold text-text-primary">{d.name}</span>
      </div>
      <p className="text-[11px] text-text-secondary pl-[18px]">
        {fmt(d.value)} ₽ · {(d.payload.percent * 100).toFixed(1)}%
      </p>
    </div>
  );
}

/* ---- Card components ---- */
function ChartCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white border border-border rounded-2xl p-5
                     transition-all duration-300 ease-out
                     hover:scale-[1.02] hover:shadow-md ${className}`}>
      {children}
    </div>
  );
}

function CardTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-medium text-text-secondary mb-4">{children}</h3>;
}

/* ---- Toggle components ---- */
function ToggleGroup({ value, onChange, options }: {
  value: string; onChange: (v: string) => void; options: { value: string; label: string }[];
}) {
  return (
    <div className="inline-flex bg-bg-secondary rounded-lg p-0.5 text-xs">
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 rounded-md transition-all duration-200 ${
            value === opt.value
              ? 'bg-white text-text-primary shadow-sm font-medium'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/* ---- Main ---- */
export default function StatisticsTab() {
  const [summary, setSummary] = useState<{ totalExpenses: number; totalIncome: number; balance: number } | null>(null);
  const [byCategory, setByCategory] = useState<any[]>([]);
  const [expByDate, setExpByDate] = useState<any[]>([]);
  const [incByDate, setIncByDate] = useState<any[]>([]);
  const [monthly, setMonthly] = useState<any[]>([]);
  const [dailyByCat, setDailyByCat] = useState<any[]>([]);
  const [monthlyByCat, setMonthlyByCat] = useState<any[]>([]);
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('6m');
  const [dailyMode, setDailyMode] = useState<'total' | 'category'>('total');
  const [monthlyMode, setMonthlyMode] = useState<'balance' | 'category'>('balance');
  const [freeMonthly, setFreeMonthly] = useState<number>(0);

  const loadData = useCallback(async (p?: Period) => {
    const since = getSinceDate(p ?? period);
    try {
      const [s, cat, exp, inc, mon, dbc, mbc, activeConst] = await Promise.all([
        window.api.getSummary(since),
        window.api.getExpensesByCategory(since),
        window.api.getExpensesByDate(since),
        window.api.getIncomeByDate(since),
        window.api.getMonthlyBalance(since),
        window.api.getDailyExpensesByCategory(since),
        window.api.getMonthlyExpensesByCategory(since),
        window.api.getActiveConstants(),
      ]);
      setSummary(s);
      setFreeMonthly(activeConst.income - activeConst.expense);

      const catTotal = cat.reduce((s: number, c: any) => s + c.total, 0);
      setByCategory(cat.map((c: any) => ({ ...c, percent: catTotal > 0 ? c.total / catTotal : 0 })));

      const freeMoney = activeConst.income - activeConst.expense;
      setExpByDate(exp.map((d: any) => {
        const [y, m] = d.date.split('-').map(Number);
        const daysInMonth = new Date(y, m, 0).getDate();
        return { ...d, label: fmtDate(d.date), dailyBudget: freeMoney > 0 ? Math.round(freeMoney / daysInMonth) : 0 };
      }));
      setIncByDate(inc.map((d: any) => ({ ...d, label: fmtDate(d.date) })));
      setMonthly(mon.map((d: any) => ({ ...d, label: fmtMonth(d.month) })));

      // Collect all unique category names
      const catNames = new Set<string>();
      for (const row of [...dbc, ...mbc]) catNames.add(row.category);
      const catList = Array.from(catNames);
      setAllCategories(catList);

      // Pivot daily
      const dailyMap = new Map<string, any>();
      for (const row of dbc) {
        const key = row.date;
        if (!dailyMap.has(key)) {
          const [y, m] = key.split('-').map(Number);
          const daysInMonth = new Date(y, m, 0).getDate();
          dailyMap.set(key, {
            date: key, label: fmtDate(key),
            dailyBudget: freeMoney > 0 ? Math.round(freeMoney / daysInMonth) : 0,
          });
        }
        dailyMap.get(key)[row.category] = row.total;
      }
      setDailyByCat(Array.from(dailyMap.values()));

      // Pivot monthly
      const monthMap = new Map<string, any>();
      for (const row of mbc) {
        const key = row.month;
        if (!monthMap.has(key)) monthMap.set(key, { month: key, label: fmtMonth(key) });
        monthMap.get(key)[row.category] = row.total;
      }
      setMonthlyByCat(Array.from(monthMap.values()));
    } catch {} finally { setLoading(false); }
  }, [period]);

  useEffect(() => { loadData(); }, [loadData]);

  const handlePeriodChange = (p: string) => {
    setPeriod(p as Period);
    setLoading(true);
    loadData(p as Period);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-border border-t-text-primary rounded-full animate-spin" />
      </div>
    );
  }

  const hasData = byCategory.length > 0 || expByDate.length > 0 || incByDate.length > 0;
  if (!hasData) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-text-secondary">Нет данных для отображения. Добавьте расходы или доходы.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8">
      {/* Period Filter */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-text-primary">Обзор</h2>
        <ToggleGroup
          value={period}
          onChange={handlePeriodChange}
          options={[
            { value: '30d', label: '30 дней' },
            { value: '6m', label: 'Полгода' },
            { value: 'all', label: 'Всё время' },
          ]}
        />
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-3 gap-4">
          <ChartCard>
            <p className="text-xs text-text-secondary mb-1">Доходы</p>
            <p className="text-2xl font-semibold text-success tracking-tight">
              {fmt(summary.totalIncome)} <span className="text-base font-normal">₽</span>
            </p>
          </ChartCard>
          <ChartCard>
            <p className="text-xs text-text-secondary mb-1">Расходы</p>
            <p className="text-2xl font-semibold text-danger tracking-tight">
              {fmt(summary.totalExpenses)} <span className="text-base font-normal">₽</span>
            </p>
          </ChartCard>
          <ChartCard>
            <p className="text-xs text-text-secondary mb-1">Баланс</p>
            <p className={`text-2xl font-semibold tracking-tight ${summary.balance >= 0 ? 'text-success' : 'text-danger'}`}>
              {fmt(summary.balance)} <span className="text-base font-normal">₽</span>
            </p>
          </ChartCard>
        </div>
      )}

      <div className="grid grid-cols-2 gap-5">
        {/* Pie */}
        {byCategory.length > 0 && (
          <ChartCard>
            <CardTitle>Расходы по категориям</CardTitle>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={byCategory} dataKey="total" nameKey="category"
                  cx="50%" cy="50%" innerRadius={60} outerRadius={100}
                  paddingAngle={3} cornerRadius={6}
                  animationBegin={0} animationDuration={800}
                >
                  {byCategory.map((entry: any, i: number) => (
                    <Cell key={entry.category} fill={getCatColor(entry.category, i)} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} isAnimationActive={false} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2 justify-center">
              {byCategory.map((entry: any, i: number) => (
                <div key={entry.category} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getCatColor(entry.category, i) }} />
                  <span className="text-xs text-text-secondary">{entry.category}</span>
                </div>
              ))}
            </div>
          </ChartCard>
        )}

        {/* Horizontal Bar */}
        {byCategory.length > 0 && (
          <ChartCard>
            <CardTitle>Сумма по категориям</CardTitle>
            <ResponsiveContainer width="100%" height={310}>
              <BarChart data={byCategory} layout="vertical" margin={{ left: 10, right: 20, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E0" horizontal={false} />
                <XAxis type="number" tickFormatter={fmt} tick={{ fontSize: 11, fill: '#6B6B65' }} />
                <YAxis type="category" dataKey="category" tick={{ fontSize: 11, fill: '#6B6B65' }} width={110} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} isAnimationActive={false} />
                <Bar dataKey="total" name="Сумма" radius={[0, 6, 6, 0]} animationDuration={800}>
                  {byCategory.map((entry: any, i: number) => (
                    <Cell key={entry.category} fill={getCatColor(entry.category, i)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Daily Expenses */}
        {expByDate.length > 0 && (
          <ChartCard className="col-span-2">
            <div className="flex items-center justify-between mb-4">
              <CardTitle>Расходы по дням</CardTitle>
              <ToggleGroup
                value={dailyMode}
                onChange={(v) => setDailyMode(v as any)}
                options={[
                  { value: 'total', label: 'Общая сумма' },
                  { value: 'category', label: 'По категориям' },
                ]}
              />
            </div>
            <ResponsiveContainer width="100%" height={300}>
              {dailyMode === 'total' ? (
                <AreaChart data={expByDate} margin={{ left: 10, right: 20, top: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#C75450" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#C75450" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E0" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6B6B65' }} />
                  <YAxis tickFormatter={fmt} tick={{ fontSize: 11, fill: '#6B6B65' }} />
                  <Tooltip content={<CustomTooltip />} isAnimationActive={false} />
                  <Area type="monotone" dataKey="total" name="Расходы"
                    stroke="#C75450" strokeWidth={2} fill="url(#expGrad)"
                    dot={{ r: 4, fill: '#C75450', strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: '#C75450', stroke: '#fff', strokeWidth: 2 }}
                    animationDuration={800} />
                  {freeMonthly > 0 && (
                    <Area type="stepAfter" dataKey="dailyBudget" name="Дневной лимит"
                      stroke="#4A9B6E" strokeWidth={2} strokeDasharray="6 3"
                      fill="none" dot={false} activeDot={false}
                      animationDuration={800} />
                  )}
                </AreaChart>
              ) : (
                <ComposedChart data={dailyByCat} margin={{ left: 10, right: 20, top: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E0" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6B6B65' }} />
                  <YAxis tickFormatter={fmt} tick={{ fontSize: 11, fill: '#6B6B65' }} />
                  <Tooltip content={<CustomTooltip />} isAnimationActive={false} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: '#6B6B65' }} />
                  {allCategories.map((cat, i) => (
                    <Bar key={cat} dataKey={cat} stackId="a" fill={getCatColor(cat, i)} animationDuration={800} />
                  ))}
                  {freeMonthly > 0 && (
                    <Line type="stepAfter" dataKey="dailyBudget" name="Дневной лимит"
                      stroke="#4A9B6E" strokeWidth={2} strokeDasharray="6 3"
                      dot={false} activeDot={false} animationDuration={800} />
                  )}
                </ComposedChart>
              )}
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Income over time */}
        {incByDate.length > 0 && (
          <ChartCard className="col-span-2">
            <CardTitle>Доходы по дням</CardTitle>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={incByDate} margin={{ left: 10, right: 20, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4A9B6E" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#4A9B6E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E0" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6B6B65' }} />
                <YAxis tickFormatter={fmt} tick={{ fontSize: 11, fill: '#6B6B65' }} />
                <Tooltip content={<CustomTooltip />} isAnimationActive={false} />
                <Area type="monotone" dataKey="total" name="Доход"
                  stroke="#4A9B6E" strokeWidth={2} fill="url(#incGrad)"
                  dot={{ r: 4, fill: '#4A9B6E', strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: '#4A9B6E', stroke: '#fff', strokeWidth: 2 }}
                  animationDuration={800} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Monthly */}
        {monthly.length > 0 && (
          <ChartCard className="col-span-2">
            <div className="flex items-center justify-between mb-4">
              <CardTitle>По месяцам</CardTitle>
              <ToggleGroup
                value={monthlyMode}
                onChange={(v) => setMonthlyMode(v as any)}
                options={[
                  { value: 'balance', label: 'Доходы / Расходы' },
                  { value: 'category', label: 'По категориям' },
                ]}
              />
            </div>
            <ResponsiveContainer width="100%" height={300}>
              {monthlyMode === 'balance' ? (
                <BarChart data={monthly} margin={{ left: 10, right: 20, top: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E0" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6B6B65' }} />
                  <YAxis tickFormatter={fmt} tick={{ fontSize: 11, fill: '#6B6B65' }} />
                  <Tooltip content={<CustomTooltip />} isAnimationActive={false} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: '#6B6B65' }} />
                  <Bar dataKey="income" name="Доходы" fill="#4A9B6E" radius={[6, 6, 0, 0]} animationDuration={800} />
                  <Bar dataKey="expenses" name="Расходы" fill="#C75450" radius={[6, 6, 0, 0]} animationDuration={800} />
                  {freeMonthly > 0 && (
                    <ReferenceLine y={freeMonthly} stroke="#E8917A" strokeWidth={2} strokeDasharray="6 3"
                      label={{ value: `Лимит: ${fmt(freeMonthly)} ₽`, position: 'right', fontSize: 11, fill: '#E8917A' }} />
                  )}
                </BarChart>
              ) : (
                <BarChart data={monthlyByCat} margin={{ left: 10, right: 20, top: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E0" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6B6B65' }} />
                  <YAxis tickFormatter={fmt} tick={{ fontSize: 11, fill: '#6B6B65' }} />
                  <Tooltip content={<CustomTooltip />} isAnimationActive={false} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: '#6B6B65' }} />
                  {allCategories.map((cat, i) => (
                    <Bar key={cat} dataKey={cat} stackId="a" fill={getCatColor(cat, i)} animationDuration={800} />
                  ))}
                  {freeMonthly > 0 && (
                    <ReferenceLine y={freeMonthly} stroke="#E8917A" strokeWidth={2} strokeDasharray="6 3"
                      label={{ value: `Лимит: ${fmt(freeMonthly)} ₽`, position: 'right', fontSize: 11, fill: '#E8917A' }} />
                  )}
                </BarChart>
              )}
            </ResponsiveContainer>
          </ChartCard>
        )}
      </div>

      {/* Refresh */}
      <div className="text-center pt-2">
        <button
          onClick={() => loadData()}
          className="text-xs text-text-secondary hover:text-text-primary transition-colors duration-200
                     border border-border rounded-lg px-4 py-2 hover:bg-white"
        >
          Обновить данные
        </button>
      </div>
    </div>
  );
}
