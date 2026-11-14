import fs from "node:fs";
import path from "node:path";
import { compile } from "@vue/compiler-dom";
const input = process.argv[2] ?? "docs/index.html";
const output = process.argv[3] ?? input;
let source = fs.readFileSync(input, "utf8").replace(/const ISRC = \{[\s\S]*?\};/, "const ISRC = {};");
// Keep the report's public navigation and cross-filters compact: instructors are
// filtered from Overview, and both selectors support multiple values. The source
// report is a single generated HTML file, so these small transforms keep the
// workflow's compiler as the single place that produces the published bundle.
const transforms = [
  ["f: uiSaved.f || { d: -1, i: -1, t: -1, l: -1, p: null }", "f: uiSaved.f || { d: -1, i: -1, ds: [], is: [], t: -1, l: -1, p: null }"],
  ["fetching: false };", "fetching: false, discOpen: false, instOpen: false, discQ: '', instQFilter: '' };"],
  ["const st = this.state, F = st.f;", "const st = this.state, F = Object.assign({ d: -1, i: -1, ds: [], is: [] }, st.f || {}); const dSel = Array.isArray(F.ds) ? F.ds : (F.d >= 0 ? [F.d] : []); const iSel = Array.isArray(F.is) ? F.is : (F.i >= 0 ? [F.i] : []);"],
  ["(skip === 'd' || F.d < 0 || r[1] === F.d) && (skip === 'i' || F.i < 0 || r[2] === F.i)", "(skip === 'd' || dSel.length === 0 || dSel.includes(r[1])) && (skip === 'i' || iSel.length === 0 || iSel.includes(r[2]))"],
  ["const setF = (patch) => this.setState({ f: Object.assign({}, F, patch) });\nconst tog = (k, v) => () => setF({ [k]: F[k] === v ? -1 : v });", "const setF = (patch) => { const next = Object.assign({}, F, patch); if (Object.prototype.hasOwnProperty.call(patch, 'ds')) next.d = patch.ds.length ? patch.ds[0] : -1; if (Object.prototype.hasOwnProperty.call(patch, 'is')) next.i = patch.is.length ? patch.is[0] : -1; this.setState({ f: next }); };\nconst tog = (k, v) => () => { const next = F[k] === v ? -1 : v; const patch = { [k]: next }; if (k === 'd') patch.ds = next < 0 ? [] : [next]; if (k === 'i') patch.is = next < 0 ? [] : [next]; setF(patch); };"],
  ["const hasF = F.d >= 0 || F.i >= 0 || F.t >= 0 || F.l >= 0 || !!F.p;", "const hasF = dSel.length > 0 || iSel.length > 0 || F.t >= 0 || F.l >= 0 || !!F.p;"],
  ["if (F.d >= 0) chips.push({ label: 'Discipline: ' + DISC[F.d], clear: () => setF({ d: -1 }) });", "if (dSel.length) chips.push({ label: dSel.length === 1 ? 'Discipline: ' + DISC[dSel[0]] : 'Disciplines: ' + dSel.length + ' selected', clear: () => setF({ d: -1, ds: [] }) });"],
  ["if (F.i >= 0) chips.push({ label: 'Instructor: ' + INST[F.i], clear: () => setF({ i: -1 }) });", "if (iSel.length) chips.push({ label: iSel.length === 1 ? 'Instructor: ' + INST[iSel[0]] : 'Instructors: ' + iSel.length + ' selected', clear: () => setF({ i: -1, is: [] }) });"],
  ["clearAll: () => setF({ d: -1, i: -1, t: -1, l: -1, p: null })", "clearAll: () => setF({ d: -1, i: -1, ds: [], is: [], t: -1, l: -1, p: null })"],
  ["[['overview', 'Overview'], ['inst', 'Instructors'], ['ach', 'Achievements'], ['log', 'Workout Log']]", "[['overview', 'Overview'], ['ach', 'Achievements'], ['log', 'Workout Log']]"] ,
  ["isOverview: st.page === 'overview', isDisc: st.page === 'disc', isInst: st.page === 'inst', isAch: st.page === 'ach', isLog: st.page === 'log',", "isOverview: st.page === 'overview', isDisc: false, isInst: false, isAch: st.page === 'ach', isLog: st.page === 'log',"],
  ["[['overview', 'Overview'], ['ach', 'Achievements'], ['log', 'Workout Log']]", "[['overview', 'Overview'], ['ach', 'Achievements']]"] ,
  ["isOverview: st.page === 'overview', isDisc: false, isInst: false, isAch: st.page === 'ach', isLog: st.page === 'log',", "isOverview: st.page === 'overview', isDisc: false, isInst: false, isAch: st.page === 'ach', isLog: false,"],
  ["const hasF = dSel.length > 0 || iSel.length > 0 || F.t >= 0 || F.l >= 0 || !!F.p;", "const hasF = dSel.length > 0 || iSel.length > 0 || F.t >= 0 || F.l >= 0 || !!F.p || !!F.q;"],
  ["chartTitle = st.mode === 'month' ? 'Minutes per day · ' + st.year : 'Minutes per month · ' + annY;", "chartTitle = st.mode === 'month' ? 'Minutes per day · ' + st.year : 'Minutes per month';"],
  ["const ey = yearOf(eff), em = dt(eff).getUTCMonth() + 1;", "const ey = st.mode === 'year' ? yearOf(s) : yearOf(eff), em = st.mode === 'year' ? 12 : dt(eff).getUTCMonth() + 1;"],
  ["(skip === 'd' || dSel.length === 0 || dSel.includes(r[1])) && (skip === 'i' || iSel.length === 0 || iSel.includes(r[2]))", "(skip === 'd' || dSel.length === 0 || dSel.includes(r[1])) && (skip === 'i' || iSel.length === 0 || iSel.includes(r[2])) && (skip === 'q' || !F.q || (() => { const t = r[10]; if (t === undefined || t < 0) return false; const m = t < 300 ? t + 1440 : t; return m >= F.q[0] && m < F.q[1]; })())"],
  ["clearAll: () => setF({ d: -1, i: -1, ds: [], is: [], t: -1, l: -1, p: null })", "clearAll: () => setF({ d: -1, i: -1, ds: [], is: [], t: -1, l: -1, p: null, q: null })"],
  ["const TOD = [['Early morning', 300, 480], ['Morning', 480, 720], ['Afternoon', 720, 1020], ['Evening', 1020, 1260], ['Night', 1260, 1740]];", "const TOD = [['Early', 300, 480], ['Morning', 480, 720], ['Afternoon', 720, 1020], ['Evening', 1020, 1260], ['Late', 1260, 1740]];"],
  ["const todRows = todC.map(([n, v], i) => ({ name: n + ' · ' + ['5–8', '8–12', '12–5', '5–9', '9–5'][i], val: num(v), pct: v ? Math.max(2, Math.round(100 * v / todMx)) : 0, bar: C.SLATE, row: 'background: transparent', pressed: 'false', open: () => {} }));", "const todRows = todC.map(([n, v], i) => { const a = TOD[i][1], b = TOD[i][2], selected = F.q && F.q[0] === a; return { name: n + ' · ' + ['5–8', '8–12', '12–5', '5–9', '9–5'][i], val: num(v), pct: v ? Math.max(2, Math.round(100 * v / todMx)) : 0, bar: selected ? C.TXT : C.SLATE, row: selected ? 'background: #FDF0F1' : 'background: transparent', pressed: selected ? 'true' : 'false', open: () => setF({ q: selected ? null : [a, b, n] }) }; });"],
  ["const chips = [];", "const chips = []; if (F.q) chips.push({ label: 'Time: ' + F.q[2], clear: () => setF({ q: null }) });"],
  ["const logRows = [...RD].sort((a, b) => cmp(lkey[SL.k](a), lkey[SL.k](b), SL.dir) || b[0] - a[0]).map((r) => ({ when: fd(r[0]), disc: DISC[r[1]], type: tname(r[3]), inst: INST[r[2]] || '—', len: String(r[4]), out: r[5] ? num(r[5]) : '—', dist: r[6] ? num(r[6], 2) : '—', spd: r[7] ? num(r[7], 1) : '—', hr: r[8] ? num(r[8]) : '—', cal: r[9] ? num(r[9]) : '—', pickI: INST[r[2]] ? tog('i', r[2]) : () => {}, pickD: tog('d', r[1]), pickT: tog('t', r[3]), linkable: !!INST[r[2]], plain: !INST[r[2]] }));", "const logRows = [...RD].sort((a, b) => cmp(lkey[SL.k](a), lkey[SL.k](b), SL.dir) || b[0] - a[0]).map((r) => ({ when: fd(r[0]), disc: DISC[r[1]], type: tname(r[3]), inst: INST[r[2]] || '—', len: String(r[4]), out: r[5] ? num(r[5]) : '—', dist: r[6] ? num(r[6], 2) : '—', spd: r[7] ? num(r[7], 1) : '—', hr: r[8] ? num(r[8]) : '—', cal: r[9] ? num(r[9]) : '—', pickI: INST[r[2]] ? tog('i', r[2]) : () => {}, pickD: tog('d', r[1]), pickT: tog('t', r[3]), linkable: !!INST[r[2]], plain: !INST[r[2]] })); const exportCsv = () => { const q = String.fromCharCode(34); const esc = (v) => q + String(v ?? '').replace(new RegExp(q, 'g'), q + q) + q; const rows = [['DATE', 'DISCIPLINE', 'CLASS TYPE', 'INSTRUCTOR', 'MIN', 'OUTPUT kJ', 'DIST km', 'SPEED km/h', 'HR', 'CAL'], ...logRows.map((r) => [r.when, r.disc, r.type, r.inst, r.len, r.out, r.dist, r.spd, r.hr, r.cal])]; const blob = new Blob([rows.map((row) => row.map(esc).join(',')).join('\\n') + '\\n'], { type: 'text/csv;charset=utf-8' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'peloton-workout-log.csv'; a.click(); URL.revokeObjectURL(url); };"],
  ["logRows: logRows, logHdr: logHdr,", "logRows: logRows, logHdr: logHdr, exportCsv: exportCsv,"],
  ["\"logRows\", \"logHdr\",", "\"logRows\", \"logHdr\", \"exportCsv\","],
  ["showAnalysis: st.page === 'overview' || (st.page === 'inst' && instSel),", "showAnalysis: st.page === 'overview',"],
  ["discVal: String(F.d), discOpts: discOpts, onDisc: (ev) => setF({ d: +ev.target.value }),", "discVal: dSel.length === DISC.length ? ['-1'] : dSel.map(String), discOpts: discOpts, onDisc: (ev) => { const v = +ev.target.value; if (v < 0) return setF({ ds: DISC.map((_, i) => i) }); const vals = dSel.includes(v) ? dSel.filter((x) => x !== v) : dSel.concat(v); setF({ ds: vals }); },"],
  ["instVal: String(F.i), instOpts: instOpts, onInst: (ev) => setF({ i: +ev.target.value }),", "instVal: iSel.length === instAll.length ? ['-1'] : iSel.map(String), instOpts: instOpts, onInst: (ev) => { const v = +ev.target.value; if (v < 0) return setF({ is: instAll.map(([i]) => i) }); const vals = iSel.includes(v) ? iSel.filter((x) => x !== v) : iSel.concat(v); setF({ is: vals }); }, discOpen: st.discOpen, instOpen: st.instOpen, discQ: st.discQ || '', instQFilter: st.instQFilter || '', toggleDiscMenu: () => this.setState({ discOpen: !st.discOpen, instOpen: false }), toggleInstMenu: () => this.setState({ instOpen: !st.instOpen, discOpen: false }), onDiscQ: (ev) => this.setState({ discQ: ev.target.value }), onInstFilterQ: (ev) => this.setState({ instQFilter: ev.target.value }), clearDiscFilter: () => setF({ d: -1, ds: [] }), clearInstFilter: () => setF({ i: -1, is: [] }), discLabel: dSel.length ? (dSel.length === 1 ? DISC[dSel[0]] : dSel.length + ' selected') : 'All disciplines', instLabel: iSel.length ? (iSel.length === 1 ? INST[iSel[0]] : iSel.length + ' selected') : 'All instructors (' + instAll.length + ')', onDiscOption: (v) => { const n = +v; const vals = dSel.includes(n) ? dSel.filter((x) => x !== n) : dSel.concat(n); setF({ ds: vals }); }, onInstOption: (v) => { const n = +v; const vals = iSel.includes(n) ? iSel.filter((x) => x !== n) : iSel.concat(n); setF({ is: vals }); },"],
  ["\"discVal\", \"discOpts\", \"onDisc\", \"instVal\", \"instOpts\", \"onInst\",", "\"discVal\", \"discOpts\", \"onDisc\", \"instVal\", \"instOpts\", \"onInst\", \"discOpen\", \"instOpen\", \"discQ\", \"instQFilter\", \"toggleDiscMenu\", \"toggleInstMenu\", \"onDiscQ\", \"onInstFilterQ\", \"clearDiscFilter\", \"clearInstFilter\", \"discLabel\", \"instLabel\", \"onDiscOption\", \"onInstOption\", "],
  ["\"chartTitle\", \"chartHint\",", "\"chartTitle\", \"chartHint\", \"avgY\", \"avgMins\", \"avgLabel\", "],
  ["This page pulls your latest workouts from Peloton automatically every night. Update data reloads the newest copy.", "Update data connects to Peloton and loads your latest workout history when you choose."],
  ["{{dataLabel}} <span style=\\\"color: #3A5A8C\\\">{{loadMsg}}<\\/span>", "{{loadMsg}}"],
  ["<template v-if=\\\"isInst\\\"><div style=\\\"display: flex; flex-direction: column; gap: 4px\\\"><label for=\\\"f-inst\\\"", "<template v-if=\\\"isOverview\\\"><div style=\\\"display: flex; flex-direction: column; gap: 4px\\\"><label for=\\\"f-inst\\\""],
  ["<select id=\\\"f-disc\\\" :value=\\\"discVal\\\" @change=\\\"onDisc\\\"", "<select id=\\\"f-disc\\\" multiple size=\\\"1\\\" :value=\\\"discVal\\\" @change=\\\"onDisc\\\""],
  ["<select id=\\\"f-inst\\\" :value=\\\"instVal\\\" @change=\\\"onInst\\\"", "<select id=\\\"f-inst\\\" multiple size=\\\"1\\\" :value=\\\"instVal\\\" @change=\\\"onInst\\\""],
];
for (const [from, to] of transforms) {
  if (!source.includes(from)) throw new Error(`Report transform did not match: ${from.slice(0, 80)}`);
  source = source.replace(from, to);
}
// All-time totals keep their full range; each activity chart browses one year.
const replaceYearSource = (from, to) => {
  if (!source.includes(from)) throw new Error('Calendar-year transform did not match: ' + from.slice(0, 80));
  source = source.replace(from, to);
};
replaceYearSource('const lastY = yearOf(last);', `const lastY = yearOf(last);
const firstY = yearOf(first);
const chartYear = (value) => Number.isInteger(value) ? Math.max(firstY, Math.min(lastY, value)) : lastY;
const monthlyYear = chartYear(st.monthlyYear), heatmapYear = chartYear(st.heatmapYear);
const moveChartYear = (key, value, delta) => this.setState({ [key]: chartYear(value + delta) });`);
replaceYearSource("let y = st.mode === 'all' ? yearOf(first) : yearOf(s), m = st.mode === 'all' ? dt(first).getUTCMonth() + 1 : 1;", "let y = st.mode === 'all' ? monthlyYear : yearOf(s), m = 1;");
replaceYearSource("const ey = st.mode === 'year' ? yearOf(s) : yearOf(eff), em = st.mode === 'year' ? 12 : dt(eff).getUTCMonth() + 1;", "const ey = st.mode === 'all' ? monthlyYear : yearOf(s), em = 12;");
replaceYearSource("'Minutes per month'; chartHint", "'Minutes per month' + (st.mode === 'all' ? ' · ' + monthlyYear : ''); chartHint");
replaceYearSource("const heatYears = st.mode === 'all' ? (() => { const a = []; for (let y = lastY; y >= yearOf(first); y--) a.push(y); return a; })() : [annY];", "const heatYears = [st.mode === 'all' ? heatmapYear : annY];");
replaceYearSource('kpis: kpis, bars: bars,', `isAll: st.mode === 'all', monthlyYear: monthlyYear, heatmapYear: heatmapYear,
canPrevMonthlyYear: monthlyYear > firstY, canNextMonthlyYear: monthlyYear < lastY,
canPrevHeatmapYear: heatmapYear > firstY, canNextHeatmapYear: heatmapYear < lastY,
prevMonthlyYear: () => moveChartYear('monthlyYear', monthlyYear, -1), nextMonthlyYear: () => moveChartYear('monthlyYear', monthlyYear, 1),
prevHeatmapYear: () => moveChartYear('heatmapYear', heatmapYear, -1), nextHeatmapYear: () => moveChartYear('heatmapYear', heatmapYear, 1),
kpis: kpis, bars: bars,`);
replaceYearSource('"kpis", "bars",', '"isAll", "monthlyYear", "heatmapYear", "canPrevMonthlyYear", "canNextMonthlyYear", "canPrevHeatmapYear", "canNextHeatmapYear", "prevMonthlyYear", "nextMonthlyYear", "prevHeatmapYear", "nextHeatmapYear", "kpis", "bars",');
replaceYearSource('</style>', '.chart-year-heading{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px}.chart-year-nav{display:flex;align-items:center;gap:8px;font-size:14px;font-variant-numeric:tabular-nums}.chart-year-nav button{min-width:44px;min-height:44px;border:1px solid #C9CDD3;border-radius:8px;background:#FFFFFF;color:#181A1D;font:inherit;cursor:pointer}.chart-year-nav button:disabled{opacity:.4;cursor:default}.chart-year-nav button:focus-visible{outline:2px solid #3A5A8C;outline-offset:2px}\n</style>');

