import fs from 'fs';
import readline from 'readline';

async function main() {
  const path = '/Users/prathamnagarmote/.gemini/antigravity-ide/brain/634a3eff-7333-45cf-a566-f526d3305103/.system_generated/logs/transcript.jsonl';
  if (!fs.existsSync(path)) {
    console.log('Path does not exist:', path);
    return;
  }
  const fileStream = fs.createReadStream(path);

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const matches = [];

  for await (const line of rl) {
    try {
      const step = JSON.parse(line);
      if (step.source === 'USER_EXPLICIT' && step.type === 'USER_INPUT') {
        const content = step.content || '';
        matches.push({
          step_index: step.step_index,
          created_at: step.created_at,
          content: content
        });
      }
    } catch (e) {
      // ignore
    }
  }

  console.log(`Found ${matches.length} user inputs in old conversation:`);
  for (const m of matches) {
    console.log(`\n--- STEP ${m.step_index} (${m.created_at}) ---`);
    console.log(m.content);
  }
}

main();
