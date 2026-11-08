// Builds a self-contained HTML documentation file (no external assets, real text,
// vector visuals) and downloads it. Printing it from the browser also yields a PDF.
import { renderToStaticMarkup } from 'react-dom/server';
import { loadReportData } from './reportData';
import type { SectionId } from './reportData';
import { ReportDocument, reportOutline } from './ReportPages';

/** Collects every CSS custom property name declared anywhere in the app's stylesheets. */
function customPropertyNames(rules: CSSRuleList, into: Set<string>) {
  for (const rule of Array.from(rules)) {
    if (rule instanceof CSSStyleRule) {
      for (let i = 0; i < rule.style.length; i++) {
        const n = rule.style[i];
        if (n.startsWith('--')) into.add(n);
      }
    }
    const nested = (rule as CSSGroupingRule).cssRules;
    if (nested) customPropertyNames(nested, into);
  }
}

/**
 * The light-theme values of all design tokens, as a :root block. The values are read from a
 * probe element forced to the light theme, so this works whatever the selectors look like
 * after minification and regardless of the theme the user is currently in.
 */
function themeCss(): string {
  const names = new Set<string>();
  for (const sheet of Array.from(document.styleSheets)) {
    try { customPropertyNames(sheet.cssRules, names); } catch { /* cross-origin sheet */ }
  }
  const probe = document.createElement('div');
  probe.setAttribute('data-theme', 'light');
  document.body.appendChild(probe);
  const cs = getComputedStyle(probe);
  const decls = [...names].map(n => [n, cs.getPropertyValue(n).trim()]).filter(([, v]) => v).map(([n, v]) => `${n}:${v}`);
  probe.remove();
  return `:root{${decls.join(';')}}`;
}

const esc = (t: string) => t.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));

const STYLES = `
*{box-sizing:border-box}
body{margin:0;background:#f4f6f9;color:#1a2433;font:14px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
.rp-layout{display:flex;align-items:flex-start;max-width:1500px;margin:0 auto}
.rp-toc{position:sticky;top:0;width:260px;flex-shrink:0;max-height:100vh;overflow:auto;padding:24px 16px;font-size:13px}
.rp-toc h1{font-size:15px;margin:0 0 12px}
.rp-toc a{display:block;padding:3px 0;color:#334155;text-decoration:none}
.rp-toc a:hover{color:#1d4ed8}
.rp-toc .grp{margin:12px 0 2px;font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#64748b}
.rp-main{flex:1;min-width:0;padding:24px}
.rp-section{background:#fff;border:1px solid #d7dde5;border-radius:8px;padding:22px 26px;margin-bottom:20px}
.rp-section h2{margin:0 0 14px;font-size:20px;border-bottom:2px solid #1a2433;padding-bottom:8px}
.rp-eyebrow{font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#5b6676}
.rp-scroll{overflow:auto;max-width:100%;padding-bottom:4px}
table{border-collapse:collapse}
.rp-foot{font-size:11px;color:#64748b;padding:0 0 32px}
@page{size:A4 landscape;margin:12mm}
@media print{
  body{background:#fff}.rp-toc{display:none}.rp-layout{display:block}.rp-main{padding:0}
  .rp-section{border:none;border-radius:0;padding:0;margin:0 0 8mm;break-inside:auto}
  .rp-section h2,.rp-scroll{break-after:avoid}
  .rp-scroll{overflow:visible}
  tr,svg{break-inside:avoid}
}
`;

export async function exportDocumentationHtml(projectId: string, sections: SectionId[]): Promise<void> {
  const data = await loadReportData(projectId);
  const set = new Set(sections);
  const body = renderToStaticMarkup(<ReportDocument data={data} sections={set} />);

  // Strip the interactive controls of reused components (add / delete / zoom).
  const doc = new DOMParser().parseFromString(`<div id="r">${body}</div>`, 'text/html');
  doc.querySelectorAll('button, [data-export-skip]').forEach(n => n.remove());
  const content = doc.getElementById('r')?.innerHTML ?? body;

  let lastGroup = '';
  const toc = reportOutline(data, set).map(o => {
    const grp = o.section !== lastGroup ? `<div class="grp">${esc(o.section)}</div>` : '';
    lastGroup = o.section;
    return `${grp}<a href="#${o.id}">${esc(o.title)}</a>`;
  }).join('');

  const title = data.manifest.title;
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} – documentation</title>
<style>${themeCss()}</style><style>${STYLES}</style></head>
<body><div class="rp-layout">
<nav class="rp-toc"><h1>${esc(title)}</h1>${toc}</nav>
<main class="rp-main">${content}<div class="rp-foot">Generated ${new Date().toLocaleString()} with Process Insight. Use your browser's Print → Save as PDF for a PDF copy.</div></main>
</div></body></html>`;

  const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.replace(/[^a-z0-9]/gi, '-').toLowerCase() || 'project'}-documentation.html`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