// The report used to overwrite the connector-backed button with a second,
// nightly JSON loader and invoke it during startup. Remove that legacy path so
// data is fetched only when the user presses Update.
source = source.replace(/\/\/ GitHub Pages:[\s\S]*?Component\.prototype\.fetchLive = async function \(quiet\) \{[\s\S]*?\n\};\n/, '');
source = source.replace(/\n\s*comp\.fetchLive\(true\);\n/, '\n');
const replaceFilterControl = (id, menu) => {
  const start = source.indexOf(String.raw`<select id=\"${id}\"`);
  const endToken = String.raw`<\/select>`;
  const end = source.indexOf(endToken, start);
  if (start < 0 || end < 0) throw new Error(`Report ${id} control was not found`);
  source = source.slice(0, start) + JSON.stringify(menu).slice(1, -1) + source.slice(end + endToken.length);
};
replaceFilterControl('f-disc', `<div style="position: relative; min-width: 210px"><button type="button" @click="toggleDiscMenu" :aria-expanded="discOpen" aria-controls="f-disc-menu" style="min-height: 44px; width: 100%; padding: 0 12px; border-radius: 10px; background: #FFFFFF; color: #181A1D; border: 1px solid #C9CDD3; font: inherit; font-size: 14px; text-align: left; cursor: pointer">{{discLabel}}</button><div v-if="discOpen" id="f-disc-menu" role="group" aria-label="Discipline filter" style="position: absolute; z-index: 20; top: 48px; left: 0; width: 280px; max-height: 360px; overflow: auto; padding: 8px; border: 1px solid #C9CDD3; border-radius: 10px; background: #FFFFFF; box-shadow: 0 8px 24px rgba(24,26,29,.16)" @click.stop><button type="button" @click="clearDiscFilter" :disabled="!discVal.length" style="display: block; margin-bottom: 8px; padding: 4px 0; border: 0; background: transparent; color: #C8102E; font: inherit; font-size: 12px; cursor: pointer">Clear filter</button><input type="search" :value="discQ" @input="onDiscQ" placeholder="Search Discipline" aria-label="Search Discipline" autocomplete="off" style="display: block; width: 100%; box-sizing: border-box; margin-bottom: 8px; padding: 7px 8px; border: 1px solid #C9CDD3; border-radius: 7px; font: inherit; font-size: 13px"><label v-for="o in discOpts.filter((x) => String(x.v) !== '-1' && String(x.t).toLowerCase().includes(String(discQ).toLowerCase()))" :key="o.v" style="display: flex; align-items: center; gap: 8px; padding: 7px 6px; font-size: 13px; cursor: pointer"><input type="checkbox" :checked="discVal.includes(o.v)" @change="onDiscOption(o.v)"> {{o.t}}</label></div></div>`);
replaceFilterControl('f-inst', `<div style="position: relative; min-width: 240px"><button type="button" @click="toggleInstMenu" :aria-expanded="instOpen" aria-controls="f-inst-menu" style="min-height: 44px; width: 100%; padding: 0 12px; border-radius: 10px; background: #FFFFFF; color: #181A1D; border: 1px solid #C9CDD3; font: inherit; font-size: 14px; text-align: left; cursor: pointer">{{instLabel}}</button><div v-if="instOpen" id="f-inst-menu" role="group" aria-label="Instructor filter" style="position: absolute; z-index: 20; top: 48px; left: 0; width: 300px; max-height: 360px; overflow: auto; padding: 8px; border: 1px solid #C9CDD3; border-radius: 10px; background: #FFFFFF; box-shadow: 0 8px 24px rgba(24,26,29,.16)" @click.stop><button type="button" @click="clearInstFilter" :disabled="!instVal.length" style="display: block; margin-bottom: 8px; padding: 4px 0; border: 0; background: transparent; color: #C8102E; font: inherit; font-size: 12px; cursor: pointer">Clear filter</button><input type="search" :value="instQFilter" @input="onInstFilterQ" placeholder="Search Instructor" aria-label="Search Instructor" autocomplete="off" style="display: block; width: 100%; box-sizing: border-box; margin-bottom: 8px; padding: 7px 8px; border: 1px solid #C9CDD3; border-radius: 7px; font: inherit; font-size: 13px"><label v-for="o in instOpts.filter((x) => String(x.v) !== '-1' && String(x.t).toLowerCase().includes(String(instQFilter).toLowerCase()))" :key="o.v" style="display: flex; align-items: center; gap: 8px; padding: 7px 6px; font-size: 13px; cursor: pointer"><input type="checkbox" :checked="instVal.includes(o.v)" @change="onInstOption(o.v)"> {{o.t}}</label></div></div>`);
const property = "    template: \"";
const start = source.indexOf(property);
if (start < 0) throw new Error("Vue template property was not found");
const valueStart = start + property.length;
const marker = String.fromCharCode(34) + ",";
const lfMarker = marker + String.fromCharCode(10) + "    setup()";
const crlfMarker = marker + String.fromCharCode(13) + String.fromCharCode(10) + "    setup()";
const valueEnd = (() => {
  const lfEnd = source.indexOf(lfMarker, valueStart);
  if (lfEnd >= 0) return lfEnd;
  return source.indexOf(crlfMarker, valueStart);
})();
if (valueEnd < 0) throw new Error("Vue template terminator was not found");
let template = JSON.parse(String.fromCharCode(34) + source.slice(valueStart, valueEnd) + String.fromCharCode(34));

