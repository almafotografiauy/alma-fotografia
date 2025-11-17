/**
 * Script para limpiar enlaces duplicados de gallery_shares
 *
 * Este script elimina enlaces duplicados, manteniendo solo el más reciente
 * de cada galería que esté activo.
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

async function cleanupDuplicateShares() {
  // Leer variables de entorno
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Error: Variables de entorno no configuradas');
    console.error('Asegúrate de tener:');
    console.error('  - NEXT_PUBLIC_SUPABASE_URL');
    console.error('  - SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  console.log('🔄 Conectando a Supabase...');
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    console.log('📊 Obteniendo todos los enlaces compartidos...');

    // 1. Obtener todos los enlaces
    const { data: allShares, error: fetchError } = await supabase
      .from('gallery_shares')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('❌ Error al obtener enlaces:', fetchError);
      process.exit(1);
    }

    console.log(`✅ Encontrados ${allShares.length} enlaces en total`);

    // 2. Agrupar por gallery_id
    const sharesByGallery = {};
    allShares.forEach(share => {
      if (!sharesByGallery[share.gallery_id]) {
        sharesByGallery[share.gallery_id] = [];
      }
      sharesByGallery[share.gallery_id].push(share);
    });

    console.log(`📁 Galerías con enlaces: ${Object.keys(sharesByGallery).length}`);

    // 3. Identificar enlaces a eliminar
    let toDelete = [];
    let toKeep = [];

    for (const [galleryId, shares] of Object.entries(sharesByGallery)) {
      if (shares.length > 1) {
        console.log(`\n⚠️  Galería ${galleryId} tiene ${shares.length} enlaces:`);

        // Ordenar por fecha (el más reciente primero)
        shares.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        // Buscar el enlace activo más reciente
        const activeShare = shares.find(s => s.is_active);
        const keepShare = activeShare || shares[0]; // Si no hay activo, mantener el más reciente

        console.log(`  ✓ Mantener: ${keepShare.id} (${keepShare.is_active ? 'activo' : 'inactivo'}, ${new Date(keepShare.created_at).toLocaleString()})`);
        toKeep.push(keepShare.id);

        // Marcar el resto para eliminar
        shares.forEach(share => {
          if (share.id !== keepShare.id) {
            console.log(`  ✗ Eliminar: ${share.id} (${share.is_active ? 'activo' : 'inactivo'}, ${new Date(share.created_at).toLocaleString()})`);
            toDelete.push(share.id);
          }
        });
      } else {
        toKeep.push(shares[0].id);
      }
    }

    console.log(`\n📊 Resumen:`);
    console.log(`  - Enlaces a mantener: ${toKeep.length}`);
    console.log(`  - Enlaces a eliminar: ${toDelete.length}`);

    if (toDelete.length === 0) {
      console.log('\n✅ No hay enlaces duplicados para eliminar');
      return;
    }

    // 4. Confirmar eliminación
    console.log(`\n⚠️  ¿Deseas eliminar ${toDelete.length} enlaces duplicados?`);
    console.log('Esta acción NO se puede deshacer.');
    console.log('\nPara continuar, ejecuta el script con el flag --confirm:');
    console.log('node scripts/cleanup-duplicate-shares.js --confirm');

    // Verificar si se pasó el flag --confirm
    const confirmFlag = process.argv.includes('--confirm');

    if (!confirmFlag) {
      console.log('\n⏸️  Ejecución en modo PREVIEW. No se eliminó nada.');
      process.exit(0);
    }

    // 5. Eliminar enlaces duplicados
    console.log('\n🗑️  Eliminando enlaces duplicados...');

    const { error: deleteError } = await supabase
      .from('gallery_shares')
      .delete()
      .in('id', toDelete);

    if (deleteError) {
      console.error('❌ Error al eliminar enlaces:', deleteError);
      process.exit(1);
    }

    console.log(`\n✅ ¡Limpieza completada!`);
    console.log(`   Eliminados: ${toDelete.length} enlaces duplicados`);
    console.log(`   Mantenidos: ${toKeep.length} enlaces únicos`);

  } catch (error) {
    console.error('❌ Error inesperado:', error);
    process.exit(1);
  }
}

cleanupDuplicateShares();
