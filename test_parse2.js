const acorn = require('acorn');
const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf-8');

const regex = /<script>([\s\S]*?)<\/script>/g;
let match;
while ((match = regex.exec(html)) !== null) {
  const scriptContent = match[1];
  try {
    acorn.parse(scriptContent, { ecmaVersion: 2020 });
    console.log("Script block is valid");
  } catch(e) {
    console.error("Script block has error:", e.message);
  }
}
