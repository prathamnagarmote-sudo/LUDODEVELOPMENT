async function main() {
  const url = 'https://testingtheludo.vercel.app/';
  try {
    const res = await fetch(url);
    const html = await res.text();
    
    // Find script tag matching /assets/index-*.js
    const scriptMatch = html.match(/src="(\/assets\/index-[a-zA-Z0-9_-]+\.js)"/);
    if (!scriptMatch) {
      console.log('Could not find script tag in HTML:', html);
      return;
    }
    
    const scriptUrl = 'https://testingtheludo.vercel.app' + scriptMatch[1];
    console.log('Found script URL:', scriptUrl);
    
    const scriptRes = await fetch(scriptUrl);
    const js = await scriptRes.text();
    
    // Search for keywords
    const hostIdx = js.indexOf('.railway.app');
    if (hostIdx !== -1) {
      console.log('Host found in JS bundle:', js.slice(hostIdx - 50, hostIdx + 50));
    } else {
      console.log('No .railway.app found in JS bundle.');
    }
    
    const localHostIdx = js.indexOf('127.0.0.1');
    if (localHostIdx !== -1) {
      console.log('Localhost found in JS bundle:', js.slice(localHostIdx - 50, localHostIdx + 50));
    }

    const keyIdx = js.indexOf('defaultkey');
    if (keyIdx !== -1) {
      console.log('Key found in JS bundle:', js.slice(keyIdx - 50, keyIdx + 50));
    }
  } catch (e) {
    console.error('Failed:', e);
  }
}

main();
