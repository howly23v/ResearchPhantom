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
3. **Double-click** `index.html` inside the folder → it opens in your browser. That's it!

> 💡 `index.html` is the **entire app in a single file**. No server setup or build process needed.

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
- Data is fetched from the arXiv public API (`https://export.arxiv.org/api/query`)
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
3. その中の **`index.html`** を **ダブルクリック**
   → いつものブラウザで開きます。これだけ！

> 💡 `index.html` という **1ファイルがアプリ本体** です。サーバーの構築やビルドなど、難しい準備は一切いりません。

---

### 📖 これは何？

**ResearchPhantom** は、世界中の研究者が論文を公開している [arXiv](https://arxiv.org/) から最新の論文を取ってきて、かっこいいUIで一覧表示する Web サイトです。

- 🧬 生命科学 / ⚛️ 物理 / 🔮 量子 / 🔬 材料科学 / ⚡ エネルギー など、**分野ごと**に最新論文を表示
- 📊 各論文の「**解析・評価**」や 🚀「**将来の発展性**」もまとめて表示
- 🌍 国・研究機関ごとの動きもチェックできる
- 🎮 赤 × 黒の **ペルソナ5風デザイン**

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
- データは arXiv の公開API（`https://export.arxiv.org/api/query`）から取得しています
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
