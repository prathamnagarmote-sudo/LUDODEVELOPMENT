async function main() {
  const url = 'https://testingtheludo.vercel.app/assets/index-DIXO9abk.js';
  const res = await fetch(url);
  const text = await res.text();

  // Find occurrences of "new wR(" or matching the constructor
  // Wait, let's find wR definition again: "wR=class{"
  // Let's search for "new wR" or "new " followed by the client class name
  // The class was named wR in the snippet
  const matches = text.match(/new wR\([^)]*\)/g);
  console.log('Matches for new wR:', matches);

  // Let's search for the text "defaultkey" and print around it
  let idx = 0;
  while (true) {
    idx = text.indexOf('defaultkey', idx);
    if (idx === -1) break;
    console.log('Found defaultkey at:', idx);
    console.log('Snippet:', text.slice(Math.max(0, idx - 100), idx + 200));
    idx += 10;
  }
  
  // Let's also print around "nakama-production-e5b8.up.railway.app"
  let hostIdx = text.indexOf('nakama-production-e5b8.up.railway.app');
  if (hostIdx !== -1) {
    console.log('Found host at:', hostIdx);
    console.log('Snippet around host:', text.slice(Math.max(0, hostIdx - 150), hostIdx + 150));
  }
}

main();