// Put the compact 30-day activity card beside the daily heatmap, while keeping
// the minutes-per-month chart on its own row so the primary activity controls
// read as one focused dashboard block on desktop and stack cleanly on mobile.
const calTitleIndex = template.indexOf('{{calTitle}}');
const activityRowStart = template.lastIndexOf('<div style="display: flex; flex-wrap: wrap; gap: 14px">', calTitleIndex);
const activityRowEndToken = '</svg></section></div>';
const activityRowEnd = template.indexOf(activityRowEndToken, calTitleIndex) + activityRowEndToken.length;
const heatTitleIndex = template.indexOf('{{heatTitle}}', activityRowEnd);
const heatStart = template.lastIndexOf('<section', heatTitleIndex);
const heatEndMarker = '\n<div style="display: flex; flex-wrap: wrap; gap: 14px">\n<section style="flex: 1 1 290px;';
const heatEnd = template.indexOf(heatEndMarker, heatStart);
if (calTitleIndex < 0 || activityRowStart < 0 || activityRowEnd <= activityRowStart || heatTitleIndex < 0 || heatStart < 0 || heatEnd <= heatStart) {
  throw new Error('Activity chart layout boundaries were not found');
}
const activityRow = template.slice(activityRowStart, activityRowEnd);
const calStart = activityRow.indexOf('<section');
const calEnd = activityRow.indexOf('</section>', calStart) + '</section>'.length;
const chartStart = activityRow.indexOf('<section', calEnd);
const chartEnd = activityRow.lastIndexOf('</section>') + '</section>'.length;
if (calStart < 0 || calEnd <= calStart || chartStart < 0 || chartEnd <= chartStart) {
  throw new Error('Activity and monthly chart sections were not found');
}
const calendarBlock = activityRow.slice(calStart, calEnd)
  .replace('<section ', '<section class="activity-calendar" ')
  .replace('flex: 1 1 320px;', 'flex: 0 1 300px; max-width: 320px;')
  .replace('padding: 20px;', 'padding: 8px;')
  .replace('grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 6px;', 'grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 2px;')
  .replace('padding-top: 8px;', 'padding-top: 4px;');
