-- Limpiar políticas duplicadas de la tabla notifications
-- Ejecutar DESPUÉS de haber creado la tabla y las políticas

-- Eliminar políticas con nombres cortos/viejos (duplicadas)
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;

-- Las políticas correctas que deben quedar son:
-- ✅ "Service role can insert notifications"
-- ✅ "Users can delete their own notifications"
-- ✅ "Users can update their own notifications"
-- ✅ "Users can view their own notifications"
