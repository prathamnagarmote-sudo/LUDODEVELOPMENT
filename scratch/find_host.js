

async function main() {
  const url = 'https://testingtheludo.vercel.app/assets/index-DIXO9abk.js';
  const res = await fetch(url);
  const text = await res.text();
  
  console.log('File size:', text.length);
  
  // Search for the Client construction: new Client(..., ..., ..., ...)
  // Let's search for "defaultkey" or "7350" or "up.railway.app" or similar strings
  const index = text.indexOf('7350');
  if (index !== -1) {
    console.log('Found 7350 at index:', index);
    console.log('Snippet around 7350:', text.slice(Math.max(0, index - 200), index + 200));
  } else {
    console.log('Could not find 7350');
  }

  // Let's match anything ending in .railway.app or similar
  const matches = text.match(/[a-zA-Z0-9.-]+\.railway\.app/g);
  console.log('Matches for railway.app:', matches);

  // Let's match anything with Port
  const ports = text.match(/7350|7351|7349/g);
  console.log('Matches for ports:', ports);
}

main();