const monthlyBlock = activityRow.slice(chartStart, chartEnd)
  .replace('<section ', '<section class="minutes-monthly" ')
  .replace('flex: 3 1 600px;', 'flex: 1 1 600px; align-self: flex-start;')
  .replace('padding: 20px;', 'padding: 12px;')
  .replace('gap: 12px; box-sizing: border-box', 'gap: 6px; box-sizing: border-box')
  .replace('style="display: block"', 'style="display: block; height: 220px; max-height: 220px"')
  .replace('padding: 12px;', 'padding: 12px; min-height: 330px;');
const heatBlock = template.slice(heatStart, heatEnd)
  .replace('flex-direction: column; gap: 12px; box-sizing: border-box', 'flex-direction: column; gap: 8px; box-sizing: border-box')
  .replace('padding: 20px;', 'padding: 14px;')
  .replace(/<div style="display: flex; gap: 10px; align-items: baseline">[\s\S]*?<\/div>\n<svg :viewBox/, '<svg :viewBox');
const activityHeatRow = '<div style="display: flex; flex-wrap: wrap; align-items: flex-start; gap: 14px">' + calendarBlock + monthlyBlock + '</div>\n' + heatBlock;
template = template.slice(0, activityRowStart) + activityHeatRow + template.slice(heatEnd);

