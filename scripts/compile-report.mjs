import fs from "node:fs";
import { compile } from "@vue/compiler-dom";
const input = process.argv[2] ?? "docs/index.html";
const output = process.argv[3] ?? input;
const source = fs.readFileSync(input, "utf8");
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
const runtimeTag = "<script>\n" + runtimeSource + "\n</script>";
const compiled = result.replace(runtime, runtimeOnly).replace("<script src=\"" + runtimeOnly + "\"></script>", runtimeTag);
fs.writeFileSync(output, compiled);

