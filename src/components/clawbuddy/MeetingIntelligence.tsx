import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { format, isAfter, parseISO, subDays } from "date-fns";
import DOMPurify from "dompurify";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Calendar,
  CheckSquare,
  ChevronDown,
  Clock,
  Globe,
  Search,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { meetingTypeColors, type Meeting, type MeetingType } from "./data";

const ALL_TYPES: MeetingType[] = ["1-on-1", "external", "sales", "team", "standup", "planning", "interview", "all-hands"];

function initialsOf(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function Kpi({ icon: Icon, label, value }: { icon: typeof Calendar; label: string; value: string | number }) {
  return (
    <div className="glass-card p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400 glow-emerald">
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-4 font-mono text-3xl font-semibold text-foreground tabular-nums">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

export function MeetingIntelligence({ meetings }: { meetings: Meeting[] }) {
  const [search, setSearch] = useState("");
  const [types, setTypes] = useState<Set<MeetingType>>(new Set());
  const [range, setRange] = useState<"7d" | "30d" | "90d" | "all">("all");
  const [hasAction, setHasAction] = useState(false);
  const [externalOnly, setExternalOnly] = useState(false);
  const [sort, setSort] = useState<"recent" | "oldest" | "longest">("recent");
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = meetings.slice();
    if (search) list = list.filter((m) => m.title.toLowerCase().includes(search.toLowerCase()));
    if (types.size > 0) list = list.filter((m) => types.has(m.meeting_type));
    if (range !== "all") {
      const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
      const cutoff = subDays(new Date(), days);
      list = list.filter((m) => isAfter(parseISO(m.date), cutoff));
    }
    if (hasAction) list = list.filter((m) => m.action_items.length > 0);
    if (externalOnly) list = list.filter((m) => m.has_external_participants);
    list.sort((a, b) => {
      if (sort === "recent") return parseISO(b.date).getTime() - parseISO(a.date).getTime();
      if (sort === "oldest") return parseISO(a.date).getTime() - parseISO(b.date).getTime();
      return b.duration_minutes - a.duration_minutes;
    });
    return list;
  }, [meetings, search, types, range, hasAction, externalOnly, sort]);

  const totalMeetings = 247;
  const weekCutoff = subDays(new Date(), 7);
  const thisWeek = meetings.filter((m) => isAfter(parseISO(m.date), weekCutoff)).length;
  const openActions = meetings.reduce((n, m) => n + m.action_items.filter((a) => !a.done).length, 0);
  const avgDuration = Math.round(meetings.reduce((n, m) => n + m.duration_minutes, 0) / meetings.length);

  const typeDist = useMemo(() => {
    const counts = new Map<MeetingType, number>();
    meetings.forEach((m) => counts.set(m.meeting_type, (counts.get(m.meeting_type) ?? 0) + 1));
    return Array.from(counts.entries()).map(([name, value]) => ({ name, value }));
  }, [meetings]);

  const monthly = useMemo(() => {
    const counts = new Map<string, number>();
    meetings.forEach((m) => {
      const key = format(parseISO(m.date), "MMM");
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    return Array.from(counts.entries()).map(([month, count]) => ({ month, count }));
  }, [meetings]);

  const toggleType = (t: MeetingType) => {
    setTypes((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi icon={Calendar} label="Total meetings" value={totalMeetings} />
        <Kpi icon={TrendingUp} label="This week" value={thisWeek} />
        <Kpi icon={CheckSquare} label="Open action items" value={openActions} />
        <Kpi icon={Clock} label="Avg duration" value={`${avgDuration}m`} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="glass-card p-5">
          <h3 className="font-display text-base font-semibold">Meeting type distribution</h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={typeDist} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                  {typeDist.map((e) => (
                    <Cell key={e.name} fill={meetingTypeColors[e.name as MeetingType]} stroke="rgba(0,0,0,0.3)" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "#0a0a0f", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {typeDist.map((e) => (
              <div key={e.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="h-2 w-2 rounded-full" style={{ background: meetingTypeColors[e.name as MeetingType] }} />
                {e.name} <span className="font-mono text-foreground">{e.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-5">
          <h3 className="font-display text-base font-semibold">Monthly trend</h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer>
              <BarChart data={monthly}>
                <XAxis dataKey="month" stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.04)" }}
                  contentStyle={{ background: "#0a0a0f", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="count" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="glass-card space-y-4 p-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search meetings by title…"
            className="w-full rounded-lg border border-white/10 bg-black/30 py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-emerald-500/40 focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {ALL_TYPES.map((t) => {
            const on = types.has(t);
            return (
              <button
                key={t}
                onClick={() => toggleType(t)}
                className={`rounded-full border px-2.5 py-1 text-xs uppercase tracking-wider transition-colors ${
                  on
                    ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                    : "border-white/10 bg-white/5 text-muted-foreground hover:text-foreground"
                }`}
              >
                {t}
              </button>
            );
          })}
          <div className="mx-2 h-5 w-px bg-white/10" />
          {(["7d", "30d", "90d", "all"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-full border px-2.5 py-1 text-xs uppercase tracking-wider transition-colors ${
                range === r
                  ? "border-cyan-500/40 bg-cyan-500/15 text-cyan-300"
                  : "border-white/10 bg-white/5 text-muted-foreground hover:text-foreground"
              }`}
            >
              {r === "all" ? "All time" : r}
            </button>
          ))}
          <div className="mx-2 h-5 w-px bg-white/10" />
          <button
            onClick={() => setHasAction((v) => !v)}
            className={`rounded-full border px-2.5 py-1 text-xs uppercase tracking-wider ${
              hasAction ? "border-amber-500/40 bg-amber-500/15 text-amber-300" : "border-white/10 bg-white/5 text-muted-foreground"
            }`}
          >
            Has action items
          </button>
          <button
            onClick={() => setExternalOnly((v) => !v)}
            className={`rounded-full border px-2.5 py-1 text-xs uppercase tracking-wider ${
              externalOnly ? "border-purple-500/40 bg-purple-500/15 text-purple-300" : "border-white/10 bg-white/5 text-muted-foreground"
            }`}
          >
            External only
          </button>
          <div className="ml-auto">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
              className="rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 text-xs text-foreground focus:outline-none"
            >
              <option value="recent">Most recent</option>
              <option value="oldest">Oldest first</option>
              <option value="longest">Longest duration</option>
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((m) => {
          const isOpen = openId === m.id;
          const openItems = m.action_items.filter((a) => !a.done).length;
          return (
            <motion.div key={m.id} layout className="glass-card overflow-hidden">
              <button
                onClick={() => setOpenId(isOpen ? null : m.id)}
                className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-white/[0.02]"
              >
                <span
                  className="shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider"
                  style={{
                    background: `${meetingTypeColors[m.meeting_type]}22`,
                    color: meetingTypeColors[m.meeting_type],
                    border: `1px solid ${meetingTypeColors[m.meeting_type]}55`,
                  }}
                >
                  {m.meeting_type}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="truncate text-sm font-semibold text-foreground">{m.title}</h4>
                    {m.has_external_participants && <Globe className="h-3.5 w-3.5 text-purple-400" />}
                  </div>
                  <div className="mt-0.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    {format(parseISO(m.date), "MMM d, yyyy · HH:mm")} · {m.duration_display}
                  </div>
                </div>
                <div className="flex shrink-0 -space-x-2">
                  {m.attendees.slice(0, 3).map((a) => (
                    <div
                      key={a}
                      title={a}
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-black/40 bg-emerald-500/20 font-mono text-[10px] font-semibold text-emerald-200"
                    >
                      {initialsOf(a)}
                    </div>
                  ))}
                  {m.attendees.length > 3 && (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full border border-black/40 bg-white/10 font-mono text-[10px] text-foreground">
                      +{m.attendees.length - 3}
                    </div>
                  )}
                </div>
                {openItems > 0 && (
                  <span className="shrink-0 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-amber-300">
                    {openItems} open
                  </span>
                )}
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
                />
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden border-t border-white/5"
                  >
                    <div className="grid grid-cols-1 gap-6 p-5 lg:grid-cols-3">
                      <div className="lg:col-span-2 space-y-4">
                        <div>
                          <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                            Summary
                          </div>
                          <p
                            className="text-sm leading-relaxed text-foreground"
                            dangerouslySetInnerHTML={{
                              __html: DOMPurify.sanitize(
                                m.summary.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>"),
                              ),
                            }}
                          />
                        </div>
                        {m.action_items.length > 0 && (
                          <div>
                            <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                              Action items
                            </div>
                            <div className="space-y-1.5">
                              {m.action_items.map((a, i) => (
                                <label
                                  key={i}
                                  className="flex items-start gap-2 rounded-lg border border-white/5 bg-black/20 p-2.5 text-sm"
                                >
                                  <input
                                    type="checkbox"
                                    defaultChecked={a.done}
                                    className="mt-0.5 h-4 w-4 accent-emerald-500"
                                  />
                                  <span className={`flex-1 ${a.done ? "text-muted-foreground line-through" : "text-foreground"}`}>
                                    {a.task}
                                  </span>
                                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                                    {a.assignee}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                          {m.ai_insights}
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                            Attendees
                          </div>
                          <div className="space-y-1">
                            {m.attendees.map((a) => (
                              <div key={a} className="text-sm text-foreground">
                                {a}
                              </div>
                            ))}
                          </div>
                        </div>
                        {m.external_domains.length > 0 && (
                          <div>
                            <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                              External domains
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {m.external_domains.map((d) => (
                                <span
                                  key={d}
                                  className="rounded-full border border-purple-500/30 bg-purple-500/10 px-2 py-0.5 text-xs text-purple-300"
                                >
                                  {d}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="flex flex-wrap gap-2">
                          {m.fathom_url && (
                            <a
                              href={m.fathom_url}
                              className="rounded-lg border border-emerald-500/30 bg-emerald-500/15 px-3 py-1.5 text-xs font-medium text-emerald-300"
                            >
                              Open recording
                            </a>
                          )}
                          {m.share_url && (
                            <a
                              href={m.share_url}
                              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-foreground"
                            >
                              Share link
                            </a>
                          )}
                          <select
                            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-foreground focus:outline-none"
                            defaultValue=""
                          >
                            <option value="" disabled>
                              Send to…
                            </option>
                            <option>Action items</option>
                            <option>Proposals</option>
                            <option>Lead magnets</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
        {filtered.length === 0 && (
          <div className="glass-card p-10 text-center text-sm text-muted-foreground">No meetings match your filters.</div>
        )}
      </div>
    </div>
  );
}