// Keep the Annual challenge with the rest of the achievement and challenge
// context. It used to be rendered twice (Overview and Achievements), which
// made the Overview feel crowded and left the Achievements section out of
// sequence. Extract the Overview card, remove the old Achievements copy, and
// insert one copy immediately before the live challenge catalogue.
const annualHeading = 'The Annual {{annual.year}} · 20,000 minutes';
const firstAnnualHeading = template.indexOf(annualHeading);
if (firstAnnualHeading < 0) throw new Error("Annual challenge heading was not found");
const overviewStart = template.lastIndexOf('<template v-if="isOverview">', firstAnnualHeading);
const overviewSectionStart = template.indexOf('<section', overviewStart);
const overviewSectionEnd = template.indexOf('</section>', overviewSectionStart);
const overviewEnd = template.indexOf('</section></template>', overviewSectionEnd) + '</section></template>'.length;
if (overviewStart < 0 || overviewSectionStart < 0 || overviewSectionEnd < 0 || overviewEnd < overviewSectionEnd) {
  throw new Error("Overview Annual card boundaries were not found");
}
const annualBlock = template.slice(overviewSectionStart, overviewSectionEnd + '</section>'.length);
template = template.slice(0, overviewStart) + template.slice(overviewEnd);

const remainingAnnualHeading = template.indexOf(annualHeading);
if (remainingAnnualHeading < 0) throw new Error("Achievements Annual card was not found");
const achievementsAnnualStart = template.lastIndexOf('<section', remainingAnnualHeading);
const achievementsAnnualEnd = template.indexOf('</section>', remainingAnnualHeading) + '</section>'.length;
if (achievementsAnnualStart < 0 || achievementsAnnualEnd <= achievementsAnnualStart) {
  throw new Error("Achievements Annual card boundaries were not found");
}
template = template.slice(0, achievementsAnnualStart) + template.slice(achievementsAnnualEnd);

