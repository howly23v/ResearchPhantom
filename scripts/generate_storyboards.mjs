// ============================================================
// storyboards.json 自動生成スクリプト
//
// index.html の SEED_DATA から論文を読み取り、未生成のものだけ
// LLM で「自動ブリーフィング」用ストーリーボードに変換して
// storyboards.json に追記する。
//
// プロバイダ優先順位(自動フォールバック):
//   1. GitHub Models  … CI では GITHUB_TOKEN だけで動く(無料)
//   2. Gemini         … GEMINI_API_KEY があれば(無料枠)
//   3. Ollama         … PROVIDER=ollama 指定時(ローカルGPU、制限なし)
//   LLM が全滅した論文はスキップ(閲覧側のフォールバック生成が表示を担保)
//
// 使い方:
//   CI:              node scripts/generate_storyboards.mjs
//   ローカル一括:     PROVIDER=ollama node scripts/generate_storyboards.mjs
//   動作確認のみ:     DRY_RUN=1 node scripts/generate_storyboards.mjs
// ============================================================

import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const STORYBOARDS_PATH = path.join(ROOT, 'storyboards.json');

const DRY_RUN = !!process.env.DRY_RUN;
const PROVIDER = process.env.PROVIDER || '';        // '' = 自動 / 'ollama' = ローカル
const MAX_NEW = Number(process.env.MAX_NEW || 120); // 1回の実行で生成する上限
const GH_MODEL = process.env.GH_MODEL || 'openai/gpt-4o-mini';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:7b';
// Ollama接続先: カンマ区切りで複数指定可(Mac/Windowsどちらで実行しても、
// どちらのマシンのOllamaでも使えるようにする)。全滅時はLANを自動探索。
const OLLAMA_URLS = (process.env.OLLAMA_URLS || process.env.OLLAMA_URL || 'http://localhost:11434')
  .split(',').map((s) => s.trim()).filter(Boolean);
let OLLAMA_RESOLVED = null; // resolveOllamaUrl() が設定する

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---- 1. index.html から論文を抽出 ----
function extractPapers() {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const m = html.match(/const SEED_DATA = (\{[\s\S]*?\n\};)/);
  if (!m) throw new Error('SEED_DATA が index.html に見つかりません');
  const seed = vm.runInNewContext('(' + m[1].replace(/;\s*$/, '') + ')', {}, { timeout: 5000 });
  const papers = [];
  for (const country of Object.values(seed.countries || {})) {
    for (const inst of Object.values(country.institutions || {})) {
      for (const p of inst.papers || []) papers.push(p);
    }
  }
  if (papers.length === 0) throw new Error('論文が0件です — SEED_DATA の形式が変わった可能性');
  return papers;
}

// ---- 1.5. arXiv原文アブストラクト取得(実験の実数値はここにしか無いことが多い) ----
function extractArxivId(p) {
  const url = String(p.doi || p.link || '');
  const m = url.match(/arxiv\.org\/(?:abs|pdf|html)\/([0-9]{4}\.[0-9]{4,5})/);
  return m ? m[1] : null;
}

async function fetchAbstract(arxivId, expectedTitle) {
  if (!arxivId) return '';
  try {
    const res = await fetch(`https://export.arxiv.org/api/query?id_list=${arxivId}`);
    if (!res.ok) return '';
    const xml = await res.text();
    const entry = xml.match(/<entry>[\s\S]*?<\/entry>/);
    if (!entry) return '';
    const t = entry[0].match(/<title>([\s\S]*?)<\/title>/);
    const s = entry[0].match(/<summary>([\s\S]*?)<\/summary>/);
    if (!t || !s) return '';
    // データ側のarXivリンクが別論文を指していることがある。
    // タイトルの単語一致率が低い場合は「別論文の数値」を混入させないため破棄する。
    const words = (x) => String(x).toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/).filter((w) => w.length > 3);
    const fetched = new Set(words(t[1]));
    const expected = words(expectedTitle || '');
    const overlap = expected.filter((w) => fetched.has(w)).length;
    if (expected.length === 0 || overlap / expected.length < 0.5) {
      console.log(`  (arXiv ${arxivId} はタイトル不一致 — アブストラクト不使用)`);
      return '';
    }
    return s[1].replace(/\s+/g, ' ').trim().slice(0, 2000);
  } catch (_) {
    return '';
  }
}

