import sharp from 'sharp';

async function samplePixels() {
  const { data, info } = await sharp('c:/Users/ASUS/LUDODEVELOPMENT/src/assets/broken_token.png')
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  
  console.log('Sampling pixels inside green bounds:');
  
  // Let's sample a few pixels to see their values
  for (let y = 300; y < 550; y += 30) {
    for (let x = 200; x < 500; x += 50) {
      const idx = (y * width + x) * channels;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      
      // If it's a green pixel
      if (g > 60 && g > r * 1.15 && g > b * 1.15) {
        console.log(`X: ${x}, Y: ${y} -> R: ${r}, G: ${g}, B: ${b} | G/R: ${(g/r).toFixed(2)}, G/B: ${(g/b).toFixed(2)}`);
      }
    }
  }
}

samplePixels();