const challengeHeading = 'Current monthly &amp; active challenges';
const challengeHeadingIndex = template.indexOf(challengeHeading);
const challengeSectionStart = template.lastIndexOf('<section', challengeHeadingIndex);
if (challengeHeadingIndex < 0 || challengeSectionStart < 0) throw new Error("Active challenge section was not found");
template = template.slice(0, challengeSectionStart) + annualBlock + '\n' + template.slice(challengeSectionStart);

// The Overview already exposes the underlying streak and achievement data in
// the other cards, so omit its redundant recent-achievements panel. Keep the
// corresponding Achievements panel intact.
const overviewRecentMarker = 'Milestones, streaks and the Annual';
const overviewRecentIndex = template.indexOf(overviewRecentMarker);
const overviewRecentStart = template.lastIndexOf('<section', overviewRecentIndex);
const overviewRecentEnd = template.indexOf('</section>', overviewRecentIndex) + '</section>'.length;
if (overviewRecentIndex < 0 || overviewRecentStart < 0 || overviewRecentEnd <= overviewRecentStart) {
  throw new Error("Overview recent-achievements panel was not found");
}
template = template.slice(0, overviewRecentStart) + template.slice(overviewRecentEnd);

const milestoneStart = template.indexOf('<template v-if="oneDisc">');
const milestoneEnd = template.indexOf('</template>', milestoneStart) + '</template>'.length;
if (milestoneStart < 0 || milestoneEnd <= milestoneStart) {
  throw new Error("Class length milestones panel was not found");
}
template = template.slice(0, milestoneStart) + template.slice(milestoneEnd);

