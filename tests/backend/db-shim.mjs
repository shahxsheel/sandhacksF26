import { PGlite } from "@electric-sql/pglite";
export const pg = new PGlite();
function build(strings, values) {
  let text = "";
  strings.forEach((s, i) => { text += s + (i < values.length ? `$${i + 1}` : ""); });
  return { text, params: values };
}
async function exec(runner, q) { const r = await runner.query(q.text, q.params); return r.rows; }
function lazy(q) {
  return { queryData: q, then: (a, b) => exec(pg, q).then(a, b), catch: (b) => exec(pg, q).catch(b) };
}
const sql = (strings, ...values) => lazy(build(strings, values));
sql.query = (text, params = []) => lazy({ text, params });
sql.transaction = async (qs) => {
  const list = typeof qs === "function" ? qs(sql) : qs;
  return pg.transaction(async (tx) => { const out = []; for (const q of list) out.push(await exec(tx, q.queryData)); return out; });
};
export function getDatabase() { return sql; }
export async function initSchema(text, budgets) {
  const stmts = text.split(/;\s*(?:\r?\n|$)/).map(b => b.split(/\r?\n/).filter(l => !l.trim().startsWith("--")).join("\n").trim()).filter(Boolean);
  for (const s of stmts) await pg.exec(s);
  for (const [p,u,c] of budgets) await pg.query("INSERT INTO fl_budgets (provider, unit, cap) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING",[p,u,c]);
  return stmts.length;
}
