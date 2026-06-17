# 🔮 ResearchPhantom — GLOBAL RESEARCH TERMINAL

> 世界の最新研究論文（[arXiv](https://arxiv.org/)）を、ペルソナ5風のホログラフィックUIで眺められる Web アプリです。
> **インストール不要。リンクをクリックするだけで動きます。**

<p align="center">
  <a href="https://howly23v.github.io/ResearchPhantom/">
    <img src="https://img.shields.io/badge/%E2%96%B6%20OPEN%20THE%20APP-d92323?style=for-the-badge&logo=github&logoColor=white" alt="アプリを開く" height="46">
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

## 🚀 開き方（3通り — 好きな方法でどうぞ）

### ① いちばん簡単：ブラウザで開く（クリックするだけ）

上の赤い **OPEN THE APP** ボタン、または下のリンクをタップ／クリックするだけ。スマホでもPCでもOKです。

➡️ **https://howly23v.github.io/ResearchPhantom/**

### ② スマホに「アプリ」として入れる（PWA）

1. スマホのブラウザで上のURLを開く
2. メニューから **「ホーム画面に追加」** を選ぶ
3. 普通のアプリのようにアイコンから起動できます（オフラインでも一部表示されます）

### ③ 自分のPCで開く（コードを触ってみたい人向け）

1. このページ右上の緑の **「Code」** ボタン → **「Download ZIP」** でダウンロード
2. ダウンロードしたZIPを展開（解凍）する
3. その中の **`index.html`** を **ダブルクリック**
   → いつものブラウザで開きます。これだけ！

> 💡 `index.html` という **1ファイルがアプリ本体** です。サーバーの構築やビルドなど、難しい準備は一切いりません。

---

## 📖 これは何？

**ResearchPhantom** は、世界中の研究者が論文を公開している [arXiv](https://arxiv.org/) から最新の論文を取ってきて、かっこいいUIで一覧表示する Web サイトです。

- 🧬 生命科学 / ⚛️ 物理 / 🔮 量子 / 🔬 材料科学 / ⚡ エネルギー など、**分野ごと**に最新論文を表示
- 📊 各論文の「**解析・評価**」や 🚀「**将来の発展性**」もまとめて表示
- 🌍 国・研究機関ごとの動きもチェックできる
- 🎮 赤 × 黒の **ペルソナ5風デザイン**

---

## 🧩 コードの中身（興味が出たら）

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

### 最初の一歩におすすめ

`index.html` を開いて、上のほうにある色の設定をちょっと変えてみましょう。

```css
:root {
  --p5-red: #d92323;   /* ← この色を好きな色に変えて保存 */
}
```

保存して、ブラウザで再読み込み（リロード）すると、見た目が変わります。これがコードを触る楽しさの第一歩です ✨

---

## 🌐 公開の仕組み（GitHub Pages）

`main` ブランチに変更を push すると、GitHub Actions が自動でビルドして
**https://howly23v.github.io/ResearchPhantom/** に反映します（設定済み）。

特別な操作は不要です。`index.html` を編集して push するだけで、サイトが更新されます。