// Stack Workout time preference under Class length in the same column. Move
// both the populated and empty states together so the layout stays consistent
// when class start-time data is unavailable.
const timeStart = template.indexOf('<template v-if="hasTimes">');
const noTimeStart = template.indexOf('<template v-if="noTimes">', timeStart);
const timeEnd = template.indexOf('</section></template>', noTimeStart) + '</section></template>'.length;
if (timeStart < 0 || noTimeStart < 0 || timeEnd <= noTimeStart) {
  throw new Error("Workout time preference panels were not found");
}
const timeBlock = template.slice(timeStart, timeEnd);
template = template.slice(0, timeStart) + template.slice(timeEnd);

const classHeading = '<h3 style="margin: 0; font-size: 16px; font-weight: 600">Class length</h3>';
const classHeadingIndex = template.indexOf(classHeading);
const classSectionStart = template.lastIndexOf('<section', classHeadingIndex);
const classSectionEnd = template.indexOf('</section>', classHeadingIndex) + '</section>'.length;
if (classHeadingIndex < 0 || classSectionStart < 0 || classSectionEnd <= classSectionStart) {
  throw new Error("Class length panel was not found");
}
const classSection = template.slice(classSectionStart, classSectionEnd);
const stackedClassColumn = '<div style="flex: 1 1 240px; min-width: 0; display: flex; flex-direction: column; gap: 14px">' + classSection + timeBlock + '</div>';
template = template.slice(0, classSectionStart) + stackedClassColumn + template.slice(classSectionEnd);

// The filtered class table is useful as the detailed result view, not just an
// instructor drill-down. Keep it visible on Overview so its rows and count
// respond to every active discipline, class-type, and instructor filter.
const everyClassOpen = '<template v-if="instSel"><section';
const everyClassStart = template.indexOf(everyClassOpen);
if (everyClassStart < 0) throw new Error("Every class panel was not found");
template = template.replace(everyClassOpen, '<section');
const everyClassEnd = template.indexOf('</section></template>', everyClassStart);
if (everyClassEnd < 0) throw new Error("Every class panel terminator was not found");
template = template.slice(0, everyClassEnd) + '</section>' + template.slice(everyClassEnd + '</section></template>'.length);

// Reuse the always-visible class table as the report's workout log. Keep the
// export beside the title so it always reflects the current date and filters.
const everyHeading = '<h3 style="margin: 0; font-size: 16px; font-weight: 600">Every class · {{classCount}} in {{scopeLabel}}</h3>';
if (!template.includes(everyHeading)) throw new Error("Every class heading was not found");
template = template.replace(everyHeading, '<div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap"><h3 style="margin: 0; font-size: 16px; font-weight: 600">Workout log · {{classCount}}</h3><button type="button" @click="exportCsv" style="min-height: 38px; padding: 0 12px; border: 1px solid #C9CDD3; border-radius: 999px; background: #FFFFFF; color: #3A5A8C; font: inherit; font-size: 13px; font-weight: 600; cursor: pointer">Export CSV</button></div>');

// Latest workouts is redundant once the filter-aware Every class table is
// always present on Overview.
const latestHeading = '<h3 style="margin: 0; font-size: 16px; font-weight: 600">Top workouts</h3>';
const latestIndex = template.indexOf(latestHeading);
const latestStart = template.lastIndexOf('<section', latestIndex);
const latestEnd = template.indexOf('</section>', latestIndex) + '</section>'.length;
if (latestIndex < 0 || latestStart < 0 || latestEnd <= latestStart) {
  throw new Error("Latest workouts panel was not found");
}
template = template.slice(0, latestStart) + template.slice(latestEnd);

