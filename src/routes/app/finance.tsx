import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { SquarePageShell } from "@/components/app/SquarePageShell";
import { Module } from "@/components/app/Module";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export const Route = createFileRoute("/app/finance")({ component: FinancePage });

interface Tx {
  id: string;
  title: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  transaction_date: string;
}

interface Budget {
  id: string;
  category: string;
  monthly_limit: number;
}

const CATEGORY_PALETTE = ["#8AB79B", "#6FA88B", "#5C9B7B", "#4A8B6D", "#3F7860", "#345F4D", "#9CC9AE", "#B7DBC8"];

function FinancePage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"overview" | "transactions" | "budgets">("overview");
  const [txs, setTxs] = useState<Tx[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: "", amount: "", type: "expense" as Tx["type"], category: "general" });
  const [budgetForm, setBudgetForm] = useState({ category: "", limit: "" });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: t }, { data: b }] = await Promise.all([
        supabase.from("finance_transactions").select("*").eq("user_id", user.id).order("transaction_date", { ascending: false }),
        supabase.from("finance_budgets").select("*").eq("user_id", user.id),
      ]);
      setTxs((t as Tx[]) ?? []);
      setBudgets((b as Budget[]) ?? []);
    })();
  }, [user]);

  const monthStart = useMemo(() => { const d = new Date(); d.setDate(1); d.setHours(0,0,0,0); return d; }, []);
  const thisMonth = useMemo(() => txs.filter((t) => new Date(t.transaction_date) >= monthStart), [txs, monthStart]);
  const income = thisMonth.filter((t) => t.type === "income").reduce((a, t) => a + Number(t.amount), 0);
  const expense = thisMonth.filter((t) => t.type === "expense").reduce((a, t) => a + Number(t.amount), 0);
  const net = income - expense;

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of thisMonth.filter((t) => t.type === "expense")) {
      map.set(t.category, (map.get(t.category) ?? 0) + Number(t.amount));
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [thisMonth]);

  const months6 = useMemo(() => {
    const buckets: { label: string; income: number; expense: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i);
      const start = new Date(d); const end = new Date(d); end.setMonth(end.getMonth() + 1);
      const inc = txs.filter((t) => t.type === "income" && new Date(t.transaction_date) >= start && new Date(t.transaction_date) < end).reduce((a, t) => a + Number(t.amount), 0);
      const exp = txs.filter((t) => t.type === "expense" && new Date(t.transaction_date) >= start && new Date(t.transaction_date) < end).reduce((a, t) => a + Number(t.amount), 0);
      buckets.push({ label: d.toLocaleString(undefined, { month: "short" }), income: inc, expense: exp });
    }
    return buckets;
  }, [txs]);

  const add = async () => {
    if (!user || !form.title.trim()) return;
    const { data, error } = await supabase.from("finance_transactions").insert({
      user_id: user.id, title: form.title, amount: Number(form.amount) || 0, type: form.type, category: form.category || "general",
      transaction_date: new Date().toISOString().slice(0, 10),
    }).select().single();
    if (error) return toast.error(error.message);
    setTxs((c) => [data as Tx, ...c]);
    setForm({ title: "", amount: "", type: "expense", category: "general" }); setAdding(false);
  };

  const removeTx = async (id: string) => {
    setTxs((c) => c.filter((t) => t.id !== id));
    await supabase.from("finance_transactions").delete().eq("id", id);
  };

  const addBudget = async () => {
    if (!user || !budgetForm.category.trim()) return;
    const { data, error } = await supabase.from("finance_budgets").insert({
      user_id: user.id, category: budgetForm.category.trim(), monthly_limit: Number(budgetForm.limit) || 0,
    }).select().single();
    if (error) return toast.error(error.message);
    setBudgets((c) => [...c, data as Budget]);
    setBudgetForm({ category: "", limit: "" });
  };

  const removeBudget = async (id: string) => {
    setBudgets((c) => c.filter((b) => b.id !== id));
    await supabase.from("finance_budgets").delete().eq("id", id);
  };

  const totalExpense = byCategory.reduce((a, [, v]) => a + v, 0);

  return (
    <SquarePageShell title="Finance" icon="₵" blurb="Money in, money out." onAdd={() => setAdding(true)} addLabel="Add transaction">
      <div className="flex gap-2 mb-5">
        {(["overview", "transactions", "budgets"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`mono text-[10px] uppercase px-3 py-1.5 rounded-md border ${tab === t ? "border-brand text-brand bg-brand/10" : "border-border text-muted-foreground"}`}>{t}</button>
        ))}
      </div>

      {tab === "overview" && (
        <>
          <div className="grid sm:grid-cols-3 gap-4 mb-4">
            <Module label="Income" meta="this month"><div className="text-2xl font-semibold text-brand">${income.toFixed(2)}</div></Module>
            <Module label="Expenses" meta="this month"><div className="text-2xl font-semibold text-destructive">${expense.toFixed(2)}</div></Module>
            <Module label="Net" meta="this month"><div className={`text-2xl font-semibold ${net >= 0 ? "text-brand" : "text-destructive"}`}>${net.toFixed(2)}</div></Module>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <Module label="By category" meta="this month">
              {byCategory.length === 0 ? (
                <p className="text-sm text-muted-foreground">No expenses logged this month.</p>
              ) : (
                <div className="flex items-center gap-6">
                  <Donut segments={byCategory.map(([cat, v], i) => ({ label: cat, value: v, colour: CATEGORY_PALETTE[i % CATEGORY_PALETTE.length] }))} />
                  <ul className="flex-1 space-y-1.5 text-sm">
                    {byCategory.map(([cat, v], i) => (
                      <li key={cat} className="flex items-center gap-2">
                        <span className="size-2.5 rounded-sm" style={{ background: CATEGORY_PALETTE[i % CATEGORY_PALETTE.length] }} />
                        <span className="flex-1 truncate">{cat}</span>
                        <span className="mono text-[11px] text-muted-foreground">${v.toFixed(0)} · {Math.round((v / totalExpense) * 100)}%</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Module>

            <Module label="6-month trend" meta="income vs expense">
              <div className="flex items-end gap-2 h-32">
                {months6.map((m) => {
                  const max = Math.max(1, ...months6.flatMap((x) => [x.income, x.expense]));
                  return (
                    <div key={m.label} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full flex gap-0.5 items-end h-24">
                        <div className="flex-1 bg-brand/70 rounded-t" style={{ height: `${(m.income / max) * 100}%` }} title={`Income $${m.income}`} />
                        <div className="flex-1 bg-destructive/60 rounded-t" style={{ height: `${(m.expense / max) * 100}%` }} title={`Expense $${m.expense}`} />
                      </div>
                      <span className="mono text-[9px] text-muted-foreground">{m.label}</span>
                    </div>
                  );
                })}
              </div>
            </Module>
          </div>
        </>
      )}

      {tab === "transactions" && (
        <Module label="Transactions" meta={`${txs.length}`}>
          {txs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing logged yet.</p>
          ) : (
            <ul className="divide-y divide-border/60">
              {txs.map((t) => (
                <li key={t.id} className="flex items-center gap-3 py-2 text-sm group">
                  <span className="mono text-[10px] text-muted-foreground w-20">{t.transaction_date}</span>
                  <span className="flex-1">{t.title}</span>
                  <span className="mono text-[10px] text-muted-foreground">{t.category}</span>
                  <span className={`font-medium ${t.type === "income" ? "text-brand" : "text-destructive"}`}>{t.type === "income" ? "+" : "−"}${Number(t.amount).toFixed(2)}</span>
                  <button onClick={() => removeTx(t.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"><Trash2 size={12} /></button>
                </li>
              ))}
            </ul>
          )}
        </Module>
      )}

      {tab === "budgets" && (
        <div className="grid lg:grid-cols-2 gap-4">
          <Module label="Monthly budgets" meta={`${budgets.length}`}>
            {budgets.length === 0 ? (
              <p className="text-sm text-muted-foreground">No budgets yet.</p>
            ) : (
              <ul className="space-y-3">
                {budgets.map((b) => {
                  const spent = thisMonth.filter((t) => t.type === "expense" && t.category === b.category).reduce((a, t) => a + Number(t.amount), 0);
                  const pct = b.monthly_limit > 0 ? Math.min(100, (spent / b.monthly_limit) * 100) : 0;
                  const over = spent > b.monthly_limit && b.monthly_limit > 0;
                  return (
                    <li key={b.id}>
                      <div className="flex items-center justify-between mb-1 text-sm">
                        <span className="font-medium">{b.category}</span>
                        <span className={`mono text-[11px] ${over ? "text-destructive" : "text-muted-foreground"}`}>${spent.toFixed(0)} / ${Number(b.monthly_limit).toFixed(0)}</span>
                        <button onClick={() => removeBudget(b.id)} className="text-muted-foreground hover:text-destructive ml-2"><Trash2 size={12} /></button>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className={`h-full transition-all ${over ? "bg-destructive" : "bg-brand"}`} style={{ width: `${pct}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Module>
          <Module label="New budget">
            <input value={budgetForm.category} onChange={(e) => setBudgetForm((f) => ({ ...f, category: e.target.value }))} placeholder="Category (e.g. groceries)" className="w-full mb-3 bg-background border border-border rounded-md px-3 py-2 text-sm" />
            <input type="number" value={budgetForm.limit} onChange={(e) => setBudgetForm((f) => ({ ...f, limit: e.target.value }))} placeholder="Monthly limit ($)" className="w-full mb-3 bg-background border border-border rounded-md px-3 py-2 text-sm" />
            <button onClick={addBudget} className="btn-brand text-xs py-1.5 px-3 w-full">Add budget</button>
          </Module>
        </div>
      )}

      {adding && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setAdding(false)}>
          <div className="module max-w-sm w-full p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold mb-3">New transaction</h3>
            <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} autoFocus placeholder="Title" className="w-full mb-3 bg-background border border-border rounded-md px-3 py-2 text-sm" />
            <input value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} placeholder="Amount" type="number" className="w-full mb-3 bg-background border border-border rounded-md px-3 py-2 text-sm" />
            <input value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} placeholder="Category" className="w-full mb-3 bg-background border border-border rounded-md px-3 py-2 text-sm" />
            <div className="flex gap-2 mb-4">
              {(["income","expense"] as const).map((t) => (
                <button key={t} onClick={() => setForm((f) => ({ ...f, type: t }))} className={`flex-1 mono text-[10px] uppercase py-1.5 rounded border ${form.type === t ? "border-brand text-brand bg-brand/10" : "border-border text-muted-foreground"}`}>{t}</button>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setAdding(false)} className="btn-outline-brand text-xs py-1.5 px-3">Cancel</button>
              <button onClick={add} className="btn-brand text-xs py-1.5 px-3">Add</button>
            </div>
          </div>
        </div>
      )}
    </SquarePageShell>
  );
}

function Donut({ segments }: { segments: { label: string; value: number; colour: string }[] }) {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  const r = 38; const c = 2 * Math.PI * r; let acc = 0;
  return (
    <svg width={120} height={120} viewBox="0 0 120 120" className="shrink-0 -rotate-90">
      <circle cx={60} cy={60} r={r} stroke="var(--muted)" strokeWidth={14} fill="none" opacity={0.4} />
      {segments.map((s) => {
        const len = (s.value / total) * c;
        const dash = `${len} ${c - len}`;
        const offset = -acc;
        acc += len;
        return <circle key={s.label} cx={60} cy={60} r={r} stroke={s.colour} strokeWidth={14} fill="none" strokeDasharray={dash} strokeDashoffset={offset} />;
      })}
    </svg>
  );
}
