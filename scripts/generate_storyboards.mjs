// ============================================================
// storyboards.json 自動生成スクリプト
//
// 2系統の論文を LLM で「自動ブリーフィング」(動画風の解説) に変換する:
//   A. data/seed.json の既存論文       → storyboards.json
//   B. 毎日の arXiv 新着(最新スナップショット)から分野ごとに数本を選抜
//                                       → data/briefings/<スナップショットと同じハッシュ>.json
// 生成済みのものはスキップするので、何度実行しても同じ論文に二重課金しない。
//
// プロバイダ優先順位(自動フォールバック):
//   1. Gemini         … GEMINI_API_KEY(リポジトリの Secrets)があれば(無料枠)
//   2. Ollama         … PROVIDER=ollama 指定時(ローカルGPU、制限なし)
//   ※ 以前使っていた GitHub Models は 2026-07-30 にサービス終了したため削除
//   LLM が全滅した論文はスキップ(閲覧側のフォールバック生成が表示を担保)
//
// 使い方:
//   CI:              node scripts/generate_storyboards.mjs
//   ローカル一括:     PROVIDER=ollama node scripts/generate_storyboards.mjs
//   動作確認のみ:     DRY_RUN=1 node scripts/generate_storyboards.mjs
//   新着の選抜数:     DAILY_PER_CATEGORY=4 (分野ごと) / DAILY_DAYS=1 (遡る日数)
// ============================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const STORYBOARDS_PATH = path.join(ROOT, 'storyboards.json');

const DRY_RUN = !!process.env.DRY_RUN;
const PROVIDER = process.env.PROVIDER || '';        // '' = 自動 / 'ollama' = ローカル
const MAX_NEW = Number(process.env.MAX_NEW || 120); // 1回の実行で生成する上限
const DAILY_PER_CATEGORY = Number(process.env.DAILY_PER_CATEGORY || 4);
const DAILY_DAYS = Number(process.env.DAILY_DAYS || 1);
// 無料枠のモデル名は頻繁に入れ替わるため、未指定ならモデル一覧APIから自動で選ぶ
const GEMINI_MODEL = process.env.GEMINI_MODEL || '';
let GEMINI_RESOLVED = null; // resolveGeminiModel() が設定する
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:7b';
// Ollama接続先: カンマ区切りで複数指定可(Mac/Windowsどちらで実行しても、
// どちらのマシンのOllamaでも使えるようにする)。全滅時はLANを自動探索。
const OLLAMA_URLS = (process.env.OLLAMA_URLS || process.env.OLLAMA_URL || 'http://localhost:11434')
  .split(',').map((s) => s.trim()).filter(Boolean);
let OLLAMA_RESOLVED = null; // resolveOllamaUrl() が設定する

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---- 1. 既存の研究機関別データから論文を抽出 ----
function extractPapers() {
  const seed = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/seed.json'), 'utf8'));
  const papers = [];
  for (const country of Object.values(seed.countries || {})) {
    for (const inst of Object.values(country.institutions || {})) {
      for (const p of inst.papers || []) papers.push(p);
    }
  }
  if (papers.length === 0) throw new Error('論文が0件です — SEED_DATA の形式が変わった可能性');
  return papers;
}

// ---- 1.2. 毎日の新着から「気軽に見られる」数本を分野ごとに選ぶ ----
// UIのカテゴリボタンと同じ分類。どの分野を選んでも解説付きの論文が上に並ぶようにする。
export const CATEGORY_GROUPS = {
  ai: ['cs.AI', 'cs.LG'], nlp: ['cs.CL'], cv: ['cs.CV'], physics: ['physics', 'hep', 'astro'],
  bio: ['q-bio'], quantum: ['quant-ph'], materials: ['cond-mat'], energy: ['eess'],
};

// LLM を使わない決定的なスコア: 新規投稿・具体的な数値成果・分野横断を優先
export function dailyScore(p) {
  const text = String(p.summary || '');
  let score = 0;
  if (p.announce_type === 'new') score += 4;
  else if (/replace/.test(p.announce_type || '')) score -= 4;
  if (/\d+(?:\.\d+)?\s*(?:%|×|x\b|-?fold|times)/i.test(text)) score += 3;
  if (/state-of-the-art|outperform|first|novel|breakthrough/i.test(text)) score += 1;
  if (text.length >= 500 && text.length <= 2000) score += 1;
  const groups = Object.values(CATEGORY_GROUPS)
    .filter((cats) => (p.categories || []).some((c) => cats.some((g) => c.includes(g)))).length;
  if (groups >= 2) score += 1;
  if (/withdrawn|erratum|this paper has been/i.test(text)) score -= 10;
  return score;
}