// Keep the header focused on identity and date scope. The manual refresh
// control belongs in the footer so it does not compete with report filters.
const dataPanelRe = /<div style="display: flex; flex-direction: column; gap: 4px">\n<span style="font-size: 11px; font-weight: 600; color: #5B6069; letter-spacing: 0\.6px">DATA<\/span>[\s\S]*?<\/div>\n<template v-if="hasData">/;
if (!dataPanelRe.test(template)) throw new Error('Header data controls were not found');
template = template.replace(dataPanelRe, '<template v-if="hasData">');
const footerMarker = '</div>\n</div>';
const footerIndex = template.lastIndexOf(footerMarker);
if (footerIndex < 0) throw new Error('Report footer boundary was not found');
const footer = '<footer style="max-width: 1360px; margin: 20px auto 0; padding: 14px 24px; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; background: #FFFFFF; border: 1px solid #E1E4E8; border-radius: 12px; box-sizing: border-box"><span role="status" style="font-size: 12px; color: #5B6069">{{dataLabel}} <span style="color: #3A5A8C">{{loadMsg}}</span></span><button type="button" @click="onFetch" :aria-busy="fetching" style="min-height: 40px; padding: 0 16px; border-radius: 999px; background: #DF1C2F; border: 0; color: #FFFFFF; font: inherit; font-size: 14px; font-weight: 700; cursor: pointer">{{fetchLabel}}</button></footer>\n';
template = template.slice(0, footerIndex) + footer + template.slice(footerIndex);
template = template.replace(' · {{totalAll}} workouts · {{dataLabel}}', ' · {{totalAll}} workouts');

template = template.replace('>Top workouts<', '>Latest workouts<');
template = template.replace(
  '<template v-for="(b, b_i) in bars"',
  '<template v-if="avgY"><line x1="0" x2="1000" :y1="avgY" :y2="avgY" stroke="#3A5A8C" stroke-width="2" stroke-dasharray="8 6"></line><text x="992" :y="avgY - 6" fill="#3A5A8C" font-size="11" text-anchor="end" font-family="Inter, sans-serif">{{avgLabel}}</text></template><template v-for="(b, b_i) in bars"'
);
const yearControls = (kind, label) => {
  const field = kind === 'Monthly' ? 'monthlyYear' : 'heatmapYear';
  return `<div v-if="isAll" class="chart-year-nav" role="group" aria-label="${label} year"><button type="button" @click="prev${kind}Year" :disabled="!canPrev${kind}Year" aria-label="Previous year for ${label}">&lt;</button><span aria-live="polite">{{${field}}}</span><button type="button" @click="next${kind}Year" :disabled="!canNext${kind}Year" aria-label="Next year for ${label}">&gt;</button></div>`;
};
for (const [heading, kind, label] of [['chartTitle', 'Monthly', 'minutes per month'], ['heatTitle', 'Heatmap', 'daily heatmap']]) {
  const h = '<h3 style="margin: 0; font-size: 16px; font-weight: 600">{{' + heading + '}}</h3>';
  if (!template.includes(h)) throw new Error('Year control heading not found: ' + heading);
  template = template.replace(h, '<div class="chart-year-heading">' + h + yearControls(kind, label) + '</div>');
}

const compiled = compile(template, { mode: "function", prefixIdentifiers: false });
const render = "(function(){" + compiled.code + "})()";
const result = source.slice(0, start) + "    render: " + render + source.slice(valueEnd + 1);
const runtime = "vendor/vue.global.prod.js";
const runtimeOnly = "vendor/vue.runtime.global.prod.js";
const runtimeSource = fs.readFileSync(new URL("../docs/vendor/vue.runtime.global.prod.js", import.meta.url), "utf8");
const externalRuntime = result.replace(runtime, runtimeOnly);
const appMatch = [...externalRuntime.matchAll(/<script(?:\s[^>]*)?>\r?\n([\s\S]*?)\r?\n<\/script>/g)].find((match) => match[1].includes("async fetchLive()"));
if (!appMatch) throw new Error("Compiled report script was not found");
const outputDir = path.dirname(output);
const appPath = path.join(outputDir, "report-app.js");
fs.writeFileSync(appPath, appMatch[1] + "\n");
const externalApp = externalRuntime.replace(appMatch[0], "<script src=\"report-app.js\"></script>");
const styleMatch = externalApp.match(/<style>\r?\n([\s\S]*?)\r?\n<\/style>/);
if (!styleMatch) throw new Error("Report stylesheet was not found");
const cssPath = path.join(outputDir, "report.css");
fs.writeFileSync(cssPath, styleMatch[1] + "\n");
const runtimeTag = `<script src=\"${runtimeOnly}\"></script>`;
const externalAssets = externalApp.replace(styleMatch[0], "<link rel=\"stylesheet\" href=\"report.css\">");
fs.writeFileSync(output, externalAssets);
