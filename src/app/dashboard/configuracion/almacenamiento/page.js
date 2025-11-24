'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Database,
  HardDrive,
  Image,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  TrendingUp,
  Cloud
} from 'lucide-react';

export default function AlmacenamientoPage() {
  const [storageData, setStorageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchStorageData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/cloudinary-usage?t=${Date.now()}`, {
        cache: 'no-store'
      });
      const data = await response.json();

      if (data.success) {
        setStorageData(data.usage);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Error fetching storage:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStorageData();
  }, []);

  const getStorageStatus = () => {
    if (!storageData) return { color: 'gray', icon: Database, text: 'Cargando...' };

    const percentage = parseFloat(storageData.percentage);

    if (percentage < 50) {
      return { color: 'brown', icon: CheckCircle, text: 'Óptimo' };
    } else if (percentage < 80) {
      return { color: 'amber', icon: TrendingUp, text: 'Moderado' };
    } else {
      return { color: 'red', icon: AlertCircle, text: 'Crítico' };
    }
  };

  const status = getStorageStatus();

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="font-voga text-2xl sm:text-3xl text-gray-900">
            Almacenamiento
          </h1>
          <button
            onClick={fetchStorageData}
            disabled={loading}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
            title="Actualizar"
          >
            <RefreshCw
              size={20}
              className={`text-gray-600 ${loading ? 'animate-spin' : ''}`}
            />
          </button>
        </div>
        <p className="font-fira text-sm text-gray-600">
          Gestiona tu espacio en Cloudinary
        </p>
      </div>

      {/* Main Storage Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 mb-6"
      >
        {/* Storage Circle */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative w-48 h-48 sm:w-56 sm:h-56">
            {/* Background Circle */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="50%"
                cy="50%"
                r="45%"
                fill="none"
                stroke="#f3f4f6"
                strokeWidth="12"
              />
              {/* Progress Circle */}
              {storageData && (
                <motion.circle
                  cx="50%"
                  cy="50%"
                  r="45%"
                  fill="none"
                  stroke={
                    status.color === 'brown' ? '#8B5E3C' :
                    status.color === 'amber' ? '#B89968' :
                    '#8B5E3C'
                  }
                  strokeWidth="12"
                  strokeLinecap="round"
                  initial={{ strokeDasharray: '0 1000' }}
                  animate={{
                    strokeDasharray: `${parseFloat(storageData.percentage) * 2.83} 1000`
                  }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              )}
            </svg>

            {/* Center Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {loading ? (
                <div className="animate-spin">
                  <Database size={32} className="text-gray-400" />
                </div>
              ) : storageData ? (
                <>
                  <p className="font-voga text-4xl sm:text-5xl font-bold text-gray-900 mb-1">
                    {storageData.percentage}%
                  </p>
                  <p className="font-fira text-sm text-gray-600">
                    {storageData.storageGB} GB de {storageData.limitGB} GB
                  </p>
                </>
              ) : null}
            </div>
          </div>

          {/* Status Badge */}
          {storageData && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className={`mt-4 px-4 py-2 rounded-full flex items-center gap-2 ${
                status.color === 'brown' ? 'bg-[#8B5E3C]/10' :
                status.color === 'amber' ? 'bg-[#B89968]/10' :
                'bg-[#8B5E3C]/10'
              }`}
            >
              <status.icon
                size={18}
                className={
                  status.color === 'brown' ? 'text-[#8B5E3C]' :
                  status.color === 'amber' ? 'text-[#B89968]' :
                  'text-[#8B5E3C]'
                }
              />
              <span className={`font-fira text-sm font-semibold ${
                status.color === 'brown' ? 'text-[#6d4a2f]' :
                status.color === 'amber' ? 'text-[#9a7a4f]' :
                'text-[#6d4a2f]'
              }`}>
                {status.text}
              </span>
            </motion.div>
          )}
        </div>

        {/* Details Grid */}
        {storageData && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gray-50 rounded-xl p-4"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-[#8B5E3C]/10 flex items-center justify-center">
                  <Image size={20} className="text-[#8B5E3C]" />
                </div>
                <div>
                  <p className="font-fira text-2xl font-bold text-gray-900">
                    {storageData.filesCount}
                  </p>
                  <p className="font-fira text-xs text-gray-600">Archivos</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gray-50 rounded-xl p-4"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-[#B89968]/10 flex items-center justify-center">
                  <HardDrive size={20} className="text-[#B89968]" />
                </div>
                <div>
                  <p className="font-fira text-2xl font-bold text-gray-900">
                    {storageData.storageMB} MB
                  </p>
                  <p className="font-fira text-xs text-gray-600">Usado</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gray-50 rounded-xl p-4"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-[#6d4a2f]/10 flex items-center justify-center">
                  <Cloud size={20} className="text-[#6d4a2f]" />
                </div>
                <div>
                  <p className="font-fira text-2xl font-bold text-gray-900">
                    {(parseFloat(storageData.limitGB) - parseFloat(storageData.storageGB)).toFixed(2)} GB
                  </p>
                  <p className="font-fira text-xs text-gray-600">Disponible</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Last Updated */}
        {lastUpdated && (
          <p className="text-center mt-6 font-fira text-xs text-gray-500">
            Última actualización: {lastUpdated.toLocaleTimeString('es-ES')}
          </p>
        )}
      </motion.div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-[#8B5E3C]/5 border border-[#8B5E3C]/10 rounded-xl p-5"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#8B5E3C]/10 flex items-center justify-center flex-shrink-0">
              <Database size={20} className="text-[#8B5E3C]" />
            </div>
            <div>
              <h3 className="font-fira text-sm font-semibold text-[#6d4a2f] mb-1">
                Almacenamiento en la Nube
              </h3>
              <p className="font-fira text-xs text-gray-700 leading-relaxed">
                Todas tus imágenes se almacenan de forma segura en Cloudinary,
                con respaldo automático y acceso desde cualquier lugar.
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-[#B89968]/5 border border-[#B89968]/10 rounded-xl p-5"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#B89968]/10 flex items-center justify-center flex-shrink-0">
              <TrendingUp size={20} className="text-[#B89968]" />
            </div>
            <div>
              <h3 className="font-fira text-sm font-semibold text-[#9a7a4f] mb-1">
                Optimización Automática
              </h3>
              <p className="font-fira text-xs text-gray-700 leading-relaxed">
                Las imágenes se optimizan automáticamente para web,
                reduciendo el tamaño sin perder calidad.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
