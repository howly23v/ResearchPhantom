// 他の実行が先に main へ保存した解説を失わないよう、origin/main の解説ファイルと和集合を取る。
// 同じ論文はこの実行(新しい方)を優先する。使い方: git fetch origin main && node scripts/merge_briefings.mjs
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const dir = 'data/briefings';
if (fs.existsSync(dir)) {
  for (const name of fs.readdirSync(dir).filter((f) => f.endsWith('.json'))) {
    const file = path.posix.join(dir, name);
    let remote = {};
    try {
      remote = JSON.parse(execFileSync('git', ['show', `origin/main:${file}`], { stdio: ['ignore', 'pipe', 'ignore'] }));
    } catch (_) { /* main にまだ無いファイル */ }
    const local = JSON.parse(fs.readFileSync(file, 'utf8'));
    const merged = { ...remote, ...local };
    const added = Object.keys(merged).length - Object.keys(local).length;
    if (added > 0) {
      const sorted = Object.fromEntries(Object.entries(merged).sort(([a], [b]) => a.localeCompare(b)));
      fs.writeFileSync(file, JSON.stringify(sorted) + '\n');
      console.log(`${file}: main 側の解説 ${added} 件を取り込み`);
    }
  }
}
