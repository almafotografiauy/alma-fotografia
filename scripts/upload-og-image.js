const { v2: cloudinary } = require('cloudinary');
const path = require('path');

// Configurar Cloudinary
cloudinary.config({
  cloud_name: 'dav2dvukf',
  api_key: '935116792182475',
  api_secret: 'GicB1_-_Xs8pupFeJ6Q1hJBl0EU',
});

async function uploadOGImage() {
  try {
    console.log('Subiendo logo a Cloudinary...');

    const logoPath = path.join(__dirname, '../public/img/logos/logo_BN_SF.png');

    // Subir el logo
    const result = await cloudinary.uploader.upload(logoPath, {
      folder: 'alma-fotografia',
      public_id: 'logo-og',
      overwrite: true,
    });

    console.log('✅ Logo subido exitosamente!');
    console.log('URL original:', result.secure_url);

    // Generar URL con transformaciones para OG image (1200x630, fondo oscuro, logo centrado y más pequeño)
    const ogUrl = cloudinary.url(result.public_id, {
      transformation: [
        { width: 400, crop: 'scale' }, // Logo más pequeño
        { width: 1200, height: 630, crop: 'pad', background: '#2D2D2D', gravity: 'center' }
      ],
      secure: true
    });

    console.log('\n📋 URL para Open Graph (usar esta en layout.js):');
    console.log(ogUrl);

  } catch (error) {
    console.error('Error:', error);
  }
}

uploadOGImage();
