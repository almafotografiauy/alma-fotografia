const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function generateFavicons() {
  try {
    // Usar logo blanco/negro sin fondo
    const logoPath = path.join(__dirname, '../public/img/logos/logo_BN_SF.png');
    const publicDir = path.join(__dirname, '../public');

    console.log('Generando favicons desde:', logoPath);

    // Verificar que el logo existe
    if (!fs.existsSync(logoPath)) {
      console.error('Logo no encontrado:', logoPath);
      return;
    }

    // Generar apple-touch-icon (180x180) con fondo oscuro
    await sharp(logoPath)
      .resize(140, 140, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .extend({
        top: 20,
        bottom: 20,
        left: 20,
        right: 20,
        background: { r: 45, g: 45, b: 45, alpha: 1 } // #2D2D2D
      })
      .png()
      .toFile(path.join(publicDir, 'apple-touch-icon.png'));
    console.log('✅ apple-touch-icon.png generado');

    // Generar favicon-32x32
    await sharp(logoPath)
      .resize(28, 28, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .extend({
        top: 2,
        bottom: 2,
        left: 2,
        right: 2,
        background: { r: 45, g: 45, b: 45, alpha: 1 }
      })
      .png()
      .toFile(path.join(publicDir, 'favicon-32x32.png'));
    console.log('✅ favicon-32x32.png generado');

    // Generar favicon-16x16
    await sharp(logoPath)
      .resize(14, 14, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .extend({
        top: 1,
        bottom: 1,
        left: 1,
        right: 1,
        background: { r: 45, g: 45, b: 45, alpha: 1 }
      })
      .png()
      .toFile(path.join(publicDir, 'favicon-16x16.png'));
    console.log('✅ favicon-16x16.png generado');

    // Generar favicon.ico (como PNG de 48x48, los navegadores modernos lo aceptan)
    await sharp(logoPath)
      .resize(40, 40, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .extend({
        top: 4,
        bottom: 4,
        left: 4,
        right: 4,
        background: { r: 45, g: 45, b: 45, alpha: 1 }
      })
      .png()
      .toFile(path.join(publicDir, 'favicon.ico'));
    console.log('✅ favicon.ico generado');

    console.log('\n🎉 Todos los favicons generados correctamente!');
  } catch (error) {
    console.error('Error:', error);
  }
}

generateFavicons();
