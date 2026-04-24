#!/usr/bin/env node

/**
 * Design Token Page Generator
 * 讀取 design token JSON 檔案 + checklist.md，產出可瀏覽的 HTML 展示頁面（含互動式審核清單）
 *
 * Usage: node generate-tokens-page.js <token-json-path> [output-html-path]
 */

const fs = require("fs");
const path = require("path");

const tokenPath = process.argv[2];
const outputPath = process.argv[3] || "design-tokens.html";

if (!tokenPath) {
  console.error("Usage: node generate-tokens-page.js <token-json-path> [output-html-path]");
  process.exit(1);
}

const raw = fs.readFileSync(path.resolve(tokenPath), "utf-8");
const tokens = JSON.parse(raw);

/* ── parse checklist.md ──────────────────────────────────── */

const checklistPath = path.resolve(__dirname, "../references/checklist.md");
let checklistSections = [];

if (fs.existsSync(checklistPath)) {
  const md = fs.readFileSync(checklistPath, "utf-8");
  const lines = md.split(/\r?\n/);
  let currentSection = null;
  let currentSubsection = null;
  let itemId = 0;

  for (const line of lines) {
    // ## section header
    const h2 = line.match(/^## \d+\.\s*(.+)/);
    if (h2) {
      currentSection = { title: h2[1].trim(), subsections: [] };
      currentSubsection = null;
      checklistSections.push(currentSection);
      continue;
    }
    // ### subsection header
    const h3 = line.match(/^### (.+)/);
    if (h3 && currentSection) {
      currentSubsection = { title: h3[1].trim(), items: [] };
      currentSection.subsections.push(currentSubsection);
      continue;
    }
    // - [ ] item (top level or indented)
    const item = line.match(/^(\s*)- \[ \] (.+)/);
    if (item && currentSection) {
      const depth = item[1].length >= 2 ? 1 : 0; // indented = sub-item
      const text = item[2].trim();
      const required = currentSubsection && /必要/.test(currentSubsection.title);
      if (currentSubsection) {
        currentSubsection.items.push({ id: itemId++, text, depth, required });
      }
    }
  }
}

/* ── helpers ─────────────────────────────────────────────── */

function contrastRatio(hex1, hex2) {
  const lum = (hex) => {
    const rgb = hex.replace("#", "").match(/.{2}/g).map((c) => {
      let v = parseInt(c, 16) / 255;
      return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  };
  const l1 = lum(hex1), l2 = lum(hex2);
  const lighter = Math.max(l1, l2), darker = Math.min(l1, l2);
  return ((lighter + 0.05) / (darker + 0.05)).toFixed(2);
}

function isHex(v) { return typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v); }

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/* ── section renderers ───────────────────────────────────── */

function renderColorGroup(groupName, group) {
  const desc = group.$description ? `<p class="group-desc">${esc(group.$description)}</p>` : "";
  let html = `<div class="token-group"><h3>${esc(groupName)}</h3>${desc}<div class="color-grid">`;
  for (const [name, val] of Object.entries(group)) {
    if (name.startsWith("$")) continue; // skip meta keys
    if (val && val.$value && val.$type === "color") {
      const hex = val.$value;
      const isMissing = val.$status === "missing" || !isHex(hex);
      if (isMissing) {
        html += `
        <div class="color-swatch color-missing">
          <span class="swatch-name">${esc(name)}</span>
          <span class="swatch-value">${esc(hex)}</span>
        </div>`;
      } else {
        const textColor = contrastRatio(hex, "#FFFFFF") > 3 ? "#FFFFFF" : "#000000";
        const ratio = contrastRatio(hex, "#FFFFFF");
        const passAA = parseFloat(ratio) >= 4.5;
        html += `
        <div class="color-swatch" style="background:${esc(hex)}; color:${textColor}">
          <span class="swatch-name">${esc(name)}</span>
          <span class="swatch-value">${esc(hex)}</span>
          <span class="swatch-contrast" title="Contrast vs #FFF">${ratio}:1 ${passAA ? "✅" : "⚠️"}</span>
        </div>`;
      }
    } else if (val && typeof val === "object" && !val.$value) {
      html += `</div>${renderColorGroup(groupName + " / " + name, val)}`;
    }
  }
  html += `</div></div>`;
  return html;
}

function renderTypography(typo) {
  let html = `<div class="token-group"><h3>Typography</h3>`;

  if (typo.fontFamily) {
    html += `<h4>Font Family</h4><table><thead><tr><th>Token</th><th>Value</th><th>Description</th></tr></thead><tbody>`;
    for (const [name, val] of Object.entries(typo.fontFamily)) {
      if (val && val.$value) html += `<tr><td>fontFamily.${esc(name)}</td><td style="font-family:${esc(val.$value)}">${esc(val.$value)}</td><td>${esc(val.$description || "")}</td></tr>`;
    }
    html += `</tbody></table>`;
  }

  if (typo.fontSize) {
    const fsDesc = typo.fontSize.$description ? `<p class="group-desc">${esc(typo.fontSize.$description)}</p>` : "";
    html += `<h4>Font Size Scale</h4>${fsDesc}<table><thead><tr><th>Token</th><th>Size</th><th>Mobile</th><th>Weight</th><th>Preview</th></tr></thead><tbody>`;
    for (const [name, val] of Object.entries(typo.fontSize)) {
      if (name.startsWith("$")) continue;
      if (val && val.$value) {
        const mobile = val.$mobile || "—";
        const weight = val.$weight || "";
        html += `<tr><td>${esc(name)}</td><td>${esc(val.$value)}</td><td>${esc(mobile)}</td><td>${weight || "—"}</td><td style="font-size:${esc(val.$value)}; font-weight:${weight || 400}; line-height:1.4; max-width:350px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">The quick brown fox 敏捷的棕色狐狸</td></tr>`;
      }
    }
    html += `</tbody></table>`;
  }

  if (typo.fontWeight) {
    html += `<h4>Font Weight</h4><div class="type-scale">`;
    for (const [name, val] of Object.entries(typo.fontWeight)) {
      if (name.startsWith("$")) continue;
      if (val && val.$value != null) {
        html += `<div class="type-sample" style="font-weight:${val.$value}"><span class="type-label">${esc(name)} — ${val.$value}</span> The quick brown fox 敏捷的棕色狐狸</div>`;
      }
    }
    html += `</div>`;
  }

  if (typo.lineHeight) {
    const lhDesc = typo.lineHeight.$description ? `<p class="group-desc">${esc(typo.lineHeight.$description)}</p>` : "";
    html += `<h4>Line Height</h4>${lhDesc}<table><thead><tr><th>Token</th><th>Value</th><th>Preview</th></tr></thead><tbody>`;
    for (const [name, val] of Object.entries(typo.lineHeight)) {
      if (name.startsWith("$")) continue;
      if (val && val.$value != null) {
        const fontSize = typo.fontSize && typo.fontSize[name] ? typo.fontSize[name].$value : "16px";
        html += `<tr><td>lineHeight.${esc(name)}</td><td>${esc(String(val.$value))}</td><td style="font-size:${fontSize}; line-height:${val.$value}; border-left:3px solid var(--c-primary); padding-left:8px;">Line 1<br>Line 2</td></tr>`;
      }
    }
    html += `</tbody></table>`;
  }

  html += `</div>`;
  return html;
}

function renderSpacing(spacing) {
  const scale = spacing.scale || spacing;
  const statusBadge = spacing.$status === "missing" ? `<span class="status-badge status-missing">⚠️ 設計稿未定義 — 建議值</span>` : "";
  const desc = spacing.$description ? `<p class="group-desc">${esc(spacing.$description)}</p>` : "";
  let html = `<div class="token-group"><h3>Spacing ${statusBadge}</h3>${desc}`;
  if (spacing.unit && spacing.unit.$value) html += `<p>Base unit: <strong>${esc(spacing.unit.$value)}</strong></p>`;
  html += `<div class="spacing-grid">`;
  for (const [name, val] of Object.entries(scale)) {
    if (val && val.$value) {
      html += `
        <div class="spacing-item">
          <div class="spacing-bar" style="width:${esc(val.$value)}; min-width:4px;"></div>
          <span class="spacing-label">${esc(name)} — ${esc(val.$value)}</span>
        </div>`;
    }
  }
  html += `</div></div>`;
  return html;
}

function renderBorderRadius(br) {
  const statusBadge = br.$status === "missing" ? `<span class="status-badge status-missing">⚠️ 設計稿未定義 — 建議值</span>` : "";
  const desc = br.$description ? `<p class="group-desc">${esc(br.$description)}</p>` : "";
  let html = `<div class="token-group"><h3>Border Radius ${statusBadge}</h3>${desc}<div class="radius-grid">`;
  for (const [name, val] of Object.entries(br)) {
    if (name.startsWith("$")) continue;
    if (val && val.$value) {
      html += `
        <div class="radius-item">
          <div class="radius-box" style="border-radius:${esc(val.$value)}"></div>
          <span>${esc(name)} — ${esc(val.$value)}</span>
        </div>`;
    }
  }
  html += `</div></div>`;
  return html;
}

function renderShadow(sh) {
  const desc = sh.$description ? `<p class="group-desc">${esc(sh.$description)}</p>` : "";
  let html = `<div class="token-group"><h3>Shadows / Elevation</h3>${desc}<div class="shadow-grid">`;
  for (const [name, val] of Object.entries(sh)) {
    if (name.startsWith("$")) continue;
    if (val && val.$value) {
      const statusLabel = val.$status === "suggested" ? `<span class="status-badge status-suggested">建議補充</span>` : val.$status === "from-design" ? `<span class="status-badge status-from-design">來自設計稿</span>` : "";
      html += `
        <div class="shadow-item" style="box-shadow:${val.$value}">
          <strong>${esc(name)}</strong> ${statusLabel}
          <code>${esc(val.$value)}</code>
        </div>`;
    }
  }
  html += `</div></div>`;
  return html;
}

/* ── checklist renderer ──────────────────────────────────── */

function renderChecklist() {
  if (!checklistSections.length) return "";

  let totalRequired = 0;
  let totalOptional = 0;
  for (const sec of checklistSections) {
    for (const sub of sec.subsections) {
      for (const item of sub.items) {
        if (item.depth === 0) { // only count top-level items for stats
          if (item.required) totalRequired++;
          else totalOptional++;
        }
      }
    }
  }

  let html = `
  <section id="checklist">
    <h2>設計系統審核清單</h2>
    <p style="color:#757575; margin-bottom:1rem;">勾選已完成的項目以追蹤設計系統完整度。進度會自動儲存在瀏覽器中。</p>

    <div class="checklist-progress">
      <div class="progress-stats">
        <div class="progress-stat">
          <span class="progress-label">必要項目</span>
          <span class="progress-value" id="progress-required">0 / ${totalRequired}</span>
        </div>
        <div class="progress-stat">
          <span class="progress-label">建議項目</span>
          <span class="progress-value" id="progress-optional">0 / ${totalOptional}</span>
        </div>
        <div class="progress-stat">
          <span class="progress-label">總完成度</span>
          <span class="progress-value" id="progress-total">0%</span>
        </div>
      </div>
      <div class="progress-bar-track">
        <div class="progress-bar-fill" id="progress-bar" style="width:0%"></div>
      </div>
      <button class="btn-reset" onclick="resetChecklist()">重置所有勾選</button>
    </div>`;

  for (const sec of checklistSections) {
    const sectionSlug = "sec-" + sec.title.replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, "-");
    html += `
    <div class="checklist-section" id="${esc(sectionSlug)}">
      <h3 class="checklist-section-title" onclick="this.parentElement.classList.toggle('collapsed')">
        <span class="collapse-icon">▼</span>
        ${esc(sec.title)}
        <span class="section-badge" data-section="${esc(sectionSlug)}"></span>
      </h3>
      <div class="checklist-section-body">`;

    for (const sub of sec.subsections) {
      html += `<h4 class="checklist-sub-title">${esc(sub.title)}</h4><ul class="checklist-items">`;
      for (const item of sub.items) {
        const indent = item.depth > 0 ? " checklist-indent" : "";
        const reqClass = item.required ? " item-required" : " item-optional";
        html += `
          <li class="checklist-item${indent}${reqClass}">
            <label>
              <input type="checkbox" data-id="${item.id}" data-required="${item.required ? 1 : 0}" data-depth="${item.depth}" onchange="onCheckChange()">
              <span class="checkmark"></span>
              <span class="item-text">${esc(item.text).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')}</span>
              ${item.required && item.depth === 0 ? '<span class="badge-required">必要</span>' : ""}
            </label>
          </li>`;
      }
      html += `</ul>`;
    }

    html += `</div></div>`;
  }

  html += `</section>`;
  return html;
}

/* ── spec audit renderer ──────────────────────────────────── */

function renderSpecAudit(specs) {
  if (!specs || !specs.length) return "";

  // count stats
  let totalPass = 0, totalWarn = 0, totalFail = 0;
  for (const sp of specs) {
    for (const f of sp.findings) {
      if (f.s === "pass") totalPass++;
      else if (f.s === "warn") totalWarn++;
      else totalFail++;
    }
  }

  const statusIcon = { pass: "✅", warn: "⚠️", fail: "❌" };
  const statusClass = { pass: "finding-pass", warn: "finding-warn", fail: "finding-fail" };
  const typeLabel = { "component-spec": "元件規格", "page-mockup": "頁面設計稿" };

  let html = `<section id="spec-audit"><h2>逐稿審核結果</h2>
    <div class="spec-stats">
      <span class="spec-stat spec-stat-pass">✅ 通過 <strong>${totalPass}</strong></span>
      <span class="spec-stat spec-stat-warn">⚠️ 注意 <strong>${totalWarn}</strong></span>
      <span class="spec-stat spec-stat-fail">❌ 缺漏 <strong>${totalFail}</strong></span>
    </div>`;

  for (const sp of specs) {
    const pass = sp.findings.filter(f => f.s === "pass").length;
    const warn = sp.findings.filter(f => f.s === "warn").length;
    const fail = sp.findings.filter(f => f.s === "fail").length;
    const label = typeLabel[sp.type] || sp.type;
    const cardClass = fail > 0 ? "spec-card-has-fail" : warn > 0 ? "spec-card-has-warn" : "spec-card-all-pass";

    html += `
    <div class="spec-card ${cardClass}">
      <div class="spec-card-header" onclick="this.parentElement.classList.toggle('spec-collapsed')">
        <span class="spec-collapse-icon">▼</span>
        <div class="spec-card-title">
          <strong>${esc(sp.file)}</strong>
          <span class="spec-type-badge">${esc(label)}</span>
        </div>
        <div class="spec-card-counts">
          ${pass ? `<span class="sc-pass">${pass}✅</span>` : ""}
          ${warn ? `<span class="sc-warn">${warn}⚠️</span>` : ""}
          ${fail ? `<span class="sc-fail">${fail}❌</span>` : ""}
        </div>
      </div>
      <p class="spec-summary">${esc(sp.summary)}</p>
      <div class="spec-card-body">
      <div class="spec-img-wrap">
        <img class="spec-img" src="../design-specs/${encodeURIComponent(sp.file)}" alt="${esc(sp.file)}" loading="lazy" onclick="openSpecImg(this)">
      </div>
      <ul class="spec-findings">`;

    for (const f of sp.findings) {
      html += `<li class="${statusClass[f.s]}">${statusIcon[f.s]} ${esc(f.t)}</li>`;
    }

    html += `</ul></div></div>`;
  }

  html += `</section>`;
  return html;
}

/* ── assemble page ───────────────────────────────────────── */

let auditSections = "";
let tokenSections = "";
let checklistHtml = "";

// Audit summary
if (tokens.$audit) {
  const a = tokens.$audit;
  auditSections += `<section id="audit-summary"><h2>審核摘要</h2>
    <div class="audit-card">
      <p><strong>審核日期：</strong>${esc(a.date || "—")}</p>
      <p><strong>來源檔案：</strong></p>
      <ul style="font-size:.8125rem; margin:.25rem 0 .75rem 1.25rem; color:#616161;">${(a.sources || []).map(s => `<li>${esc(s)}</li>`).join("")}</ul>
      ${a.notes ? `<p class="audit-notes">⚠️ ${esc(a.notes)}</p>` : ""}
      <table class="audit-table">
        <thead><tr><th>#</th><th>類別</th><th>狀態</th><th>說明</th></tr></thead>
        <tbody>
          <tr><td>1</td><td>色彩系統</td><td>⚠️ 部分缺漏</td><td><ul><li>主色×2（teal green + orange）9 階完整 + 灰階 9 階 ✅</li><li>背景/前景配對已從 WEB 頁面補充 ✅</li><li>缺 success/info 語意色</li><li>warning 僅從頁面觀察到橘色標籤</li><li>danger 無變體</li></ul></td></tr>
          <tr><td>2</td><td>字體系統</td><td>⚠️ 部分缺漏</td><td><ul><li>Noto Sans TC + Geologica 已指定 ✅</li><li>H1–H6 + Body 含行高與 mobile size ✅</li><li>WEB 頁面驗證字級層級一致 ✅</li><li>缺 Caption/Overline</li><li>無 fallback 字型</li></ul></td></tr>
          <tr><td>3</td><td>間距系統</td><td>⚠️ 部分缺漏</td><td><ul><li>設計稿未正式定義</li><li>WEB 頁面觀察到一致的 8px 基準間距模式</li><li>JSON 中為建議值</li></ul></td></tr>
          <tr><td>4</td><td>圓角</td><td>⚠️ 部分缺漏</td><td><ul><li>WEB 頁面觀察到 4-5 種圓角值（4px/8px/12px/膠囊/圓形）</li><li>缺乏正式 token 定義</li><li>按鈕圓角語言不統一（查詢 8px vs Header 膠囊）</li></ul></td></tr>
          <tr><td>5</td><td>陰影</td><td>⚠️ 部分缺漏</td><td><ul><li>設計稿僅定義 $medium 1 級</li><li>WEB 頁面整體走扁平設計風格，陰影極輕</li><li>low/high 為建議補充</li></ul></td></tr>
          <tr><td>6</td><td>按鈕狀態</td><td>⚠️ 部分缺漏</td><td><ul><li>Button.png 有 Primary/Secondary filled+outlined + Disabled ✅</li><li>WEB 頁面確認實際使用 ✅</li><li>❌ 全部頁面皆僅見 Default 狀態</li><li>缺 Hover/Active/Focus ring/Loading/Danger</li></ul></td></tr>
          <tr><td>7</td><td>表單狀態</td><td>⚠️ 部分缺漏</td><td><ul><li>WEB_會員登入有搜尋框 + 帳號/密碼/驗證碼欄位 ✅</li><li>WEB_一般會員02 有手機輸入框 + Error 文字 ✅</li><li>❌ 缺 Focus/Disabled/Success 狀態</li><li>Error 僅有文字無紅色邊框</li></ul></td></tr>
          <tr><td>8</td><td>無障礙</td><td>❌ 嚴重缺漏</td><td><ul><li>白色文字 on 綠色按鈕對比度約 3:1 未達 AA 4.5:1</li><li>全部頁面無 Focus indicator</li><li>Hero 白字在圖片上對比不足</li><li>CAPTCHA 無替代方案</li><li>連結僅靠顏色無底線</li></ul></td></tr>
          <tr><td>9</td><td>圖示系統</td><td>⚠️ 部分缺漏</td><td><ul><li>WEB 頁面大量使用 Outline 線性圖示 ✅</li><li>混用 Filled + Emoji 風格 ⚠️</li><li>約 16/20/24px 三種尺寸</li><li>缺正式規範</li></ul></td></tr>
          <tr><td>10</td><td>風格一致性</td><td>⚠️ 部分缺漏</td><td><ul><li>整體綠色品牌調性統一 ✅</li><li>4 張 WEB 頁面視覺語言一致 ✅</li><li>圓角/圖示風格混用需統一 ⚠️</li></ul></td></tr>
        </tbody>
      </table>
    </div>
  </section>`;

  // Per-spec audit results
  if (a.specs) {
    auditSections += renderSpecAudit(a.specs);
  }

  // Checklist as separate tab
  checklistHtml = renderChecklist();
}

if (tokens.color) {
  tokenSections += `<section id="colors"><h2>Color System</h2><div class="section-card">`;
  for (const [groupName, group] of Object.entries(tokens.color)) {
    if (group && typeof group === "object") tokenSections += renderColorGroup(groupName, group);
  }
  tokenSections += `</div></section>`;
}

if (tokens.typography) {
  tokenSections += `<section id="typography"><h2>Typography</h2><div class="section-card">${renderTypography(tokens.typography)}</div></section>`;
}

if (tokens.spacing) {
  tokenSections += `<section id="spacing"><h2>Spacing</h2><div class="section-card">${renderSpacing(tokens.spacing)}</div></section>`;
}

if (tokens.borderRadius) {
  tokenSections += `<section id="border-radius"><h2>Border Radius</h2><div class="section-card">${renderBorderRadius(tokens.borderRadius)}</div></section>`;
}

if (tokens.shadow) {
  tokenSections += `<section id="shadows"><h2>Shadows</h2><div class="section-card">${renderShadow(tokens.shadow)}</div></section>`;
}

const projectName = tokens.$name || "Design Tokens";

const html = `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(projectName)} — 設計系統基礎規範與檢核</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&display=swap" rel="stylesheet">
<style>
  :root {
    --c-primary: #2E7D5B;
    --c-primary-light: #E8F5EE;
    --c-primary-soft: #D4EDDA;
    --c-accent: #D4853A;
    --c-accent-light: #FFF4EB;
    --c-bg: #FAFBF9;
    --c-surface: #FFFFFF;
    --c-text: #333333;
    --c-text-secondary: #6B7280;
    --c-border: #E8ECE6;
    --c-danger: #DC3D5A;
    --c-danger-light: #FEF2F4;
    --c-warning: #E65100;
    --c-warning-light: #FFF8E1;
    --c-success: #2E7D32;
    --c-success-light: #E8F5E9;
    --radius-sm: 12px;
    --radius-md: 20px;
    --radius-lg: 32px;
    --radius-pill: 9999px;
    --shadow-soft: 0 2px 16px rgba(0,0,0,.05);
    --shadow-card: 0 4px 24px rgba(0,0,0,.06);
    --shadow-hover: 0 8px 32px rgba(0,0,0,.10);
    --section-gap: 3.5rem;
  }
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Noto Sans TC', 'Inter', system-ui, sans-serif; color: var(--c-text); background: var(--c-bg); line-height: 1.7; padding: 2.5rem; max-width: 1200px; margin: 0 auto; }

  /* decorative organic shapes */
  body::before, body::after {
    content: ''; position: fixed; border-radius: 50%; opacity: .06; pointer-events: none; z-index: -1;
  }
  body::before { width: 400px; height: 400px; background: var(--c-primary); top: -120px; right: -100px; }
  body::after { width: 300px; height: 300px; background: var(--c-accent); bottom: -80px; left: -60px; }

  h1 { font-size: 2rem; font-weight: 700; margin-bottom: .5rem; letter-spacing: -.01em; }
  .meta { color: var(--c-text-secondary); margin-bottom: var(--section-gap); font-size: .875rem; }
  .page-subtitle { font-size: 1.125rem; font-weight: 500; color: var(--c-primary); margin-bottom: .375rem; letter-spacing: -.01em; }
  h2 { font-size: 1.5rem; font-weight: 700; margin: 2rem 0 1.5rem; padding-bottom: .75rem; border-bottom: 2px solid var(--c-primary-soft); letter-spacing: -.01em; }
  h3 { font-size: 1.125rem; font-weight: 600; margin: 1.5rem 0 1rem; text-transform: capitalize; }
  h4 { font-size: 1rem; font-weight: 600; margin: 1.25rem 0 .75rem; }

  /* audit */
  .audit-card { background: var(--c-surface); border-radius: var(--radius-lg); padding: 2rem; border: none; box-shadow: var(--shadow-card); }
  .audit-card p { margin-bottom: .625rem; font-size: .875rem; line-height: 1.7; }
  .audit-notes { background: var(--c-warning-light); border-left: 4px solid #FFA000; padding: .75rem 1rem; border-radius: var(--radius-sm); font-size: .8125rem; color: var(--c-warning); }
  .audit-table { margin-top: 1.5rem; }
  .audit-table td:nth-child(3) { white-space: nowrap; }
  .audit-table td:nth-child(4) { font-size: .8125rem; color: var(--c-text-secondary); }
  .audit-table td ul { margin: .25rem 0; padding-left: 1.25rem; list-style: disc; }
  .audit-table td li { padding: .15rem 0; line-height: 1.6; }

  /* tabs */
  .tab-bar { position: sticky; top: 0; background: var(--c-bg); z-index: 10; border-bottom: none; margin-bottom: 2rem; display: flex; gap: .5rem; padding: .5rem; background: var(--c-surface); border-radius: var(--radius-pill); box-shadow: var(--shadow-soft); }
  .tab-btn { background: none; border: none; padding: .75rem 2rem; font-size: .9375rem; font-weight: 600; color: var(--c-text-secondary); cursor: pointer; border-radius: var(--radius-pill); transition: all .2s ease; display: flex; align-items: center; gap: .5rem; }
  .tab-btn:hover { color: var(--c-text); background: var(--c-primary-light); }
  .tab-btn.active { color: #FFF; background: var(--c-primary); box-shadow: 0 2px 8px rgba(46,125,91,.25); }
  .tab-panel { display: none; }
  .tab-panel.active { display: block; }

  /* sub-nav inside tab */
  .sub-nav { display: flex; gap: .5rem; flex-wrap: wrap; margin-bottom: 2rem; padding: .5rem 0; }
  .sub-nav a { color: var(--c-text-secondary); text-decoration: none; font-size: .8125rem; font-weight: 500; padding: .5rem 1.25rem; border-radius: var(--radius-pill); background: var(--c-surface); box-shadow: var(--shadow-soft); transition: all .2s; }
  .sub-nav a:hover { background: var(--c-primary-light); color: var(--c-primary); transform: translateY(-1px); box-shadow: var(--shadow-card); }

  /* colors */
  .color-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 1rem; }
  .color-swatch { border-radius: var(--radius-md); padding: 1.25rem 1rem; min-height: 110px; display: flex; flex-direction: column; justify-content: flex-end; gap: .25rem; font-size: .75rem; transition: all .2s ease; box-shadow: var(--shadow-soft); }
  .color-swatch:hover { transform: translateY(-4px); box-shadow: var(--shadow-hover); }
  .swatch-name { font-weight: 600; font-size: .8125rem; }
  .swatch-contrast { opacity: .85; }

  /* typography */
  .type-scale { display: flex; flex-direction: column; gap: 1rem; }
  .type-sample { padding: .75rem 0; border-bottom: 1px solid var(--c-border); }
  .type-label { display: block; font-size: .75rem; color: var(--c-text-secondary); margin-bottom: .25rem; font-weight: 600; }

  /* spacing */
  .spacing-grid { display: flex; flex-direction: column; gap: .75rem; }
  .spacing-item { display: flex; align-items: center; gap: 1rem; }
  .spacing-bar { height: 28px; background: linear-gradient(90deg, var(--c-primary), var(--c-primary-soft)); border-radius: var(--radius-pill); opacity: .8; }
  .spacing-label { font-size: .8125rem; white-space: nowrap; font-weight: 500; }

  /* radius */
  .radius-grid { display: flex; gap: 2rem; flex-wrap: wrap; }
  .radius-item { text-align: center; font-size: .8125rem; font-weight: 500; }
  .radius-box { width: 88px; height: 88px; background: linear-gradient(135deg, var(--c-primary-light), var(--c-primary-soft)); border: 2px solid var(--c-primary); opacity: .75; margin-bottom: .75rem; }

  /* shadow */
  .shadow-grid { display: flex; gap: 2rem; flex-wrap: wrap; }
  .shadow-item { background: var(--c-surface); border-radius: var(--radius-lg); padding: 2rem; width: 240px; display: flex; flex-direction: column; gap: .625rem; transition: transform .2s; }
  .shadow-item:hover { transform: translateY(-2px); }
  .shadow-item code { font-size: .6875rem; color: var(--c-text-secondary); word-break: break-all; }

  /* tables */
  table { width: 100%; border-collapse: separate; border-spacing: 0; margin: 1rem 0; font-size: .875rem; background: var(--c-surface); border-radius: var(--radius-md); overflow: hidden; box-shadow: var(--shadow-soft); }
  th, td { text-align: left; padding: .75rem 1rem; border-bottom: 1px solid var(--c-border); }
  th { font-weight: 600; background: var(--c-primary-light); color: var(--c-primary); }
  tr:last-child td { border-bottom: none; }

  .section-card { background: var(--c-surface); border-radius: var(--radius-lg); padding: 2rem 2.5rem; box-shadow: var(--shadow-card); margin-bottom: 1rem; }
  .token-group { margin-bottom: 2.5rem; }
  .group-desc { font-size: .8125rem; color: var(--c-text-secondary); margin: .25rem 0 1rem; line-height: 1.7; }

  /* status badges */
  .status-badge { font-size: .6875rem; font-weight: 600; padding: .2rem .625rem; border-radius: var(--radius-pill); margin-left: .5rem; vertical-align: middle; white-space: nowrap; }
  .status-missing { background: var(--c-warning-light); color: var(--c-warning); }
  .status-suggested { background: #EDE7F6; color: #5E35B1; font-size: .625rem; }
  .status-from-design { background: var(--c-success-light); color: var(--c-success); font-size: .625rem; }

  /* missing color swatch */
  .color-missing { background: repeating-linear-gradient(45deg, #F8F8F8, #F8F8F8 10px, #F0F0F0 10px, #F0F0F0 20px); border: 2px dashed #D0D0D0; color: #9E9E9E; border-radius: var(--radius-md); }

  /* spec audit */
  .spec-stats { display: flex; gap: 1rem; margin-bottom: 2rem; }
  .spec-stat { font-size: .875rem; display: flex; align-items: center; gap: .5rem; padding: .75rem 1.5rem; border-radius: var(--radius-pill); background: var(--c-surface); box-shadow: var(--shadow-soft); border: none; }
  .spec-stat strong { font-size: 1.25rem; }
  .spec-stat-pass strong { color: var(--c-success); }
  .spec-stat-warn strong { color: var(--c-warning); }
  .spec-stat-fail strong { color: var(--c-danger); }

  .spec-card { background: var(--c-surface); border-radius: var(--radius-lg); margin-bottom: 1rem; border: none; box-shadow: var(--shadow-card); overflow: hidden; transition: transform .2s, box-shadow .2s; }
  .spec-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-hover); }
  .spec-card-has-fail { border-left: 5px solid var(--c-danger); }
  .spec-card-has-warn { border-left: 5px solid var(--c-accent); }
  .spec-card-all-pass { border-left: 5px solid #66BB6A; }
  .spec-card-header { display: flex; align-items: center; gap: .75rem; padding: 1.25rem 1.5rem; cursor: pointer; user-select: none; }
  .spec-card-header:hover { background: rgba(0,0,0,.015); }
  .spec-collapse-icon { font-size: .6rem; color: #B0B0B0; transition: transform .2s; }
  .spec-collapsed .spec-collapse-icon { transform: rotate(-90deg); }
  .spec-collapsed .spec-summary,
  .spec-collapsed .spec-card-body { display: none; }
  .spec-card-title { flex: 1; }
  .spec-card-title strong { font-size: .9375rem; }
  .spec-type-badge { font-size: .625rem; font-weight: 600; padding: .15rem .625rem; border-radius: var(--radius-pill); background: #F3E5F5; color: #7B1FA2; margin-left: .5rem; vertical-align: middle; }
  .spec-card-counts { display: flex; gap: .625rem; font-size: .75rem; white-space: nowrap; }
  .sc-pass { color: var(--c-success); }
  .sc-warn { color: var(--c-warning); }
  .sc-fail { color: var(--c-danger); font-weight: 600; }
  .spec-summary { font-size: .8125rem; color: var(--c-text-secondary); padding: 0 1.5rem .75rem; line-height: 1.7; }
  .spec-card-body { display: flex; gap: 1.5rem; padding: 0 1.5rem 1.5rem; align-items: flex-start; }
  .spec-img-wrap { flex-shrink: 0; width: 280px; }
  .spec-img { width: 100%; border-radius: var(--radius-md); border: none; cursor: pointer; transition: all .25s ease; box-shadow: var(--shadow-soft); }
  .spec-img:hover { box-shadow: var(--shadow-hover); transform: scale(1.02); }
  .spec-img.spec-img-expanded { position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%); width: auto; max-width: 90vw; max-height: 90vh; object-fit: contain; z-index: 1000; box-shadow: 0 16px 64px rgba(0,0,0,.35); border-radius: var(--radius-md); }
  .spec-img-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,.5); backdrop-filter: blur(4px); z-index: 999; cursor: pointer; }
  .spec-findings { list-style: none; padding: 0; flex: 1; min-width: 0; }
  @media (max-width: 768px) {
    .spec-card-body { flex-direction: column; }
    .spec-img-wrap { width: 100%; }
  }
  .spec-findings li { padding: .4rem 0; font-size: .8125rem; border-bottom: 1px solid #F5F5F5; line-height: 1.6; }
  .spec-findings li:last-child { border-bottom: none; }
  .finding-pass { color: var(--c-success); }
  .finding-warn { color: var(--c-warning); }
  .finding-fail { color: var(--c-danger); }

  /* checklist */
  .checklist-progress { background: var(--c-surface); border-radius: var(--radius-lg); padding: 2rem; margin-bottom: 2rem; border: none; box-shadow: var(--shadow-card); }
  .progress-stats { display: flex; gap: 2.5rem; margin-bottom: 1rem; flex-wrap: wrap; }
  .progress-stat { display: flex; flex-direction: column; }
  .progress-label { font-size: .75rem; color: var(--c-text-secondary); text-transform: uppercase; letter-spacing: .5px; font-weight: 500; }
  .progress-value { font-size: 1.5rem; font-weight: 700; color: var(--c-text); }
  .progress-bar-track { height: 10px; background: var(--c-border); border-radius: var(--radius-pill); overflow: hidden; margin-bottom: 1rem; }
  .progress-bar-fill { height: 100%; background: linear-gradient(90deg, var(--c-primary), #43A047); border-radius: var(--radius-pill); transition: width .4s ease; }
  .btn-reset { background: none; border: 1px solid var(--c-border); border-radius: var(--radius-pill); padding: .5rem 1.25rem; font-size: .75rem; font-weight: 500; color: var(--c-text-secondary); cursor: pointer; transition: all .2s; }
  .btn-reset:hover { background: var(--c-danger-light); color: var(--c-danger); border-color: var(--c-danger); }

  .checklist-section { background: var(--c-surface); border-radius: var(--radius-lg); margin-bottom: 1.25rem; border: none; box-shadow: var(--shadow-card); overflow: hidden; }
  .checklist-section-title { margin: 0; padding: 1.25rem 1.5rem; cursor: pointer; user-select: none; display: flex; align-items: center; gap: .5rem; font-size: 1.05rem; text-transform: none; }
  .checklist-section-title:hover { background: rgba(0,0,0,.015); }
  .collapse-icon { font-size: .65rem; transition: transform .2s; color: #B0B0B0; }
  .checklist-section.collapsed .collapse-icon { transform: rotate(-90deg); }
  .checklist-section.collapsed .checklist-section-body { display: none; }
  .checklist-section-body { padding: 0 1.5rem 1.25rem; }
  .section-badge { margin-left: auto; font-size: .75rem; font-weight: 600; padding: .2rem .75rem; border-radius: var(--radius-pill); background: var(--c-success-light); color: var(--c-success); }

  .checklist-sub-title { font-size: .875rem; font-weight: 600; margin: 1.25rem 0 .625rem; color: #424242; padding-bottom: .375rem; border-bottom: 1px solid var(--c-border); text-transform: none; }
  .checklist-items { list-style: none; padding: 0; }
  .checklist-item { padding: .4rem 0; }
  .checklist-item label { display: flex; align-items: flex-start; gap: .625rem; cursor: pointer; font-size: .875rem; line-height: 1.7; }
  .checklist-indent { padding-left: 1.75rem; }
  .checklist-item input[type="checkbox"] { display: none; }
  .checkmark { flex-shrink: 0; width: 20px; height: 20px; border: 2px solid #D0D0D0; border-radius: 6px; display: inline-flex; align-items: center; justify-content: center; margin-top: 3px; transition: all .2s; }
  .checklist-item input:checked ~ .checkmark { background: var(--c-primary); border-color: var(--c-primary); }
  .checklist-item input:checked ~ .checkmark::after { content: "✓"; color: #FFF; font-size: .7rem; font-weight: 700; }
  .checklist-item input:checked ~ .item-text { color: #B0B0B0; text-decoration: line-through; }
  .badge-required { font-size: .625rem; font-weight: 600; padding: .15rem .5rem; border-radius: var(--radius-pill); background: var(--c-warning-light); color: var(--c-warning); margin-left: .25rem; white-space: nowrap; }

  @media (max-width: 640px) {
    body { padding: 1.25rem; }
    .color-grid { grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); }
    .progress-stats { gap: 1.25rem; }
    .tab-bar { flex-direction: column; border-radius: var(--radius-md); }
    .spec-stats { flex-wrap: wrap; }
  }
</style>
</head>
<body>
<h1>${esc(projectName)}</h1>
<p class="page-subtitle">設計系統基礎規範與檢核</p>
<p class="meta">Version: ${esc(tokens.$version || "—")} &middot; Generated: ${new Date().toISOString().slice(0, 10)}</p>

<div class="tab-bar">
  <button class="tab-btn active" data-tab="audit" onclick="switchTab('audit')">審核結果</button>
  <button class="tab-btn" data-tab="tokens" onclick="switchTab('tokens')">Design Tokens</button>
  <button class="tab-btn" data-tab="checklist" onclick="switchTab('checklist')">審核清單</button>
</div>

<div id="tab-audit" class="tab-panel active">
  <div class="sub-nav">
    ${tokens.$audit ? '<a href="#audit-summary">摘要</a>' : ""}
    ${tokens.$audit && tokens.$audit.specs ? '<a href="#spec-audit">逐稿審核</a>' : ""}
  </div>
  ${auditSections}
</div>

<div id="tab-tokens" class="tab-panel">
  <div class="sub-nav">
    ${tokens.color ? '<a href="#colors">Colors</a>' : ""}
    ${tokens.typography ? '<a href="#typography">Typography</a>' : ""}
    ${tokens.spacing ? '<a href="#spacing">Spacing</a>' : ""}
    ${tokens.borderRadius ? '<a href="#border-radius">Border Radius</a>' : ""}
    ${tokens.shadow ? '<a href="#shadows">Shadows</a>' : ""}
  </div>
  ${tokenSections}
</div>

<div id="tab-checklist" class="tab-panel">
  ${checklistHtml}
</div>

<footer style="margin-top:5rem; padding:2rem; text-align:center; font-size:.8125rem; color:var(--c-text-secondary); background:var(--c-surface); border-radius:var(--radius-lg); box-shadow:var(--shadow-soft);">
  Generated by Design System Review Skill
</footer>

<div class="spec-img-overlay" id="spec-overlay" onclick="closeSpecImg()"></div>

<script>
// Lightbox for spec images
var _expandedImg = null;
function openSpecImg(img) {
  if (_expandedImg) { closeSpecImg(); return; }
  _expandedImg = img;
  img.classList.add('spec-img-expanded');
  document.getElementById('spec-overlay').style.display = 'block';
}
function closeSpecImg() {
  if (_expandedImg) _expandedImg.classList.remove('spec-img-expanded');
  _expandedImg = null;
  document.getElementById('spec-overlay').style.display = 'none';
}
document.addEventListener('keydown', function(e) { if (e.key === 'Escape') closeSpecImg(); });

// Tab switching
function switchTab(tabName) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + tabName).classList.add('active');
  document.querySelector('[data-tab="' + tabName + '"]').classList.add('active');
  history.replaceState(null, '', '#tab-' + tabName);
}
// Restore tab from hash
(function() {
  const h = location.hash;
  if (h === '#tab-tokens') switchTab('tokens');
  else if (h.startsWith('#') && !h.startsWith('#tab-')) {
    // If hash targets an element inside tokens tab, switch to it
    const el = document.querySelector(h);
    if (el && document.getElementById('tab-tokens').contains(el)) switchTab('tokens');
    else if (el && document.getElementById('tab-audit').contains(el)) switchTab('audit');
  }
})();

(function() {
  const STORAGE_KEY = "ds-review-checklist";

  function load() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch(e) { return {}; }
  }
  function save(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  // restore
  const state = load();
  document.querySelectorAll('#checklist input[type="checkbox"]').forEach(cb => {
    const id = cb.dataset.id;
    if (state[id]) cb.checked = true;
  });
  updateProgress();

  window.onCheckChange = function() {
    const s = {};
    document.querySelectorAll('#checklist input[type="checkbox"]').forEach(cb => {
      if (cb.checked) s[cb.dataset.id] = 1;
    });
    save(s);
    updateProgress();
  };

  window.resetChecklist = function() {
    if (!confirm("確定要重置所有勾選嗎？")) return;
    localStorage.removeItem(STORAGE_KEY);
    document.querySelectorAll('#checklist input[type="checkbox"]').forEach(cb => cb.checked = false);
    updateProgress();
  };

  function updateProgress() {
    let reqChecked = 0, reqTotal = 0, optChecked = 0, optTotal = 0;
    document.querySelectorAll('#checklist input[type="checkbox"]').forEach(cb => {
      if (cb.dataset.depth !== "0") return; // only top-level items
      const req = cb.dataset.required === "1";
      if (req) { reqTotal++; if (cb.checked) reqChecked++; }
      else { optTotal++; if (cb.checked) optChecked++; }
    });

    const total = reqTotal + optTotal;
    const checked = reqChecked + optChecked;
    const pct = total > 0 ? Math.round(checked / total * 100) : 0;

    const elReq = document.getElementById("progress-required");
    const elOpt = document.getElementById("progress-optional");
    const elTotal = document.getElementById("progress-total");
    const elBar = document.getElementById("progress-bar");
    if (elReq) elReq.textContent = reqChecked + " / " + reqTotal;
    if (elOpt) elOpt.textContent = optChecked + " / " + optTotal;
    if (elTotal) elTotal.textContent = pct + "%";
    if (elBar) elBar.style.width = pct + "%";

    // section badges
    document.querySelectorAll(".checklist-section").forEach(sec => {
      const cbs = sec.querySelectorAll('input[type="checkbox"][data-depth="0"]');
      let done = 0;
      cbs.forEach(c => { if (c.checked) done++; });
      const badge = sec.querySelector(".section-badge");
      if (badge) {
        badge.textContent = done + "/" + cbs.length;
        badge.style.background = done === cbs.length ? "#E8F5E9" : "#FFF3E0";
        badge.style.color = done === cbs.length ? "#2E7D32" : "#E65100";
      }
    });
  }
})();
</script>
</body>
</html>`;

fs.writeFileSync(path.resolve(outputPath), html, "utf-8");
console.log(`✅ Design token page generated: ${path.resolve(outputPath)}`);
