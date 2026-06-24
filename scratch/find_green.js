import sharp from 'sharp';

async function findGreenBounds() {
  const { data, info } = await sharp('c:/Users/ASUS/LUDODEVELOPMENT/src/assets/broken_token.png')
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  let minX = width, maxX = 0, minY = height, maxY = 0;
  let count = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      
      // Strict green check
      if (g > 60 && g > r * 1.2 && g > b * 1.2) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        count++;
      }
    }
  }

  console.log(`Green pixels count: ${count}`);
  console.log(`Green bounds: X: [${minX}, ${maxX}], Y: [${minY}, ${maxY}]`);
}

findGreenBounds();
