# 🔮 ResearchPhantom — GLOBAL RESEARCH TERMINAL

<p align="center">
  <a href="#english">English</a> ·
  <a href="#日本語">日本語</a>
</p>

<p align="center">
  <a href="https://howly23v.github.io/ResearchPhantom/">
    <img src="https://img.shields.io/badge/%E2%96%B6%20OPEN%20THE%20APP-d92323?style=for-the-badge&logo=github&logoColor=white" alt="Open App" height="46">
  </a>
</p>

<p align="center">
  👉 <b><a href="https://howly23v.github.io/ResearchPhantom/">https://howly23v.github.io/ResearchPhantom/</a></b>
</p>

<p align="center">
  <a href="https://github.com/howly23v/ResearchPhantom/actions/workflows/deploy.yml">
    <img src="https://github.com/howly23v/ResearchPhantom/actions/workflows/deploy.yml/badge.svg" alt="Deploy status">
  </a>
</p>

## Daily updates and one-year archive / 毎日更新と1年分の履歴

Official arXiv RSS listings are collected by `Daily paper archive` every day at **14:37 JST** (with a backup run at 16:19 JST), after publication in US Eastern time. It runs on GitHub Actions, so no PC needs to be on. GitHub scheduling can be delayed. No API key or LLM is required for paper updates.