export function pickDailyPapers(papers, perCategory = DAILY_PER_CATEGORY) {
  const picked = new Map();
  for (const cats of Object.values(CATEGORY_GROUPS)) {
    // 主分類(先頭)がこの分野の論文を優先し、無ければクロスリストからも拾う
    const inGroup = (c) => cats.some((g) => String(c).includes(g));
    const candidates = papers
      .filter((p) => p.id && !picked.has(p.id) && (p.categories || []).some(inGroup))
      .map((p) => ({ p, s: dailyScore(p) + (inGroup((p.categories || [])[0]) ? 2 : 0) }))
      .sort((a, b) => b.s - a.s || String(b.p.id).localeCompare(String(a.p.id)));
    for (const { p } of candidates.slice(0, perCategory)) picked.set(p.id, p);
  }
  return [...picked.values()];
}

function snapshotPapers(data) {
  const papers = [];
  for (const country of Object.values((data && data.countries) || {})) {
    for (const inst of Object.values(country.institutions || {})) papers.push(...(inst.papers || []));
  }
  return papers;
}

// 最新 DAILY_DAYS 日分のスナップショット(同一内容の日は1つにまとめる)
function dailyTargets() {
  const manifestPath = path.join(ROOT, 'data/manifest.json');
  if (!fs.existsSync(manifestPath)) return [];
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const seen = new Set();
  const targets = [];
  for (const day of (manifest.days || []).slice(0, DAILY_DAYS)) {
    if (!/^data\/snapshots\/[a-f0-9]{64}\.json$/.test(day.path) || seen.has(day.path)) continue;
    seen.add(day.path);
    const snapshot = JSON.parse(fs.readFileSync(path.join(ROOT, day.path), 'utf8'));
    targets.push({
      date: day.date,
      file: path.join(ROOT, day.path.replace('data/snapshots/', 'data/briefings/')),
      papers: pickDailyPapers(snapshotPapers(snapshot)),
    });
  }
  return targets;
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

{"title_ja":"論文タイトルを中学生にも伝わる日本語に。30字以内","summary_ja":"この論文のまとめ。何をして何がわかったかを平易な日本語で100字以内","problem":"研究前に何が問題だったか。平易な日本語で40字以内","method":["やったことを最大3ステップ、各12字以内の短い名詞句"],"result":"何が起きた/わかったか。40字以内","metric":{"value":"象徴的な数値+単位(例: 3倍, 97%減, 0.03%)","label":"何の指標か8字以内"},"impact":"社会や生活の何がうれしくなるか。40字以内","viz":<下記参照>}

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
// 200でもJSON以外が返る(API廃止・障害)場合は、そのプロバイダごと打ち切れるよう明示的に失敗させる
async function readJson(res, name) {
  const text = await res.text();
  if (!res.ok) throw new Error(`${name} ${res.status}: ${text.slice(0, 200)}`);
  try {
    return JSON.parse(text);
  } catch (_) {
    throw new Error(`${name} 非JSON応答: ${text.slice(0, 80)}`);
  }
}

// 1日分(約32本)を無料枠に収めるため、日次上限の大きい Flash-Lite の最新版を優先する
export function chooseGeminiModel(models) {
  const version = (n) => n.match(/^gemini-([\d.]+)/)[1].split('.').map(Number);
  const rank = (n) => [n.includes('flash-lite') ? 1 : 0, ...version(n)];
  const usable = (models || [])
    .filter((m) => (m.supportedGenerationMethods || []).includes('generateContent'))
    .map((m) => String(m.name || '').replace(/^models\//, ''))
    .filter((n) => /^gemini-[\d.]+-flash/.test(n) && !/preview|exp|image|tts|audio|live|thinking/.test(n));
  usable.sort((a, b) => {
    const ra = rank(a), rb = rank(b);
    for (let i = 0; i < Math.max(ra.length, rb.length); i++) {
      if ((rb[i] || 0) !== (ra[i] || 0)) return (rb[i] || 0) - (ra[i] || 0);
    }
    return a.localeCompare(b);
  });
  return usable[0] || null;
}

async function resolveGeminiModel(key) {
  if (GEMINI_MODEL) return GEMINI_MODEL;
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000&key=${key}`);
    const chosen = chooseGeminiModel((await readJson(res, 'Gemini models')).models);
    if (chosen) return chosen;
  } catch (e) {
    console.log(`Geminiモデル一覧の取得に失敗: ${e.message}`);
  }
  return 'gemini-flash-lite-latest'; // Google が用意している最新版エイリアス
}

async function callGemini(prompt) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY 未設定');
  if (!GEMINI_RESOLVED) {
    GEMINI_RESOLVED = await resolveGeminiModel(key);
    console.log(`Geminiモデル: ${GEMINI_RESOLVED}`);
  }
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_RESOLVED}:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, responseMimeType: 'application/json' },
      }),
    }
  );
  const data = await readJson(res, 'Gemini');
  return data.candidates[0].content.parts.map((part) => part.text || '').join('');
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
      { name: 'gemini', call: callGemini, waitMs: 13000 }, // 無料枠の最も厳しいRPM(5)でも収まる間隔
    ];

// ---- 4. 出力の検証・整形 ----
// LLM出力はUIで innerHTML に入る箇所があるため、タグになり得る文字を落とす
function clamp(s, max) {
  s = String(s || '').replace(/[<>]/g, '').trim();
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}

export function parseStoryboard(raw) {
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
    ...(obj.title_ja ? { title_ja: clamp(obj.title_ja, 40) } : {}),
    ...(obj.summary_ja ? { summary_ja: clamp(obj.summary_ja, 130) } : {}),
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
  const isFresh = (store, id) => store[id] && store[id].v === SCHEMA_V;

  // 毎日の新着を先に(その日の目玉なので)、次に既存データの未生成分
  const outputs = [];
  const jobs = [];
  for (const target of dailyTargets()) {
    const store = fs.existsSync(target.file) ? JSON.parse(fs.readFileSync(target.file, 'utf8')) : {};
    const output = { file: target.file, store, changed: !fs.existsSync(target.file) };
    outputs.push(output);
    const todo = target.papers.filter((p) => !isFresh(store, p.id));
    console.log(`新着 ${target.date}: 選抜 ${target.papers.length} 件 / 生成対象 ${todo.length} 件`);
    // 新着の要旨はそのまま原文アブストラクト。未翻訳の定型文(analysis)はプロンプトに入れない
    for (const p of todo) jobs.push({ p, output, prompt: async () => buildPrompt({ title: p.title, categories: p.categories }, p.summary) });
  }
  const seedOutput = { file: STORYBOARDS_PATH, store: storyboards, changed: false, pretty: true };
  outputs.push(seedOutput);
  const pending = papers.filter((p) => p.id && !isFresh(storyboards, p.id));
  console.log(`既存データ ${papers.length} 件 / 最新版生成済み ${papers.length - pending.length} 件 / 生成対象 ${pending.length} 件`);
  for (const p of pending) {
    jobs.push({ p, output: seedOutput, prompt: async () => {
      const abstract = await fetchAbstract(extractArxivId(p), p.title);
      await sleep(600); // arXiv APIへの配慮
      return buildPrompt(p, abstract);
    } });
  }

  if (DRY_RUN) {
    for (const job of jobs.slice(0, 3)) console.log('--- prompt sample ---\n' + (await job.prompt()).slice(0, 400));
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

  for (const { p, output, prompt: makePrompt } of jobs) {
    if (generated >= MAX_NEW) {
      console.log(`上限 ${MAX_NEW} 件に到達 — 残りは次回の実行で処理`);
      break;
    }
    const prompt = await makePrompt();
    let done = false;
    for (const provider of PROVIDERS) {
      if (deadProviders.has(provider.name)) continue;
      try {
        const raw = await provider.call(prompt);
        const sb = parseStoryboard(raw);
        output.store[p.id] = { ...sb, v: SCHEMA_V, title: p.title, generated: provider.name };
        output.changed = true;
        generated++;
        done = true;
        console.log(`✔ [${provider.name}] ${p.id}`);
        if (provider.waitMs) await sleep(provider.waitMs);
        break;
      } catch (e) {
        console.log(`✖ [${provider.name}] ${p.id}: ${e.message}`);
        // 認証エラー・枠切れ・モデル廃止はそのプロバイダを以後スキップ
        if (/400|401|403|404|429|未設定|非JSON応答/.test(e.message)) deadProviders.add(provider.name);
      }
    }
    if (!done && deadProviders.size >= PROVIDERS.length) {
      console.log('全プロバイダ利用不可 — 中断(閲覧側フォールバックが表示を担保)');
      break;
    }
  }

  for (const output of outputs.filter((o) => o.changed)) {
    const sorted = Object.fromEntries(Object.entries(output.store).sort(([a], [b]) => a.localeCompare(b)));
    fs.mkdirSync(path.dirname(output.file), { recursive: true });
    fs.writeFileSync(output.file, (output.pretty ? JSON.stringify(sorted, null, 2) : JSON.stringify(sorted)) + '\n');
    console.log(`${path.relative(ROOT, output.file)} を更新 (合計 ${Object.keys(sorted).length} 件)`);
  }
  console.log(generated > 0 ? `新規生成 ${generated} 件` : '新規生成なし');
}

// テストから関数だけ読み込めるよう、直接実行時のみ main を走らせる
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
