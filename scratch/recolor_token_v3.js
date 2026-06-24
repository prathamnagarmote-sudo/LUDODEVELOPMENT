import sharp from 'sharp';
import path from 'path';

const srcPath = 'c:/Users/ASUS/LUDODEVELOPMENT/src/assets/broken_token.png';
const assetsDir = 'c:/Users/ASUS/LUDODEVELOPMENT/src/assets';

async function recolor() {
  try {
    const { data, info } = await sharp(srcPath)
      .raw()
      .toBuffer({ resolveWithObject: true });

    const { width, height, channels } = info;

    const blueData = Buffer.alloc(data.length);
    const redData = Buffer.alloc(data.length);
    const yellowData = Buffer.alloc(data.length);

    for (let i = 0; i < data.length; i += channels) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];
      let a = data[i + 3];

      // Strict green filter: matches highly saturated green circle, rocks, and particles.
      // Since the clouds and silver border are white/grey/cream, they have low green saturation (g/r and g/b close to 1)
      // and will be completely ignored, keeping them clean.
      const isGreen = g > 50 && g > r * 1.25 && g > b * 1.25;

      if (isGreen) {
        // Blue: swap G and B
        blueData[i] = r;
        blueData[i + 1] = b;
        blueData[i + 2] = g;
        blueData[i + 3] = a;

        // Red: swap G and R
        redData[i] = g;
        redData[i + 1] = r;
        redData[i + 2] = b;
        redData[i + 3] = a;

        // Yellow: G and R are both high
        yellowData[i] = g;
        yellowData[i + 1] = g;
        yellowData[i + 2] = b;
        yellowData[i + 3] = a;
      } else {
        // Keep original pixel (silver border, clouds, background)
        blueData[i] = r;
        blueData[i + 1] = g;
        blueData[i + 2] = b;
        blueData[i + 3] = a;

        redData[i] = r;
        redData[i + 1] = g;
        redData[i + 2] = b;
        redData[i + 3] = a;

        yellowData[i] = r;
        yellowData[i + 1] = g;
        yellowData[i + 2] = b;
        yellowData[i + 3] = a;
      }
    }

    // Save images
    await sharp(blueData, { raw: { width, height, channels } })
      .png()
      .toFile(path.join(assetsDir, 'broken_token_blue.png'));

    await sharp(redData, { raw: { width, height, channels } })
      .png()
      .toFile(path.join(assetsDir, 'broken_token_red.png'));

    await sharp(yellowData, { raw: { width, height, channels } })
      .png()
      .toFile(path.join(assetsDir, 'broken_token_yellow.png'));

    console.log('Successfully generated complete color-mapped token assets (circle, rocks, and particles all colored)!');
  } catch (err) {
    console.error('Error generating assets:', err);
  }
}

recolor();
