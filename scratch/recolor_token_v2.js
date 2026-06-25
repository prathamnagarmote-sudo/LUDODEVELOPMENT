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

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * channels;
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];
        let a = data[i + 3];

        // Strict green filter: only highly saturated green, and only in the token vertical range (Y: 270 to 600)
        // This avoids touching the silver/white border or the clouds in the background completely.
        const isGreen = g > 55 && g > r * 1.26 && g > b * 1.26 && y >= 270 && y <= 600;

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
          // Keep original pixel (silver border, clouds, background, etc.)
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

    console.log('Successfully generated clean recolored token assets with no tinted border or clouds!');
  } catch (err) {
    console.error('Error generating assets:', err);
  }
}

recolor();
