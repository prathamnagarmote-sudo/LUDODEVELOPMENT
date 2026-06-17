async function main() {
  const url = 'https://nakama-production-e5b8.up.railway.app/healthz';
  try {
    const res = await fetch(url);
    console.log('Health check status:', res.status);
    console.log('Health check headers:', res.headers);
    const text = await res.text();
    console.log('Health check response:', text);
  } catch (err) {
    console.error('Failed to contact health check:', err);
  }
}

main();
