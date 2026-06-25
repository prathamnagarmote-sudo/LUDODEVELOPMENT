import sharp from 'sharp';

async function analyze() {
  const { info } = await sharp('c:/Users/ASUS/LUDODEVELOPMENT/src/assets/broken_token.png')
    .raw()
    .toBuffer({ resolveWithObject: true });
  console.log('Image dimensions:', info.width, 'x', info.height);
}
analyze();
