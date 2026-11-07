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
  ["[['overview', 'Overview'], ['inst', 'Instructors'], ['ach', 'Achievements'], ['log', 'Workout Log']]", "[['overview', 'Overview'], ['ach', 'Achievements'], ['log', 'Workout Log']]"],
  ["isOverview: st.page === 'overview', isDisc: st.page === 'disc', isInst: st.page === 'inst', isAch: st.page === 'ach', isLog: st.page === 'log',", "isOverview: st.page === 'overview', isDisc: false, isInst: false, isAch: st.page === 'ach', isLog: st.page === 'log',"],
  ["showAnalysis: st.page === 'overview' || (st.page === 'inst' && instSel),", "showAnalysis: st.page === 'overview',"],
  ["discVal: String(F.d), discOpts: discOpts, onDisc: (ev) => setF({ d: +ev.target.value }),", "discVal: dSel.length === DISC.length ? ['-1'] : dSel.map(String), discOpts: discOpts, onDisc: (ev) => { const v = +ev.target.value; if (v < 0) return setF({ ds: DISC.map((_, i) => i) }); const vals = dSel.includes(v) ? dSel.filter((x) => x !== v) : dSel.concat(v); setF({ ds: vals }); },"],
  ["instVal: String(F.i), instOpts: instOpts, onInst: (ev) => setF({ i: +ev.target.value }),", "instVal: iSel.length === instAll.length ? ['-1'] : iSel.map(String), instOpts: instOpts, onInst: (ev) => { const v = +ev.target.value; if (v < 0) return setF({ is: instAll.map(([i]) => i) }); const vals = iSel.includes(v) ? iSel.filter((x) => x !== v) : iSel.concat(v); setF({ is: vals }); }, discOpen: st.discOpen, instOpen: st.instOpen, discQ: st.discQ || '', instQFilter: st.instQFilter || '', toggleDiscMenu: () => this.setState({ discOpen: !st.discOpen, instOpen: false }), toggleInstMenu: () => this.setState({ instOpen: !st.instOpen, discOpen: false }), onDiscQ: (ev) => this.setState({ discQ: ev.target.value }), onInstQ: (ev) => this.setState({ instQFilter: ev.target.value }), clearDiscFilter: () => setF({ d: -1, ds: [] }), clearInstFilter: () => setF({ i: -1, is: [] }), discLabel: dSel.length ? (dSel.length === 1 ? DISC[dSel[0]] : dSel.length + ' selected') : 'All disciplines', instLabel: iSel.length ? (iSel.length === 1 ? INST[iSel[0]] : iSel.length + ' selected') : 'All instructors (' + instAll.length + ')', onDiscOption: (v) => { const n = +v; const vals = dSel.includes(n) ? dSel.filter((x) => x !== n) : dSel.concat(n); setF({ ds: vals }); }, onInstOption: (v) => { const n = +v; const vals = iSel.includes(n) ? iSel.filter((x) => x !== n) : iSel.concat(n); setF({ is: vals }); },"],
  ["\"discVal\", \"discOpts\", \"onDisc\", \"instVal\", \"instOpts\", \"onInst\",", "\"discVal\", \"discOpts\", \"onDisc\", \"instVal\", \"instOpts\", \"onInst\", \"discOpen\", \"instOpen\", \"discQ\", \"instQFilter\", \"toggleDiscMenu\", \"toggleInstMenu\", \"onDiscQ\", \"onInstQ\", \"clearDiscFilter\", \"clearInstFilter\", \"discLabel\", \"instLabel\", \"onDiscOption\", \"onInstOption\", "],
  ["<template v-if=\\\"isInst\\\"><div style=\\\"display: flex; flex-direction: column; gap: 4px\\\"><label for=\\\"f-inst\\\"", "<template v-if=\\\"isOverview\\\"><div style=\\\"display: flex; flex-direction: column; gap: 4px\\\"><label for=\\\"f-inst\\\""],
  ["<select id=\\\"f-disc\\\" :value=\\\"discVal\\\" @change=\\\"onDisc\\\"", "<select id=\\\"f-disc\\\" multiple size=\\\"1\\\" :value=\\\"discVal\\\" @change=\\\"onDisc\\\""],
  ["<select id=\\\"f-inst\\\" :value=\\\"instVal\\\" @change=\\\"onInst\\\"", "<select id=\\\"f-inst\\\" multiple size=\\\"1\\\" :value=\\\"instVal\\\" @change=\\\"onInst\\\""],
];
for (const [from, to] of transforms) {
  if (!source.includes(from)) throw new Error(`Report transform did not match: ${from.slice(0, 80)}`);
  source = source.replace(from, to);
}
const replaceFilterControl = (id, menu) => {
  const start = source.indexOf(String.raw`<select id=\"${id}\"`);
  const endToken = String.raw`<\/select>`;
  const end = source.indexOf(endToken, start);
  if (start < 0 || end < 0) throw new Error(`Report ${id} control was not found`);
  source = source.slice(0, start) + JSON.stringify(menu).slice(1, -1) + source.slice(end + endToken.length);
};
replaceFilterControl('f-disc', `<div style="position: relative; min-width: 210px"><button type="button" @click="toggleDiscMenu" :aria-expanded="discOpen" aria-controls="f-disc-menu" style="min-height: 44px; width: 100%; padding: 0 12px; border-radius: 10px; background: #FFFFFF; color: #181A1D; border: 1px solid #C9CDD3; font: inherit; font-size: 14px; text-align: left; cursor: pointer">{{discLabel}}</button><div v-if="discOpen" id="f-disc-menu" role="group" aria-label="Discipline filter" style="position: absolute; z-index: 20; top: 48px; left: 0; width: 280px; max-height: 360px; overflow: auto; padding: 8px; border: 1px solid #C9CDD3; border-radius: 10px; background: #FFFFFF; box-shadow: 0 8px 24px rgba(24,26,29,.16)" @click.stop><button type="button" @click="clearDiscFilter" :disabled="!discVal.length" style="display: block; margin-bottom: 8px; padding: 4px 0; border: 0; background: transparent; color: #C8102E; font: inherit; font-size: 12px; cursor: pointer">Clear filter</button><input type="search" :value="discQ" @input="onDiscQ" placeholder="Search Discipline" aria-label="Search Discipline" autocomplete="off" style="display: block; width: 100%; box-sizing: border-box; margin-bottom: 8px; padding: 7px 8px; border: 1px solid #C9CDD3; border-radius: 7px; font: inherit; font-size: 13px"><label v-for="o in discOpts.filter((x) => String(x.v) !== '-1' && String(x.t).toLowerCase().includes(String(discQ).toLowerCase()))" :key="o.v" style="display: flex; align-items: center; gap: 8px; padding: 7px 6px; font-size: 13px; cursor: pointer"><input type="checkbox" :checked="discVal.includes(o.v)" @change="onDiscOption(o.v)"> {{o.t}}</label></div></div>`);
replaceFilterControl('f-inst', `<div style="position: relative; min-width: 240px"><button type="button" @click="toggleInstMenu" :aria-expanded="instOpen" aria-controls="f-inst-menu" style="min-height: 44px; width: 100%; padding: 0 12px; border-radius: 10px; background: #FFFFFF; color: #181A1D; border: 1px solid #C9CDD3; font: inherit; font-size: 14px; text-align: left; cursor: pointer">{{instLabel}}</button><div v-if="instOpen" id="f-inst-menu" role="group" aria-label="Instructor filter" style="position: absolute; z-index: 20; top: 48px; left: 0; width: 300px; max-height: 360px; overflow: auto; padding: 8px; border: 1px solid #C9CDD3; border-radius: 10px; background: #FFFFFF; box-shadow: 0 8px 24px rgba(24,26,29,.16)" @click.stop><button type="button" @click="clearInstFilter" :disabled="!instVal.length" style="display: block; margin-bottom: 8px; padding: 4px 0; border: 0; background: transparent; color: #C8102E; font: inherit; font-size: 12px; cursor: pointer">Clear filter</button><input type="search" :value="instQFilter" @input="onInstQ" placeholder="Search Instructor" aria-label="Search Instructor" autocomplete="off" style="display: block; width: 100%; box-sizing: border-box; margin-bottom: 8px; padding: 7px 8px; border: 1px solid #C9CDD3; border-radius: 7px; font: inherit; font-size: 13px"><label v-for="o in instOpts.filter((x) => String(x.v) !== '-1' && String(x.t).toLowerCase().includes(String(instQFilter).toLowerCase()))" :key="o.v" style="display: flex; align-items: center; gap: 8px; padding: 7px 6px; font-size: 13px; cursor: pointer"><input type="checkbox" :checked="instVal.includes(o.v)" @change="onInstOption(o.v)"> {{o.t}}</label></div></div>`);
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
const template = JSON.parse(String.fromCharCode(34) + source.slice(valueStart, valueEnd) + String.fromCharCode(34));
const compiled = compile(template, { mode: "function", prefixIdentifiers: false });
const render = "(function(){" + compiled.code + "})()";
const result = source.slice(0, start) + "    render: " + render + source.slice(valueEnd + 1);
const runtime = "vendor/vue.global.prod.js";
const runtimeOnly = "vendor/vue.runtime.global.prod.js";
const runtimeSource = fs.readFileSync(new URL("../docs/vendor/vue.runtime.global.prod.js", import.meta.url), "utf8");
const externalRuntime = result.replace(runtime, runtimeOnly);
const appMatch = [...externalRuntime.matchAll(/<script(?:\s[^>]*)?>\r?\n([\s\S]*?)\r?\n<\/script>/g)].find((match) => match[1].includes("Component.prototype.fetchLive"));
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
