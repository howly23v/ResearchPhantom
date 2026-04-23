const fs = require('fs');
const code = fs.readFileSync('index.html', 'utf-8');
const scriptMatch = code.match(/<script>([\s\S]*?)<\/script>/);
if (scriptMatch) {
    try {
        new Function(scriptMatch[1]);
        console.log("JavaScript is syntactically valid.");
    } catch (e) {
        console.error("Syntax Error in JavaScript:", e.message);
    }
}
