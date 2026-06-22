const fs = require('fs');
const readline = require('readline');

const fileStream = fs.createReadStream('/Users/prathamnagarmote/.gemini/antigravity-ide/brain/3f63e1a1-98e7-4b4a-9d98-6cdc61782cda/.system_generated/logs/transcript.jsonl');
const rl = readline.createInterface({
  input: fileStream,
  crlfDelay: Infinity
});

rl.on('line', (line) => {
  try {
    const obj = JSON.parse(line);
    if (obj.step_index === 4266) {
      const content = obj.content;
      // Search for Step 64 in the markdown text
      const idx = content.indexOf('Step 64: capture_browser_console_logs');
      if (idx !== -1) {
        console.log(content.substring(idx, idx + 2000));
      } else {
        console.log("Step 64 not found in content");
      }
      process.exit(0);
    }
  } catch (e) {
    // ignore
  }
});
