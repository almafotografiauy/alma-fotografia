'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

/**
 * Verificar si el usuario actual es admin
 */
export async function isAdmin() {
  try {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Handle error if needed
            }
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return false;
    }

    // Los admins son identificados por el role en metadata
    return user.user_metadata?.role === 'admin';
  } catch (error) {
    return false;
  }
}

/**
 * Obtener lista de todos los usuarios (solo admin)
 */
export async function getAllUsers() {
  try {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Handle error if needed
            }
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'No autenticado' };
    }

    // Obtener perfil del usuario actual para verificar permisos
    const { data: currentProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return {
        success: false,
        error: `Error obteniendo perfil: ${profileError.message}. Asegurate de ejecutar los SQLs en Supabase.`
      };
    }

    if (!currentProfile) {
      return {
        success: false,
        error: 'No se encontró perfil para este usuario. Ejecutá el SQL para crear tu perfil como admin.'
      };
    }

    if (!currentProfile.permissions?.manage_users) {
      return {
        success: false,
        error: `No tenés permisos de administrador. Ejecutá: UPDATE user_profiles SET permissions = jsonb_set(permissions, '{manage_users}', 'true') WHERE email = '${user.email}';`
      };
    }

    // Obtener todos los perfiles
    const { data: users, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      users: users || []
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Crear nuevo usuario (solo admin)
 */
export async function createUser({ email, password, full_name, permissions }) {
  try {
    const adminCheck = await isAdmin();
    if (!adminCheck) {
      return { success: false, error: 'No autorizado' };
    }

    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Handle error if needed
            }
          },
        },
      }
    );

    // Validar contraseña segura
    if (password.length < 8) {
      return { success: false, error: 'La contraseña debe tener al menos 8 caracteres' };
    }

    if (!/[A-Z]/.test(password)) {
      return { success: false, error: 'La contraseña debe contener al menos una mayúscula' };
    }

    if (!/[a-z]/.test(password)) {
      return { success: false, error: 'La contraseña debe contener al menos una minúscula' };
    }

    if (!/[0-9]/.test(password)) {
      return { success: false, error: 'La contraseña debe contener al menos un número' };
    }

    // Crear usuario usando Admin API
    const { data, error } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Auto-confirmar email
      user_metadata: {
        full_name: full_name || '',
        role: 'user',
        permissions: permissions || ['dashboard', 'galleries', 'testimonials', 'agenda'],
        instagram: '@almafotografiauy',
        facebook: 'Alma Fotografía',
        tiktok: '@almafotografiauy',
      }
    });

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/configuracion/perfil');

    return {
      success: true,
      message: 'Usuario creado correctamente',
      user: data.user
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Actualizar información de usuario (solo admin)
 */
export async function updateUser({ userId, full_name, username, permissions }) {
  try {
    const cookieStore = await cookies();

    // Cliente normal para verificar autenticación
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Handle error if needed
            }
          },
        },
      }
    );

    // Cliente admin para operaciones privilegiadas (bypasea RLS)
    const supabaseAdmin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Handle error if needed
            }
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'No autenticado' };
    }

    // Verificar permisos del usuario actual
    const { data: currentProfile } = await supabase
      .from('user_profiles')
      .select('permissions')
      .eq('id', user.id)
      .single();

    if (!currentProfile?.permissions?.manage_users) {
      return { success: false, error: 'No autorizado' };
    }

    // Asegurar que permissions sea un objeto válido
    const permissionsToSave = permissions || {};

    console.log('📝 Actualizando usuario:', userId);
    console.log('📝 Permisos a guardar:', JSON.stringify(permissionsToSave));

    // Actualizar perfil usando cliente ADMIN para bypasear RLS
    const { data: updatedData, error } = await supabaseAdmin
      .from('user_profiles')
      .update({
        full_name: full_name?.trim() || null,
        username: username?.trim() || null,
        permissions: permissionsToSave
      })
      .eq('id', userId)
      .select();

    if (error) {
      console.error('❌ Error actualizando usuario:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Usuario actualizado:', JSON.stringify(updatedData));

    revalidatePath('/dashboard/configuracion/usuarios');

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Actualizar permisos de usuario (solo admin)
 * @deprecated Use updateUser instead
 */
export async function updateUserPermissions({ userId, permissions }) {
  return updateUser({ userId, permissions });
}

/**
 * Activar/Desactivar usuario (solo admin)
 */
export async function toggleUserStatus({ userId, isActive }) {
  try {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Handle error if needed
            }
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'No autenticado' };
    }

    // Protección: No permitir deshabilitarse a sí mismo
    if (userId === user.id && !isActive) {
      return { success: false, error: 'No podés deshabilitarte a vos mismo' };
    }

    // Verificar permisos
    const { data: currentProfile } = await supabase
      .from('user_profiles')
      .select('permissions, email')
      .eq('id', user.id)
      .single();

    if (!currentProfile?.permissions?.manage_users) {
      return { success: false, error: 'No autorizado' };
    }

    // Obtener el perfil del usuario a modificar
    const { data: targetProfile } = await supabase
      .from('user_profiles')
      .select('email')
      .eq('id', userId)
      .single();

    // Ya no bloqueamos deshabilitar al admin, solo nos bloqueamos a nosotros mismos

    // Actualizar estado
    const { error } = await supabase
      .from('user_profiles')
      .update({ is_active: isActive })
      .eq('id', userId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/configuracion/usuarios');

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Cambiar contraseña de otro usuario (solo admin)
 * Admin puede cambiar contraseña de Fer, pero Fer NO puede cambiar la de Admin
 */
export async function changeUserPassword({ userId, newPassword }) {
  try {
    const cookieStore = await cookies();

    // Cliente para autenticación del usuario actual
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Handle error if needed
            }
          },
        },
      }
    );

    // Cliente admin para operaciones privilegiadas
    const supabaseAdmin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Handle error if needed
            }
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'No autenticado' };
    }

    // Verificar permisos
    const { data: currentProfile } = await supabase
      .from('user_profiles')
      .select('permissions, email')
      .eq('id', user.id)
      .single();

    if (!currentProfile?.permissions?.manage_users) {
      return { success: false, error: 'No autorizado' };
    }

    // Obtener el perfil del usuario a modificar
    const { data: targetProfile } = await supabase
      .from('user_profiles')
      .select('email')
      .eq('id', userId)
      .single();

    // Protección: Fernanda NO puede cambiar contraseña del admin principal
    if (targetProfile?.email === 'admin@gmail.com' && currentProfile.email !== 'admin@gmail.com') {
      return { success: false, error: 'No tenés permiso para cambiar la contraseña del administrador principal' };
    }

    // Validar contraseña segura
    if (newPassword.length < 8) {
      return { success: false, error: 'La contraseña debe tener al menos 8 caracteres' };
    }

    if (!/[A-Z]/.test(newPassword)) {
      return { success: false, error: 'La contraseña debe contener al menos una mayúscula' };
    }

    if (!/[a-z]/.test(newPassword)) {
      return { success: false, error: 'La contraseña debe contener al menos una minúscula' };
    }

    if (!/[0-9]/.test(newPassword)) {
      return { success: false, error: 'La contraseña debe contener al menos un número' };
    }

    // Cambiar contraseña usando Admin API con cliente admin
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword
    });

    if (error) {
      return { success: false, error: error.message };
    }

    // Marcar que requiere cambio de contraseña en el próximo login
    await supabase
      .from('user_profiles')
      .update({ requires_password_change: true })
      .eq('id', userId);

    revalidatePath('/dashboard/configuracion/usuarios');

    return { success: true, message: 'Contraseña actualizada. El usuario deberá cambiarla en su próximo inicio de sesión.' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Eliminar usuario (solo admin)
 */
export async function deleteUser(userId) {
  try {
    const cookieStore = await cookies();

    // Cliente para autenticación del usuario actual
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Handle error if needed
            }
          },
        },
      }
    );

    // Cliente admin para operaciones privilegiadas
    const supabaseAdmin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Handle error if needed
            }
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'No autenticado' };
    }

    // Verificar permisos
    const { data: currentProfile } = await supabase
      .from('user_profiles')
      .select('permissions')
      .eq('id', user.id)
      .single();

    if (!currentProfile?.permissions?.manage_users) {
      return { success: false, error: 'No autorizado' };
    }

    // Protección: No permitir eliminarse a sí mismo
    if (userId === user.id) {
      return { success: false, error: 'No podés eliminarte a vos mismo' };
    }

    // Obtener el perfil del usuario a eliminar
    const { data: targetProfile } = await supabase
      .from('user_profiles')
      .select('email')
      .eq('id', userId)
      .single();

    // Protección: No permitir eliminar al admin principal
    if (targetProfile?.email === 'admin@gmail.com') {
      return { success: false, error: 'No se puede eliminar al usuario admin principal' };
    }

    // Usar cliente admin para eliminar el usuario
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/configuracion/usuarios');

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
