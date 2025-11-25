'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Mail,
  Shield,
  ShieldOff,
  Trash2,
  CheckCircle,
  XCircle,
  Edit,
  Save,
  X,
  Key
} from 'lucide-react';
import { updateUser, toggleUserStatus, deleteUser, changeUserPassword } from '@/app/actions/user-management-actions';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { createClient } from '@/lib/supabaseClient';

export default function UserManagementTable({ initialUsers }) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [editingUser, setEditingUser] = useState(null);
  const [changingPassword, setChangingPassword] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // Obtener usuario actual
  useEffect(() => {
    async function getCurrentUser() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        setCurrentUser(profile);
      }
    }
    getCurrentUser();
  }, []);

  const handleToggleStatus = async (userId, currentStatus) => {
    setLoading(true);
    setMessage(null);

    const result = await toggleUserStatus({
      userId,
      isActive: !currentStatus
    });

    if (result.success) {
      setUsers(prev => prev.map(u =>
        u.id === userId ? { ...u, is_active: !currentStatus } : u
      ));
      setMessage({ type: 'success', text: 'Estado actualizado correctamente' });
      router.refresh();
    } else {
      setMessage({ type: 'error', text: result.error || 'Error al actualizar estado' });
    }

    setLoading(false);
  };

  const handleDeleteUser = async (userId) => {
    setLoading(true);
    setMessage(null);

    const result = await deleteUser(userId);

    if (result.success) {
      setUsers(prev => prev.filter(u => u.id !== userId));
      setMessage({ type: 'success', text: 'Usuario eliminado correctamente' });
      router.refresh();
    } else {
      setMessage({ type: 'error', text: result.error || 'Error al eliminar usuario' });
    }

    setLoading(false);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!changingPassword) return;

    setLoading(true);
    setMessage(null);

    const formData = new FormData(e.target);
    const newPassword = formData.get('newPassword');

    const result = await changeUserPassword({
      userId: changingPassword.id,
      newPassword
    });

    if (result.success) {
      setMessage({ type: 'success', text: result.message });
      setChangingPassword(null);
      router.refresh();
    } else {
      setMessage({ type: 'error', text: result.error || 'Error al cambiar contraseña' });
    }

    setLoading(false);
  };

  const handleEditPermissions = (user) => {
    setEditingUser({
      ...user,
      permissions: { ...user.permissions }
    });
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;

    setLoading(true);
    setMessage(null);

    const result = await updateUser({
      userId: editingUser.id,
      full_name: editingUser.full_name,
      username: editingUser.username,
      permissions: editingUser.permissions
    });

    if (result.success) {
      setUsers(prev => prev.map(u =>
        u.id === editingUser.id ? {
          ...u,
          full_name: editingUser.full_name,
          username: editingUser.username,
          permissions: editingUser.permissions
        } : u
      ));
      setMessage({ type: 'success', text: 'Usuario actualizado correctamente' });
      setEditingUser(null);
      router.refresh();
    } else {
      setMessage({ type: 'error', text: result.error || 'Error al actualizar usuario' });
    }

    setLoading(false);
  };

  const handlePermissionToggle = (permissionKey) => {
    setEditingUser(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permissionKey]: !prev.permissions[permissionKey]
      }
    }));
  };

  // Ahora solo tenemos un permiso: gestionar usuarios
  const permissions = [
    { key: 'manage_users', label: 'Administrar usuarios' },
  ];

  // DEBUG: Mostrar en consola para verificar permisos

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      {/* Botón de crear usuario (solo admins) */}
      {currentUser?.permissions?.manage_users && (
        <div className="mb-6 flex justify-end">
          <button
            onClick={() => router.push('/auth/register')}
            className="w-full sm:w-auto px-4 py-2.5 bg-[#8B5E3C] text-white rounded-lg font-fira text-sm font-semibold hover:bg-[#6d4a2f] transition-all duration-200 flex items-center justify-center gap-2"
          >
            <User size={18} />
            <span>Crear nuevo usuario</span>
          </button>
        </div>
      )}

      {/* Mensaje de feedback */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className={`mb-6 p-4 rounded-xl border ${
            message.type === 'success'
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
          }`}
        >
          <div className="flex items-center gap-3">
            {message.type === 'success' ? (
              <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
            ) : (
              <XCircle size={20} className="text-red-600 flex-shrink-0" />
            )}
            <p className={`font-fira text-sm ${
              message.type === 'success' ? 'text-green-800' : 'text-red-800'
            }`}>
              {message.text}
            </p>
          </div>
        </motion.div>
      )}

      {/* Vista de Tabla (Desktop y Tablet) */}
      <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 lg:px-6 py-4 text-left font-fira text-sm font-semibold text-gray-700">
                  Usuario
                </th>
                <th className="hidden lg:table-cell px-6 py-4 text-left font-fira text-sm font-semibold text-gray-700">
                  Email
                </th>
                <th className="px-4 lg:px-6 py-4 text-center font-fira text-sm font-semibold text-gray-700">
                  Estado
                </th>
                <th className="hidden xl:table-cell px-6 py-4 text-left font-fira text-sm font-semibold text-gray-700">
                  Creado
                </th>
                <th className="px-4 lg:px-6 py-4 text-right font-fira text-sm font-semibold text-gray-700">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user, index) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 lg:px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#8B5E3C]/10 flex items-center justify-center flex-shrink-0">
                        <User size={18} className="text-[#8B5E3C]" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-fira text-sm font-semibold text-gray-900 truncate">
                          {user.full_name || 'Sin nombre'}
                        </p>
                        <p className="lg:hidden font-fira text-xs text-gray-500 truncate">
                          {user.email}
                        </p>
                        {user.permissions?.manage_users && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-xs font-medium font-fira mt-1">
                            <Shield size={10} />
                            Admin
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="hidden lg:table-cell px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-gray-400" />
                      <p className="font-fira text-sm text-gray-600 truncate">{user.email}</p>
                    </div>
                  </td>
                  <td className="px-4 lg:px-6 py-4 text-center">
                    {user.is_active ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium font-fira whitespace-nowrap">
                        <CheckCircle size={12} />
                        <span className="hidden lg:inline">Activo</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-700 rounded-full text-xs font-medium font-fira whitespace-nowrap">
                        <XCircle size={12} />
                        <span className="hidden lg:inline">Inactivo</span>
                      </span>
                    )}
                  </td>
                  <td className="hidden xl:table-cell px-6 py-4">
                    <p className="font-fira text-sm text-gray-600 whitespace-nowrap">
                      {format(new Date(user.created_at), "d 'de' MMM, yyyy", { locale: es })}
                    </p>
                  </td>
                  <td className="px-4 lg:px-6 py-4">
                    {currentUser?.permissions?.manage_users ? (
                      <div className="flex items-center justify-end gap-1.5 lg:gap-2">
                        <button
                          onClick={() => handleEditPermissions(user)}
                          disabled={loading}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Editar usuario"
                        >
                          <Edit size={16} />
                        </button>

                        <button
                          onClick={() => setChangingPassword(user)}
                          disabled={loading}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Cambiar contraseña"
                        >
                          <Key size={16} />
                        </button>

                        <button
                          onClick={() => handleToggleStatus(user.id, user.is_active)}
                          disabled={loading}
                          className={`p-2 rounded-lg transition-colors ${
                            user.is_active
                              ? 'text-amber-600 hover:bg-amber-50'
                              : 'text-green-600 hover:bg-green-50'
                          }`}
                          title={user.is_active ? 'Deshabilitar' : 'Habilitar'}
                        >
                          {user.is_active ? <ShieldOff size={16} /> : <Shield size={16} />}
                        </button>

                        <button
                          onClick={() => setDeletingUser(user)}
                          disabled={loading}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar usuario"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end">
                        <span className="font-fira text-xs text-gray-400">
                          Sin permisos
                        </span>
                      </div>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vista de Cards (Móvil) */}
      <div className="md:hidden space-y-4">
        {users.map((user, index) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-4"
          >
            {/* Header de la card */}
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-[#8B5E3C]/10 flex items-center justify-center flex-shrink-0">
                <User size={20} className="text-[#8B5E3C]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-fira text-base font-semibold text-gray-900 truncate">
                      {user.full_name || 'Sin nombre'}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Mail size={12} className="text-gray-400 flex-shrink-0" />
                      <p className="font-fira text-xs text-gray-600 truncate">{user.email}</p>
                    </div>
                  </div>
                  {/* Estado */}
                  {user.is_active ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium font-fira whitespace-nowrap flex-shrink-0">
                      <CheckCircle size={12} />
                      Activo
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 rounded-full text-xs font-medium font-fira whitespace-nowrap flex-shrink-0">
                      <XCircle size={12} />
                      Inactivo
                    </span>
                  )}
                </div>
                {user.permissions?.manage_users && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-xs font-medium font-fira mt-2">
                    <Shield size={10} />
                    Admin
                  </span>
                )}
              </div>
            </div>

            {/* Fecha de creación */}
            <div className="mb-4 pb-4 border-b border-gray-100">
              <p className="font-fira text-xs text-gray-500">
                Creado el {format(new Date(user.created_at), "d 'de' MMM, yyyy", { locale: es })}
              </p>
            </div>

            {/* Botones de acción */}
            {currentUser?.permissions?.manage_users ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleEditPermissions(user)}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors font-fira text-sm font-medium"
                >
                  <Edit size={16} />
                  <span>Editar</span>
                </button>

                <button
                  onClick={() => setChangingPassword(user)}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors font-fira text-sm font-medium"
                >
                  <Key size={16} />
                  <span>Contraseña</span>
                </button>

                <button
                  onClick={() => handleToggleStatus(user.id, user.is_active)}
                  disabled={loading}
                  className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg transition-colors font-fira text-sm font-medium ${
                    user.is_active
                      ? 'text-amber-700 bg-amber-50 hover:bg-amber-100'
                      : 'text-green-700 bg-green-50 hover:bg-green-100'
                  }`}
                >
                  {user.is_active ? <ShieldOff size={16} /> : <Shield size={16} />}
                  <span>{user.is_active ? 'Deshabilitar' : 'Habilitar'}</span>
                </button>

                <button
                  onClick={() => setDeletingUser(user)}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors font-fira text-sm font-medium"
                >
                  <Trash2 size={16} />
                  <span>Eliminar</span>
                </button>
              </div>
            ) : (
              <div className="text-center py-2">
                <span className="font-fira text-sm text-gray-400">
                  Sin permisos de administración
                </span>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Modal de edición de permisos */}
      {editingUser && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setEditingUser(null)}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="bg-white rounded-t-3xl sm:rounded-2xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-voga text-xl text-gray-900">
                Editar Usuario
              </h3>
              <button
                onClick={() => setEditingUser(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Información del usuario */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block font-fira text-sm font-semibold text-gray-700 mb-2">
                  Nombre completo
                </label>
                <input
                  type="text"
                  value={editingUser.full_name || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, full_name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#8B5E3C] focus:ring-2 focus:ring-[#8B5E3C]/10 font-fira text-sm text-gray-900 transition-all"
                  placeholder="Ej: Fernanda García"
                />
              </div>

              <div>
                <label className="block font-fira text-sm font-semibold text-gray-700 mb-2">
                  Nombre de usuario
                </label>
                <input
                  type="text"
                  value={editingUser.username || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#8B5E3C] focus:ring-2 focus:ring-[#8B5E3C]/10 font-fira text-sm text-gray-900 transition-all"
                  placeholder="Ej: fernanda"
                />
              </div>

              <div>
                <label className="block font-fira text-sm font-semibold text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={editingUser.email || ''}
                  disabled
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 font-fira text-sm text-gray-500 cursor-not-allowed"
                />
                <p className="mt-1 font-fira text-xs text-gray-500">
                  El email no se puede modificar
                </p>
              </div>
            </div>

            {/* Permisos */}
            <div className="space-y-3 mb-6">
              <p className="font-fira text-sm font-semibold text-gray-700 mb-3">
                Permisos
              </p>
              {permissions.map(perm => (
                <label
                  key={perm.key}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={editingUser.permissions[perm.key] || false}
                    onChange={() => handlePermissionToggle(perm.key)}
                    className="w-4 h-4 text-[#8B5E3C] focus:ring-[#8B5E3C] rounded"
                  />
                  <span className="font-fira text-sm text-gray-700">{perm.label}</span>
                </label>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleSaveUser}
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-[#8B5E3C] text-white rounded-lg
                  font-fira text-sm font-semibold hover:bg-[#6d4a2f]
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Save size={18} />
                <span>Guardar cambios</span>
              </button>

              <button
                onClick={() => setEditingUser(null)}
                className="px-4 py-2.5 bg-gray-50 text-gray-700 border border-gray-200 rounded-lg
                  font-fira text-sm font-semibold hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Modal de cambio de contraseña */}
      <AnimatePresence>
        {changingPassword && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => setChangingPassword(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-t-3xl sm:rounded-2xl shadow-xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-voga text-xl text-gray-900">
                  Cambiar Contraseña
                </h3>
                <button
                  onClick={() => setChangingPassword(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mb-6">
                <p className="font-fira text-sm text-gray-600 mb-1">Usuario</p>
                <p className="font-fira text-base font-semibold text-gray-900">
                  {changingPassword.full_name}
                </p>
                <p className="font-fira text-sm text-gray-500 truncate">{changingPassword.email}</p>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-5">
                <div>
                  <label className="block font-fira text-sm font-semibold text-gray-700 mb-2">
                    Nueva contraseña
                  </label>
                  <input
                    type="password"
                    name="newPassword"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#8B5E3C] focus:ring-2 focus:ring-[#8B5E3C]/10 font-fira text-sm text-gray-900 transition-all"
                    placeholder="Mínimo 8 caracteres"
                    required
                    minLength={8}
                  />
                  <p className="mt-2 font-fira text-xs text-gray-500">
                    El usuario deberá cambiar esta contraseña en su próximo inicio de sesión
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2.5 bg-[#8B5E3C] text-white rounded-lg font-fira text-sm font-semibold hover:bg-[#6d4a2f] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Cambiando...</span>
                      </>
                    ) : (
                      <>
                        <Key size={18} />
                        <span>Cambiar contraseña</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setChangingPassword(null)}
                    className="px-4 py-2.5 bg-gray-50 text-gray-700 border border-gray-200 rounded-lg font-fira text-sm font-semibold hover:bg-gray-100 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de confirmación de eliminación */}
      <AnimatePresence>
        {deletingUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => setDeletingUser(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-t-3xl sm:rounded-2xl shadow-xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
                  <Trash2 size={32} className="text-red-600" />
                </div>
                <h3 className="font-voga text-xl text-gray-900 mb-2">
                  ¿Eliminar usuario?
                </h3>
                <p className="font-fira text-sm text-gray-600 mb-4">
                  Esta acción no se puede deshacer. El usuario será eliminado permanentemente.
                </p>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="font-fira text-sm font-semibold text-gray-900">
                    {deletingUser.full_name}
                  </p>
                  <p className="font-fira text-xs text-gray-600 truncate">{deletingUser.email}</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={async () => {
                    await handleDeleteUser(deletingUser.id);
                    setDeletingUser(null);
                  }}
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-fira text-sm font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? 'Eliminando...' : 'Eliminar'}
                </button>
                <button
                  onClick={() => setDeletingUser(null)}
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 bg-gray-50 text-gray-700 border border-gray-200 rounded-lg font-fira text-sm font-semibold hover:bg-gray-100 disabled:opacity-50 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {users.length === 0 && (
        <div className="text-center py-12">
          <User className="mx-auto mb-4 text-gray-300" size={48} />
          <p className="font-fira text-sm text-gray-500">
            No hay usuarios registrados
          </p>
        </div>
      )}
    </div>
  );
}
