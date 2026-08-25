export function money(minor = 0, currency='ZAR') {
  try { return new Intl.NumberFormat(undefined,{style:'currency',currency,minimumFractionDigits:2}).format(minor/100); }
  catch { return `R ${(minor/100).toFixed(2)}`; }
}
export function minorFromInput(v:string) {
  const n = Number((v || '').replace(/[^0-9.-]/g,''));
  return Number.isFinite(n) ? Math.round(n*100) : 0;
}
export function dateISO(d = new Date()) { return d.toISOString().slice(0,10); }
export function uuid() { return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}-${Math.random().toString(36).slice(2,8)}`; }
