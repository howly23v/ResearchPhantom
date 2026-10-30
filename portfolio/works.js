// ポートフォリオに載せる作品データ。
// 作品を追加するときは、この配列に1件足すだけでページ全体（件数・絞り込み・年表）に反映されます。
//
// id        : 英数字とハイフン（URLの #work-<id> に使われます）
// date      : 最終更新の年月 "YYYY.MM"（年表と並び順に使います）
// cats      : ai / research / creative / web3 / tool から1つ以上
// series    : 同じアイデアを育てた作品群（"phantom" | "mythos"）。無ければ省略
// featured  : true にすると冒頭の「代表作」に大きく表示
// hue       : カバー画像の色相（0–360）
// problem / build / point : 代表作のケーススタディ（課題 → 作ったもの → 工夫）
// links.live は実際に開ける公開URLだけを書きます
window.WORKS = [
  {
    id: 'researchphantom',
    title: 'ResearchPhantom',
    sub: 'GLOBAL RESEARCH TERMINAL',
    date: '2026.10',
    cats: ['research', 'ai'],
    series: 'phantom',
    featured: true,
    hue: 4,
    summary: '世界の最新論文（arXiv）を、ペルソナ5風のUIで毎日眺められるWebアプリ。',
    problem: '最新研究は英語で量も多く、毎日追い続けるのは専門家でも大変。',
    build: 'GitHub Actionsが毎日arXiv公式RSSを取得して1年分を保存。分野ごとに選んだ約32本に、AIが日本語タイトル・要約・アニメーション解説を付けて公開します。',
    point: 'PCの電源もサーバー代も不要。無料のAI枠を品質順に切り替え、AIが止まっても論文一覧の公開は止まらない設計にしました。',
    tech: ['HTML/CSS/JS', 'Python', 'GitHub Actions', 'Gemini API', 'PWA'],
    links: {
      live: 'https://howly23v.github.io/ResearchPhantom/',
      repo: 'https://github.com/howly23v/ResearchPhantom'
    }
  },
  {
    id: 'neon-mythos-city',
    title: 'NEON MYTHOS',
    sub: 'AI Agent Market Simulator',
    date: '2026.10',
    cats: ['ai', 'creative', 'web3'],
    series: 'mythos',
    featured: true,
    hue: 188,
    summary: 'AIエージェントが働き、交渉し、学びながら暮らすブラウザの未来都市。',
    problem: '「AIエージェントが自律的に働く」と言われても、何をしているのか目に見えない。',
    build: '依頼を受けたエージェントが考え、目的地へ走り、報告するまでを街の中で可視化。十の「もしも」の日本を巡る「万華京ジパング」では、自分のClaudeやGPTを住民として迎えられます。',
    point: '本物の資産は動かさない安全なデモ財布と、Solana devnetへの出生証明の刻印（個人情報は事前にマスク）。スマホ1タップで遊べるPWAです。',
    tech: ['JavaScript', 'PWA', 'Solana devnet', 'Netlify / Vercel'],
    links: {
      live: 'https://ryosaku610.github.io/AI-Agent-market-simulator/',
      repo: 'https://github.com/RyoSAKu610/AI-Agent-market-simulator',
      extra: [
        { label: '万華京ジパング', url: 'https://ryosaku610.github.io/AI-Agent-market-simulator/zipangu/' }
      ]
    }
  },
  {
    id: 'hen',
    title: 'HEN',
    sub: 'Human Experience Network',
    date: '2026.09',
    cats: ['ai', 'web3'],
    featured: true,
    hackathon: 'ETHGlobal Tokyo 2026',
    hue: 42,
    summary: '人の「経験」を本人の同意つきでAIにつなぐネットワーク。',
    problem: 'AIはいくらでも文章を生成できるが、人が実際に生きた経験は再現できない。',
    build: '経験を匿名化した「Experience Capsule」に変換し、原本は本人の金庫で暗号化。AIが使うたびに本人がWorld IDで承認し、利用料はx402で支払われます。',
    point: '「人間が最後に決める」を仕組みで保証。APIキー無しで1分で動くデモと、3分46秒のピッチ動画まで用意しました。',
    tech: ['Next.js', 'TypeScript', 'World ID', 'ENS', 'x402'],
    links: {
      live: 'https://hen-experience-tokyo.vercel.app',
      repo: 'https://github.com/RyoSAKu610/HEN-Human-experience-network-'
    }
  },
  {
    id: 'researchphantom-daily',
    title: 'ResearchPhantom Daily',
    sub: '6言語リサーチ・ポッドキャスト',
    date: '2026.10',
    cats: ['research', 'ai'],
    series: 'phantom',
    hue: 330,
    summary: '毎朝6:30に最新論文から日・中・独・西・露・伊の6言語ポッドキャストを自動生成。',
    tech: ['Node.js', 'TTS（自前ホスト）', 'GitHub Actions', 'RSS'],
    links: {
      live: 'https://ryosaku610.github.io/researchphantom-daily/',
      repo: 'https://github.com/RyoSAKu610/researchphantom-daily'
    }
  },
  {
    id: 'researchphantom-studio',
    title: 'ResearchPhantom Studio',
    sub: '論文を一冊の本として読む',
    date: '2026.09',
    cats: ['research', 'creative'],
    series: 'phantom',
    hue: 24,
    summary: '論文フィードを「装丁された本」として読む静的サイト。紙芝居版、データ図版、技術を職業キャラにするCAST LABも。',
    tech: ['HTML/CSS/JS', 'デザイントークン', 'GitHub Pages'],
    links: {
      live: 'https://ryosaku610.github.io/ResearchPhantom-Studio/',
      repo: 'https://github.com/RyoSAKu610/ResearchPhantom-Studio',
      extra: [
        { label: '紙芝居版', url: 'https://ryosaku610.github.io/ResearchPhantom-Studio/character-story.html' },
        { label: 'CAST LAB', url: 'https://ryosaku610.github.io/ResearchPhantom-Studio/cast-lab.html' }
      ]
    }
  },
  {
    id: 'researchphantom-lp',
    title: 'ResearchPhantom LP',
    sub: '論文を7場面で。',
    date: '2026.10',
    cats: ['research', 'ai'],
    series: 'phantom',
    hue: 12,
    summary: 'Studioのランディングページと、登録不要で読める無料論文リーダー。arXiv検索とオープンアクセス確認つき。',
    tech: ['TypeScript', 'Vite', 'Node.js', 'arXiv API'],
    links: { repo: 'https://github.com/RyoSAKu610/research-phantom-landing-page' }
  },
  {
    id: 'ascii-atelier',
    title: 'ASCII ATELIER',
    sub: '文字だけのアトリエと箱庭',
    date: '2026.09',
    cats: ['creative'],
    hue: 96,
    summary: 'お題や画像からASCIIアートを生成・編集・書き出し。作品からそのまま遊べる横スクロールの世界も生まれます。',
    tech: ['JavaScript', 'Canvas', 'PWA', 'localStorage'],
    links: {
      live: 'https://ryosaku610.github.io/ASCII-ATELIER/',
      repo: 'https://github.com/RyoSAKu610/ASCII-ATELIER'
    }
  },
  {
    id: 'tokoyo',
    title: '常世 TOKOYO',
    sub: '転生譚',
    date: '2026.07',
    cats: ['creative'],
    hue: 268,
    summary: '言葉で望む世界を告げ、問診に答え、転生してその世界に降り立つ。three.jsで描く物語体験。',
    tech: ['three.js', 'GSAP', 'WebGL', 'Web Audio'],
    links: { repo: 'https://github.com/RyoSAKu610/tokoyo' }
  },
  {
    id: 'pocket-mine',
    title: 'Pocket Mine',
    sub: 'AI Battery Screening',
    date: '2026.06',
    cats: ['ai', 'tool'],
    hackathon: 'ハッカソン出品',
    hue: 52,
    summary: '空港のリチウム電池検査を、写真1枚から「搭乗可・要確認・搭乗不可」の判断へ変えるデモ。',
    tech: ['JavaScript', 'Gemini（構想）', 'Cloud Run（構想）'],
    links: {
      live: 'https://ryosaku610.github.io/Pocket-mine/',
      repo: 'https://github.com/RyoSAKu610/Pocket-mine'
    }
  },
  {
    id: 'zawa-agent',
    title: 'ZAWA Agent',
    sub: 'Mantle DeFi Assistant',
    date: '2026.06',
    cats: ['ai', 'web3'],
    hackathon: 'ハッカソン出品',
    hue: 150,
    summary: '少額ウォレット向けにDeFiの選択肢を比較し、危ない経路は止め、署名前の取引をシミュレーションするキャラクター型エージェント。',
    tech: ['HTML/CSS/JS', 'Mantle', 'DeFi'],
    links: { repo: 'https://github.com/RyoSAKu610/zawazawa' }
  },
  {
    id: 'agent-arcade',
    title: 'Agent Arcade: Neon Myths',
    sub: 'Codex Pets',
    date: '2026.08',
    cats: ['creative', 'ai'],
    series: 'mythos',
    hue: 200,
    summary: 'NEON MYTHOSにキャラクター素材と音楽を載せた、インストール不要のシミュレーション。',
    tech: ['JavaScript', 'スプライト', 'BGM'],
    links: {
      live: 'https://ryosaku610.github.io/Final/neon-mythos-codex-pets.html',
      repo: 'https://github.com/RyoSAKu610/Agent-arcade-Neon-myths'
    }
  },
  {
    id: 'neon-mythos-os',
    title: 'Neon Mythos OS',
    sub: '経済のある集合知OS',
    date: '2026.10',
    cats: ['ai', 'tool'],
    series: 'mythos',
    hue: 176,
    summary: '依頼→契約→タスク→検証→台帳→評判までを1本の流れで扱う、エージェント経済の土台。',
    tech: ['TypeScript', 'pnpm / Turborepo', 'Supabase', 'Vercel'],
    links: { repo: 'https://github.com/RyoSAKu610/neon-mythos' }
  },
  {
    id: 'kusama',
    title: 'Neon Mythos City',
    sub: 'React版プロトタイプ',
    date: '2026.04',
    cats: ['ai', 'web3', 'creative'],
    series: 'mythos',
    hue: 210,
    summary: '空腹や疲れに合わせて酒場や市場を自律的に行き来するエージェントたち。Solanaのエージェント登録も試作。',
    tech: ['React', 'Vite', 'Solana', 'Metaplex'],
    links: { repo: 'https://github.com/RyoSAKu610/KUSAMA' }
  },
  {
    id: 'agent-clickhouse',
    title: 'Agent ClickHouse',
    sub: 'NEON MYTHOSの原点',
    date: '2026.03',
    cats: ['ai'],
    series: 'mythos',
    hue: 222,
    summary: 'エージェント経済のバックエンドとクライアントを最初に分けて作った試作。NEON MYTHOSはここから始まりました。',
    tech: ['TypeScript', 'React', 'Node.js'],
    links: { repo: 'https://github.com/RyoSAKu610/agent-clickhouse' }
  },
  {
    id: 'qa-copilot',
    title: 'qa-copilot',
    sub: 'Human-gated QA Agent',
    date: '2026.10',
    cats: ['ai', 'tool'],
    hue: 120,
    summary: 'QA案件を探して報酬×適合度で並べ、テスト環境準備からレポートまで支援。応募や送信は絶対にしない「最後は人間」設計。',
    tech: ['Python', 'CLI', 'Playwright'],
    links: { repo: 'https://github.com/RyoSAKu610/qa-copilot' }
  },
  {
    id: 'qa-bounty-agent',
    title: 'QA Bounty Agent',
    sub: 'Policy-gated Local Agent',
    date: '2026.09',
    cats: ['ai', 'tool'],
    hackathon: 'Agent Hackathon',
    hue: 110,
    summary: '各サービスの規約を読み込んだポリシーゲートつきのQA支援エージェント。許可された対象だけを読み取り専用で自動テスト。',
    tech: ['Python', 'Playwright', 'メール解析'],
    links: { repo: 'https://github.com/RyoSAKu610/Agent-hackathon' }
  },
  {
    id: 'journey-talk-radio',
    title: 'Journey Talk Radio',
    sub: 'ニュース多言語ポッドキャスト台本',
    date: '2026.10',
    cats: ['ai', 'tool'],
    hue: 300,
    summary: 'ニュースRSSから語学学習用の台本を、検品済みの固定カタログと完全一致引用だけで組み立てる。AIに嘘を書かせない構成。',
    tech: ['Python', 'Ollama', 'PowerShell', 'GitHub Actions'],
    links: { repo: 'https://github.com/RyoSAKu610/journey-talk-radio' }
  },
  {
    id: 'second-brain',
    title: '第2の脳',
    sub: 'ローカル継続記憶',
    date: '2026.10',
    cats: ['ai', 'tool'],
    hue: 78,
    summary: '方針・根拠つき記憶・訂正履歴をSQLiteに残し、どのAIにも持ち運べるCLI。外部通信なし、標準ライブラリのみ。',
    tech: ['Python', 'SQLite', 'GitHub Actions'],
    links: { repo: 'https://github.com/RyoSAKu610/Sol-2nd-slime-' }
  },
  {
    id: 'technocore-jp-kit',
    title: 'technocore-jp-kit',
    sub: '日本語対応ローカルキット',
    date: '2026.08',
    cats: ['web3', 'tool'],
    hue: 240,
    summary: '日本語の文章をURLに載せずに署名・投稿できるローカルキット。秘密情報は手元から出しません。',
    tech: ['Python', 'uv', 'DID / 署名'],
    links: { repo: 'https://github.com/RyoSAKu610/technocore-jp-kit' }
  },
  {
    id: 'safe-mint',
    title: 'Safe Mint FingerCheck',
    sub: '指差し確認つきMint補助',
    date: '2026.09',
    cats: ['web3', 'tool'],
    hue: 30,
    summary: 'Mint候補を監視して取引を準備し、最後の署名だけ本人がウォレットで承認。秘密鍵を一切預からない設計。',
    tech: ['Node.js', 'OpenSea API', 'EVM'],
    links: { repo: 'https://github.com/RyoSAKu610/designlab' }
  },
  {
    id: 'docodemo-crossing',
    title: 'Docodemo Crossing',
    sub: 'Web3名刺',
    date: '2026.02',
    cats: ['web3', 'ai'],
    hue: 280,
    summary: 'オンチェーンの行動から人柄を動物で表し、イベントでの初対面の会話のきっかけにするSolanaアプリの企画。',
    tech: ['Solana', 'NFT', '企画・ピッチ'],
    links: { repo: 'https://github.com/RyoSAKu610/docodemocrossing' }
  },
  {
    id: 'clawmaid',
    title: 'clawmaid',
    sub: 'AIメール秘書',
    date: '2026.05',
    cats: ['ai', 'tool'],
    hue: 340,
    summary: '重要度・要約・締切をAIが判定し、「メールを読む」作業を減らすMCPベースの受信箱の構想。',
    tech: ['Claude API', 'MCP', 'Gmail'],
    links: { repo: 'https://github.com/RyoSAKu610/clawmaid' }
  }
];