The date selector opens a saved daily listing. History accumulates **from the first successful run**, retaining one calendar year. This does not backfill unsaved dates or all historical arXiv papers. Only the date catalog and the selected snapshot are fetched; cards are rendered 10 at a time (the app's existing display limit). Identical snapshots share one file; unreferenced expired snapshots are removed. Offline caching keeps only the last opened snapshot.

Official RSS does not reliably include author affiliations. New papers appear under **所属未確認**, without guessed countries or institutions. The existing institution-specific dataset remains available as a separate selector option. Each day, about 4 papers per field (32 in total) are picked and given a Japanese title, a short summary and an AUTO BRIEFING animation via free LLM tiers, highest quality first: Gemini Flash → OpenCode Zen free models → Gemini Flash-Lite (`GEMINI_API_KEY` and/or `OPENCODE_API_KEY` repository secrets; GitHub Models was retired on 2026-07-30). They are listed first and marked 🎬. Other papers show the original abstract. If the LLM is unavailable, the listing is still published.

Acquisition failure leaves the previous archive intact and fails the Actions run. A successful data commit explicitly dispatches Pages deployment, because pushes made with `GITHUB_TOKEN` do not trigger push workflows.

毎日 **14:37（日本時間、16:19に保険の再実行）** に GitHub 上で取得・保存し、公開サイトへ反映します（PCの電源は不要）。分野ごとに約4本（計32本）を選び、AIが日本語タイトル・要約・動画風の自動解説（🎬 動画解説）を付けて一覧の先頭に表示します。日付を選ぶと保存済みの一覧を開けます。保存は初回の成功日から蓄積され、過去1年分を保持します。未保存の過去1年を自動で埋めるものではありません。所属や国は推測せず、新着は原文要旨を表示します。

| File | Purpose |
| --- | --- |
| `scripts/update_papers.py` | Official feed collection, deduplication and calendar-year retention |
| `data/manifest.json` | Catalog of saved dates and acquisition timestamps |
| `data/snapshots/*.json` | Content-addressed daily listings, loaded on selection |
| `data/briefings/*.json` | Japanese briefings for the day's picks (same hash as the snapshot) |
| `data/seed.json` | Existing institution-specific data |
| `.github/workflows/update-papers.yml` | Daily update, briefing generation and explicit Pages deployment |

Verification: `python -m unittest discover -s tests -v`, `node tests/test_archive_ui.mjs` and `node tests/test_storyboards.mjs`.

---

<a id="english"></a>

## 🇬🇧 English

> A web app that browses the latest research papers from [arXiv](https://arxiv.org/) through a **Persona 5-inspired holographic UI**.
> **No installation required — just click the link.**

### 🚀 How to Open (3 Ways)

#### ① Easiest: Open in Browser (one click)

Click the red **OPEN THE APP** button above, or tap / click the link below. Works on both smartphone and PC.

➡️ **https://howly23v.github.io/ResearchPhantom/**

#### ② Install as a Smartphone App (PWA)

1. Open the URL above in your mobile browser
2. Select **"Add to Home Screen"** from the menu
3. Launch it like a regular app from your home screen icon (some content is available offline)

#### ③ Run Locally on Your PC (for those who want to explore the code)

1. Click the green **"Code"** button at the top right → **"Download ZIP"**
2. Extract the downloaded ZIP file
3. Run `python -m http.server` in the folder, then open `http://localhost:8000`.

> 💡 `index.html` contains the UI; data is loaded from `data/`. Local viewing requires an HTTP server, with no build process.

---

### 📖 What Is This?

**ResearchPhantom** is a website that fetches the latest papers from [arXiv](https://arxiv.org/) — where researchers worldwide publish their work — and displays them in a stylish UI.

- 🧬 Life Sciences / ⚛️ Physics / 🔮 Quantum / 🔬 Materials Science / ⚡ Energy — **browse papers by field**
- 📊 Each paper includes an **analysis & rating** and 🚀 **future potential** summary
- 🌍 Track research activity **by country and institution**
- 🎮 **Persona 5-inspired** red × black design

---

### 🧩 Code Structure (if you're curious)

Kept intentionally simple so even beginners can read it.

| File | Purpose |
| --- | --- |
| [`index.html`](index.html) | **The entire app** — HTML, CSS, and JavaScript all in one file |
| [`manifest.json`](manifest.json) | PWA (smartphone app) configuration |
| [`sw.js`](sw.js) | Service Worker for offline support |
| [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) | Auto-publish to GitHub Pages |

- Runs on **vanilla HTML / CSS / JavaScript** — no frameworks
- Daily data is collected from official arXiv RSS feeds by GitHub Actions; browsers read saved data
- Edit `<style>` in `index.html` to change the **appearance**; edit `<script>` to change the **behavior**

#### Recommended First Step

Open `index.html` and change the color variable near the top:

```css
:root {
  --p5-red: #d92323;   /* ← Change this to any color and save */
}
```

Save the file and reload in your browser — the look changes instantly. That's the first joy of touching code ✨

---

### 🌐 How Deployment Works (GitHub Pages)

Pushing changes to the `main` branch triggers GitHub Actions to automatically build and publish to **https://howly23v.github.io/ResearchPhantom/** (already configured).

No extra steps needed. Just edit `index.html` and push — the site updates automatically.

---

<a id="日本語"></a>

## 🇯🇵 日本語

> 世界の最新研究論文（[arXiv](https://arxiv.org/)）を、ペルソナ5風のホログラフィックUIで眺められる Web アプリです。
> **インストール不要。リンクをクリックするだけで動きます。**

### 🚀 開き方（3通り — 好きな方法でどうぞ）

#### ① いちばん簡単：ブラウザで開く（クリックするだけ）

上の赤い **OPEN THE APP** ボタン、または下のリンクをタップ／クリックするだけ。スマホでもPCでもOKです。

➡️ **https://howly23v.github.io/ResearchPhantom/**

#### ② スマホに「アプリ」として入れる（PWA）

1. スマホのブラウザで上のURLを開く
2. メニューから **「ホーム画面に追加」** を選ぶ
3. 普通のアプリのようにアイコンから起動できます（オフラインでも一部表示されます）

#### ③ 自分のPCで開く（コードを触ってみたい人向け）

1. このページ右上の緑の **「Code」** ボタン → **「Download ZIP」** でダウンロード
2. ダウンロードしたZIPを展開（解凍）する
3. フォルダ内で `python -m http.server` を実行し、ブラウザで `http://localhost:8000` を開きます。

> 💡 `index.html` が画面、`data/` が保存データです。ローカル閲覧にはHTTPサーバーが必要ですが、ビルドは不要です。

---

### 📖 これは何？

**ResearchPhantom** は、世界中の研究者が論文を公開している [arXiv](https://arxiv.org/) から最新の論文を取ってきて、かっこいいUIで一覧表示する Web サイトです。

- 🧬 生命科学 / ⚛️ 物理 / 🔮 量子 / 🔬 材料科学 / ⚡ エネルギー など、**分野ごと**に最新論文を表示
- 📊 各論文の「**解析・評価**」や 🚀「**将来の発展性**」もまとめて表示
- 🌍 国・研究機関ごとの動きもチェックできる
- 🎮 赤 × 黒の 目に優しいデザイン**

---

### 🧩 コードの中身（興味が出たら）

「プログラミングを始めたばかり」でも読みやすいよう、できるだけシンプルな作りにしています。

| ファイル | 役割 |
| --- | --- |
| [`index.html`](index.html) | **アプリ本体**。HTML・CSS・JavaScript が1つのファイルに入っています |
| [`manifest.json`](manifest.json) | スマホアプリ化（PWA）の設定 |
| [`sw.js`](sw.js) | オフライン対応のための Service Worker |
| [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) | GitHub Pages へ自動公開するための設定 |

- フレームワーク無しの **素の HTML / CSS / JavaScript** だけで動きます
- データは GitHub Actions が arXiv 公式RSSから毎日取得し、ブラウザは保存データを読み込みます
- `index.html` の中の `<style>` を変えれば **見た目** が、`<script>` を変えれば **動き** が変わります

#### 最初の一歩におすすめ

`index.html` を開いて、上のほうにある色の設定をちょっと変えてみましょう。

```css
:root {
  --p5-red: #d92323;   /* ← この色を好きな色に変えて保存 */
}
```

保存して、ブラウザで再読み込み（リロード）すると、見た目が変わります。これがコードを触る楽しさの第一歩です ✨

---

### 🌐 公開の仕組み（GitHub Pages）

`main` ブランチに変更を push すると、GitHub Actions が自動でビルドして
**https://howly23v.github.io/ResearchPhantom/** に反映します（設定済み）。

特別な操作は不要です。`index.html` を編集して push するだけで、サイトが更新されます。

---

### ▶ AUTO BRIEFING（論文の自動解説アニメーション）

論文カードをタップすると、その論文が
**「❓課題 → 🛠手法 → 📊結果 → 🚀意義」** の4ステップで
アイアンマンのHUDのように順番にアニメーション表示されます。

#### 仕組み

| ファイル | 役割 |
| --- | --- |
| [`storyboards.json`](storyboards.json) | 論文ごとの解説データ（AIが自動生成） |
| [`scripts/generate_storyboards.mjs`](scripts/generate_storyboards.mjs) | 解説データの生成スクリプト |
| [`.github/workflows/generate-storyboards.yml`](.github/workflows/generate-storyboards.yml) | 手動での再試行・過去日の補完（毎日の生成は `update-papers.yml` が担当） |

生成は無料枠のAIを **品質の高い順** に使います（以前使っていた GitHub Models は 2026-07-30 にサービス終了）。

1. **Gemini Flash**（`GEMINI_API_KEY`）… 高品質。1日の無料枠が小さめ
2. **OpenCode Zen の無料モデル**（`OPENCODE_API_KEY`）
3. **Gemini Flash-Lite**（同じ Gemini キー）… 1日の無料枠が大きい保険

枠切れ・障害になったら自動で次へ切り替えます。順番は Variables の `LLM_ORDER`（例: `opencode,gemini-flash,gemini-lite`）で変更できます。
キーが無い・枠切れの場合はブラウザ側の簡易生成に自動で切り替わり、**表示は止まりません。**

#### 初回設定（1回だけ・どちらか片方でも動きます）

1. キーを発行
   - Gemini: [Google AI Studio](https://aistudio.google.com/apikey) で「Create API key」（無料）
   - OpenCode: [opencode.ai/zen](https://opencode.ai/zen) で API キーを発行（無料モデルだけなら課金不要）
2. GitHub のこのリポジトリ → **Settings → Secrets and variables → Actions → New repository secret**
3. `GEMINI_API_KEY` / `OPENCODE_API_KEY` の名前でそれぞれ保存
4. **Actions → Daily paper archive → Run workflow** で今日の分がすぐ生成されます（以後は毎日自動）

※ Google Antigravity（IDE）の無料枠は IDE 外からの利用が認められていないため使いません。同じ Gemini モデルを API の無料枠で使います。

無料モデル（IDが `-free` で終わるもの）は入れ替わりが激しいため、毎回 `/models` から自動で選び、
使えなくなったモデルは次の無料モデルに切り替えます。固定したい場合は **Variables** に
`OPENCODE_MODEL`（例: `deepseek-v4-flash-free`、カンマ区切りで複数可）を設定します。
無料モデルは入力が提供元の改善に使われる場合があります（扱うのは公開論文の要旨のみ）。
Gemini のモデルも同様に自動選択します（`GEMINI_MODEL` で固定も可）。

#### ローカルGPUで一括生成する（任意）

[Ollama](https://ollama.com/) を入れた PC（例: RTX 3090）なら、
レート制限なしで全論文分を一気に生成できます:

```bash
ollama pull qwen2.5:7b
PROVIDER=ollama node scripts/generate_storyboards.mjs
# 生成された storyboards.json をコミットして push すれば反映
```

##### 2台持ち（Mac + Windows など）の場合

スクリプトは **どのマシンで実行しても動く** ように、Ollama を次の順で自動的に探します:

1. `OLLAMA_URLS`（カンマ区切りで複数指定可）または `OLLAMA_URL` で指定した接続先
2. 実行マシン自身の `http://localhost:11434`
3. **同じLAN内の別マシン**（/24を自動スキャン）

GPUがあるマシン（例: Windows + RTX 3070）を LAN に公開しておく一度きりの設定:

```powershell
# Windows (PowerShell) — 一度だけ
winget install Ollama.Ollama
[Environment]::SetEnvironmentVariable("OLLAMA_HOST", "0.0.0.0", "User")
# Ollamaを再起動してから:
ollama pull qwen2.5:7b
# ファイアウォールで11434を許可（初回のダイアログでOK。手動なら:）
netsh advfirewall firewall add rule name="Ollama" dir=in action=allow protocol=TCP localport=11434
```

以後、Mac側から `PROVIDER=ollama node scripts/generate_storyboards.mjs` を実行するだけで、
WindowsのGPUが自動的に見つかって使われます（IP指定: `OLLAMA_URLS="http://192.168.x.x:11434"`）。
