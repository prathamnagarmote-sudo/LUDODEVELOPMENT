import fs from 'fs';
import readline from 'readline';

async function main() {
  const fileStream = fs.createReadStream('/Users/prathamnagarmote/.gemini/antigravity-ide/brain/d2d2cfc8-bfc2-4a62-9b51-5cb598a0094d/.system_generated/logs/transcript.jsonl');

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
        if (content.toLowerCase().includes('board') || content.toLowerCase().includes('box') || content.toLowerCase().includes('extra')) {
          matches.push({
            step_index: step.step_index,
            created_at: step.created_at,
            content: content
          });
        }
      }
    } catch (e) {
      // ignore parse errors
    }
  }

  console.log(`Found ${matches.length} matching user inputs:`);
  // Print the last 15 matching user inputs
  const lastMatches = matches.slice(-15);
  for (const m of lastMatches) {
    console.log(`\n--- STEP ${m.step_index} (${m.created_at}) ---`);
    console.log(m.content);
  }
}

main();