// ---- 2. プロンプト ----
function buildPrompt(p, abstract) {
  return `あなたは科学コミュニケーターです。以下の論文情報を、初心者向けの「自動ブリーフィング」用データに変換してください。
出力は次の形式のJSONオブジェクトのみ。コードフェンスや説明文は一切付けないこと。

{"problem":"研究前に何が問題だったか。平易な日本語で40字以内","method":["やったことを最大3ステップ、各12字以内の短い名詞句"],"result":"何が起きた/わかったか。40字以内","metric":{"value":"象徴的な数値+単位(例: 3倍, 97%減, 0.03%)","label":"何の指標か8字以内"},"impact":"社会や生活の何がうれしくなるか。40字以内","viz":<下記参照>}

"viz" は実験結果をアニメーション表示するためのデータ。本文から読み取れる実数値がある場合のみ、次のどちらかの形式で出力:
- 従来手法との比較ができる場合: {"type":"compare_bars","unit":"%","before":{"label":"従来","value":1.2},"after":{"label":"本手法","value":0.03},"higherIsBetter":false,"caption":"エラー率を97%削減"}
- 単一の達成率(0〜100の値)の場合: {"type":"gauge","value":95,"unit":"%","label":"精度","caption":"精度95%を達成"}
本文に具体的な数値が無い場合は必ず "viz": null とする。数値の創作・推測は厳禁。
数値的な成果が本文から読み取れない場合は "metric": null とすること。専門用語はできるだけ日常語に言い換えること。

論文タイトル: ${p.title}
概要: ${p.summary_jp || p.summary || ''}
解析: ${p.analysis_jp || (p.analysis && p.analysis.analysis) || ''}
展望: ${p.prospects_jp || (p.analysis && p.analysis.prospects) || ''}
キーワード: ${(p.keywords || p.categories || []).join(', ')}${abstract ? `
原文アブストラクト(vizの数値はここに書かれた実数値を最優先で使うこと): ${abstract}` : ''}`;
}

// ---- 3. プロバイダ実装 ----
async function callGitHubModels(prompt) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN 未設定');
  const res = await fetch('https://models.github.ai/inference/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      model: GH_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 500,
    }),
  });
  if (!res.ok) throw new Error(`GitHub Models ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return data.choices[0].message.content;
}

async function callGemini(prompt) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY 未設定');
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    }
  );
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return data.candidates[0].content.parts[0].text;
}

async function probeOllama(url, timeoutMs = 900) {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(`${url}/api/tags`, { signal: ctrl.signal });
    clearTimeout(timer);
    return res.ok;
  } catch (_) {
    return false;
  }
}

// 接続先の解決: 指定リスト → ダメならLAN(/24)を自動探索
async function resolveOllamaUrl() {
  for (const url of OLLAMA_URLS) {
    if (await probeOllama(url)) return url;
  }
  console.log('指定先にOllamaが見つからないため、LANを自動探索します…');
  const os = await import('node:os');
  const nets = os.networkInterfaces();
  const prefixes = new Set();
  for (const ifaces of Object.values(nets)) {
    for (const ni of ifaces || []) {
      if (ni.family === 'IPv4' && !ni.internal) {
        prefixes.add(ni.address.split('.').slice(0, 3).join('.'));
      }
    }
  }
  for (const prefix of prefixes) {
    const ips = Array.from({ length: 254 }, (_, i) => `${prefix}.${i + 1}`);
    const CHUNK = 50;
    for (let i = 0; i < ips.length; i += CHUNK) {
      const results = await Promise.all(
        ips.slice(i, i + CHUNK).map(async (ip) => (await probeOllama(`http://${ip}:11434`, 400)) ? ip : null)
      );
      const hit = results.find(Boolean);
      if (hit) return `http://${hit}:11434`;
    }
  }
  return null;
}

async function callOllama(prompt) {
  const res = await fetch(`${OLLAMA_RESOLVED}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages: [{ role: 'user', content: prompt }],
      stream: false,
      options: { temperature: 0.3 },
    }),
  });
  if (!res.ok) throw new Error(`Ollama ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return data.message.content;
}

// 名前 / 呼び出し / 呼び出し間隔(無料枠のレート制限対策)
const PROVIDERS = PROVIDER === 'ollama'
  ? [{ name: 'ollama', call: callOllama, waitMs: 0 }]
  : [
      { name: 'github-models', call: callGitHubModels, waitMs: 4500 }, // 15 RPM
      { name: 'gemini', call: callGemini, waitMs: 6500 },              // 10 RPM
    ];

// ---- 4. 出力の検証・整形 ----
function clamp(s, max) {
  s = String(s || '').trim();
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}

function parseStoryboard(raw) {
  let text = String(raw).trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '');
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('JSONが見つかりません');
  const obj = JSON.parse(text.slice(start, end + 1));
  if (!obj.problem || !obj.result || !obj.impact) throw new Error('必須フィールド欠落');
  const method = (Array.isArray(obj.method) ? obj.method : [obj.method])
    .filter(Boolean).slice(0, 3).map((s) => clamp(s, 14));
  let metric = null;
  if (obj.metric && obj.metric.value) {
    metric = { value: clamp(obj.metric.value, 10), label: clamp(obj.metric.label, 10) };
  }
  return {
    problem: clamp(obj.problem, 48),
    method: method.length ? method : ['新手法の考案'],
    result: clamp(obj.result, 48),
    metric,
    impact: clamp(obj.impact, 48),
    viz: parseViz(obj.viz),
  };
}

// viz の検証: 型と数値をホワイトリストで確認。少しでも怪しければ null(アンビエント表示に落ちる)
function parseViz(viz) {
  if (!viz || typeof viz !== 'object') return null;
  try {
    if (viz.type === 'compare_bars') {
      const b = Number(viz.before && viz.before.value);
      const a = Number(viz.after && viz.after.value);
      if (!isFinite(b) || !isFinite(a)) return null;
      return {
        type: 'compare_bars',
        unit: clamp(viz.unit, 8),
        before: { label: clamp((viz.before.label || '従来'), 10), value: b },
        after: { label: clamp((viz.after.label || '本手法'), 10), value: a },
        higherIsBetter: viz.higherIsBetter !== false,
        caption: clamp(viz.caption, 30),
      };
    }
    if (viz.type === 'gauge') {
      const v = Number(viz.value);
      if (!isFinite(v) || v < 0 || v > 100) return null;
      return {
        type: 'gauge',
        value: v,
        unit: clamp(viz.unit, 8),
        label: clamp(viz.label, 10),
        caption: clamp(viz.caption, 30),
      };
    }
  } catch (_) { /* fall through */ }
  return null;
}

// ---- 5. メイン ----
async function main() {
  const papers = extractPapers();
  let storyboards = {};
  if (fs.existsSync(STORYBOARDS_PATH)) {
    storyboards = JSON.parse(fs.readFileSync(STORYBOARDS_PATH, 'utf8'));
  }

  // v3(arXivアブストラクト参照のviz)より古いエントリは再生成対象にする
  const SCHEMA_V = 3;
  const pending = papers.filter((p) => p.id && (!storyboards[p.id] || storyboards[p.id].v !== SCHEMA_V));
  console.log(`論文 ${papers.length} 件 / 最新版生成済み ${papers.length - pending.length} 件 / 生成対象 ${pending.length} 件`);

  if (DRY_RUN) {
    pending.slice(0, 3).forEach((p) => console.log('--- prompt sample ---\n' + buildPrompt(p).slice(0, 400)));
    console.log('DRY_RUN: API呼び出しなしで終了');
    return;
  }

  if (PROVIDER === 'ollama') {
    OLLAMA_RESOLVED = await resolveOllamaUrl();
    if (!OLLAMA_RESOLVED) {
      console.error(`Ollamaが見つかりません。次のどちらかを用意してください:
  - このマシン: ollama serve を起動し、ollama pull ${OLLAMA_MODEL}
  - 別マシン(Windows等): そちらで環境変数 OLLAMA_HOST=0.0.0.0 を設定してOllamaを再起動
    (ファイアウォールでTCP 11434を許可)。IPを知っていれば OLLAMA_URLS="http://<IP>:11434" で直指定も可`);
      process.exit(1);
    }
    console.log(`Ollama接続先: ${OLLAMA_RESOLVED} / モデル: ${OLLAMA_MODEL}`);
  }

  let generated = 0;
  const deadProviders = new Set();

  for (const p of pending) {
    if (generated >= MAX_NEW) {
      console.log(`上限 ${MAX_NEW} 件に到達 — 残りは次回の実行で処理`);
      break;
    }
    const abstract = await fetchAbstract(extractArxivId(p), p.title);
    await sleep(600); // arXiv APIへの配慮
    const prompt = buildPrompt(p, abstract);
    let done = false;
    for (const provider of PROVIDERS) {
      if (deadProviders.has(provider.name)) continue;
      try {
        const raw = await provider.call(prompt);
        const sb = parseStoryboard(raw);
        storyboards[p.id] = { ...sb, v: SCHEMA_V, title: p.title, generated: provider.name };
        generated++;
        done = true;
        console.log(`✔ [${provider.name}] ${p.id}`);
        if (provider.waitMs) await sleep(provider.waitMs);
        break;
      } catch (e) {
        console.log(`✖ [${provider.name}] ${p.id}: ${e.message}`);
        // 認証エラーや枠切れはそのプロバイダを以後スキップ
        if (/401|403|429|未設定/.test(e.message)) deadProviders.add(provider.name);
      }
    }
    if (!done && deadProviders.size >= PROVIDERS.length) {
      console.log('全プロバイダ利用不可 — 中断(閲覧側フォールバックが表示を担保)');
      break;
    }
  }

  if (generated > 0) {
    const sorted = Object.fromEntries(Object.entries(storyboards).sort(([a], [b]) => a.localeCompare(b)));
    fs.writeFileSync(STORYBOARDS_PATH, JSON.stringify(sorted, null, 2) + '\n');
    console.log(`storyboards.json を更新: +${generated} 件 (合計 ${Object.keys(sorted).length} 件)`);
  } else {
    console.log('新規生成なし');
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
