'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, Loader2, Maximize, Minimize } from 'lucide-react';

/**
 * Videos Section - Sección elegante de videos en la landing
 * Diseño que sigue el estilo visual de Alma Fotografía
 */
export default function Videos({ videos = [] }) {
  if (!videos || videos.length === 0) return null;

  return (
    <section id="videos" className="py-16 sm:py-24 bg-[#2D2D2D]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header de la sección */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-16"
        >
          {/* Decoración superior */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="h-px w-8 bg-gradient-to-r from-transparent to-[#B89968]" />
            <div className="w-1 h-1 rounded-full bg-[#B89968]" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
            <div className="w-1 h-1 rounded-full bg-[#B89968]" />
            <div className="h-px w-8 bg-gradient-to-l from-transparent to-[#B89968]" />
          </div>

          <h2 className="font-voga text-3xl sm:text-4xl lg:text-5xl text-white">
            Capturamos momentos especiales
          </h2>
        </motion.div>

        {/* Grid de videos */}
        <div className={`grid gap-6 sm:gap-8 ${
          videos.length === 1
            ? 'max-w-3xl mx-auto'
            : 'grid-cols-1 md:grid-cols-2'
        }`}>
          {videos.map((video, index) => (
            <VideoCard key={video.id} video={video} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

function VideoCard({ video, index }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const [progress, setProgress] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const progressBarRef = useRef(null);
  const hideControlsTimeout = useRef(null);
  const clickTimeout = useRef(null);
  const clickCount = useRef(0);

  // Auto-ocultar controles después de 2 segundos de inactividad
  const resetHideControlsTimer = () => {
    if (hideControlsTimeout.current) {
      clearTimeout(hideControlsTimeout.current);
    }
    setShowControls(true);
    // Siempre iniciar timer para ocultar si está reproduciendo
    if (isPlaying) {
      hideControlsTimeout.current = setTimeout(() => {
        setShowControls(false);
      }, 2000);
    }
  };

  // Ocultar controles automáticamente en fullscreen cuando está reproduciendo
  useEffect(() => {
    if (isFullscreen && isPlaying && showControls) {
      hideControlsTimeout.current = setTimeout(() => {
        setShowControls(false);
      }, 2000);
    }
    return () => {
      if (hideControlsTimeout.current) {
        clearTimeout(hideControlsTimeout.current);
      }
    };
  }, [isFullscreen, isPlaying, showControls]);

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (hideControlsTimeout.current) {
        clearTimeout(hideControlsTimeout.current);
      }
    };
  }, []);

  // Formatear tiempo en mm:ss
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Optimizar URL de video para streaming (Cloudinary)
  const getOptimizedVideoUrl = (url) => {
    if (!url || !url.includes('cloudinary.com')) return url;
    // Transformaciones optimizadas para streaming rápido:
    // - q_auto:low: calidad automática (bajo para carga inicial rápida)
    // - f_auto: formato automático (webm si soportado)
    // - vc_auto: codec automático para mejor compatibilidad
    // - br_2m: bitrate máximo 2Mbps para carga más rápida
    return url.replace('/upload/', '/upload/q_auto:good,f_auto,vc_auto/');
  };

  // Detectar cambios de fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Manejar click simple (play/pause) y doble click (fullscreen)
  const handleVideoClick = () => {
    clickCount.current += 1;

    if (clickCount.current === 1) {
      // Esperar para ver si es doble click
      clickTimeout.current = setTimeout(() => {
        // Click simple - toggle play/pause
        if (clickCount.current === 1) {
          togglePlay();
        }
        clickCount.current = 0;
      }, 250);
    } else if (clickCount.current === 2) {
      // Doble click - toggle fullscreen
      clearTimeout(clickTimeout.current);
      clickCount.current = 0;
      toggleFullscreen({ stopPropagation: () => {} });
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setShowControls(true);
      } else {
        videoRef.current.play();
        // Ocultar controles después de dar play
        hideControlsTimeout.current = setTimeout(() => {
          setShowControls(false);
        }, 2000);
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = (e) => {
    e.stopPropagation();
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      // Intentar fullscreen en el contenedor primero, si no, en el video
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      } else if (videoRef.current?.webkitEnterFullscreen) {
        // iOS Safari
        videoRef.current.webkitEnterFullscreen();
      }
    } else {
      document.exitFullscreen();
    }
  };

  const handleVideoEnd = () => {
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const dur = videoRef.current.duration;
      setCurrentTime(current);
      if (dur && dur > 0) {
        setDuration(dur);
        setProgress((current / dur) * 100);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current && videoRef.current.duration) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleProgress = () => {
    if (videoRef.current && videoRef.current.buffered.length > 0 && videoRef.current.duration) {
      const bufferedEnd = videoRef.current.buffered.end(videoRef.current.buffered.length - 1);
      setBuffered((bufferedEnd / videoRef.current.duration) * 100);
    }
  };

  const handleProgressClick = (e) => {
    e.stopPropagation();
    if (progressBarRef.current && videoRef.current && videoRef.current.duration > 0) {
      const rect = progressBarRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, clickX / rect.width));
      const newTime = percentage * videoRef.current.duration;
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      setProgress(percentage * 100);
    }
  };

  // Soporte para touch/drag en móvil
  const handleProgressTouch = (e) => {
    e.stopPropagation();
    if (progressBarRef.current && videoRef.current && videoRef.current.duration > 0) {
      const rect = progressBarRef.current.getBoundingClientRect();
      const touchX = e.touches[0].clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, touchX / rect.width));
      const newTime = percentage * videoRef.current.duration;
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      setProgress(percentage * 100);
    }
  };

  const handleWaiting = () => setIsBuffering(true);
  const handleCanPlay = () => setIsBuffering(false);

  // Manejar error de video (trancado o falló)
  const handleError = () => {
    setIsBuffering(false);
    // Intentar recargar desde la posición actual
    if (videoRef.current) {
      const currentPos = videoRef.current.currentTime;
      videoRef.current.load();
      videoRef.current.currentTime = currentPos;
      if (isPlaying) {
        videoRef.current.play().catch(() => {});
      }
    }
  };

  // Si el buffering dura más de 8 segundos, intentar reiniciar
  useEffect(() => {
    let bufferTimeout;
    if (isBuffering && isPlaying) {
      bufferTimeout = setTimeout(() => {
        if (videoRef.current && isBuffering) {
          const currentPos = videoRef.current.currentTime;
          // Intentar continuar desde un poco antes
          videoRef.current.currentTime = Math.max(0, currentPos - 0.5);
          videoRef.current.play().catch(() => {});
        }
      }, 8000);
    }
    return () => clearTimeout(bufferTimeout);
  }, [isBuffering, isPlaying]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.2 }}
      className="group relative"
    >
      {/* Marco decorativo exterior */}
      <div className="absolute -inset-2 sm:-inset-3 border border-[#B89968]/20 rounded-lg pointer-events-none" />

      {/* Esquinas decorativas */}
      <div className="absolute -top-2 -left-2 sm:-top-3 sm:-left-3 w-4 h-4 sm:w-6 sm:h-6 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-[#D4AF37]" />
        <div className="absolute top-0 left-0 w-[1px] h-full bg-[#D4AF37]" />
      </div>
      <div className="absolute -top-2 -right-2 sm:-top-3 sm:-right-3 w-4 h-4 sm:w-6 sm:h-6 pointer-events-none">
        <div className="absolute top-0 right-0 w-full h-[1px] bg-[#D4AF37]" />
        <div className="absolute top-0 right-0 w-[1px] h-full bg-[#D4AF37]" />
      </div>
      <div className="absolute -bottom-2 -left-2 sm:-bottom-3 sm:-left-3 w-4 h-4 sm:w-6 sm:h-6 pointer-events-none">
        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-[#D4AF37]" />
        <div className="absolute bottom-0 left-0 w-[1px] h-full bg-[#D4AF37]" />
      </div>
      <div className="absolute -bottom-2 -right-2 sm:-bottom-3 sm:-right-3 w-4 h-4 sm:w-6 sm:h-6 pointer-events-none">
        <div className="absolute bottom-0 right-0 w-full h-[1px] bg-[#D4AF37]" />
        <div className="absolute bottom-0 right-0 w-[1px] h-full bg-[#D4AF37]" />
      </div>

      {/* Contenedor del video */}
      <div
        ref={containerRef}
        className={`relative bg-black rounded-lg overflow-hidden cursor-pointer ${
          isFullscreen ? 'fixed inset-0 z-50 rounded-none' : 'aspect-video'
        }`}
        onClick={handleVideoClick}
        onMouseMove={resetHideControlsTimer}
        onMouseEnter={resetHideControlsTimer}
        onMouseLeave={() => isPlaying && setShowControls(false)}
        onTouchStart={resetHideControlsTimer}
      >
        <video
          ref={videoRef}
          src={getOptimizedVideoUrl(video.video_url)}
          poster={video.thumbnail_url}
          className={`w-full h-full ${isFullscreen ? 'object-contain' : 'object-cover'}`}
          muted={isMuted}
          playsInline
          preload="metadata"
          onEnded={handleVideoEnd}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onProgress={handleProgress}
          onWaiting={handleWaiting}
          onCanPlay={handleCanPlay}
          onPlaying={() => setIsBuffering(false)}
          onStalled={() => setIsBuffering(true)}
          onError={handleError}
        />

        {/* Overlay oscuro cuando no está reproduciendo */}
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
            isPlaying ? 'opacity-0' : 'opacity-100'
          }`}
        />

        {/* Botón de play central / Indicador de buffering */}
        <div
          className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
            isPlaying && !showControls && !isBuffering ? 'opacity-0' : 'opacity-100'
          }`}
        >
          {isBuffering ? (
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
              <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 text-white animate-spin" />
            </div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center transition-all hover:bg-white/30"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="white" />
              ) : (
                <Play className="w-6 h-6 sm:w-8 sm:h-8 text-white ml-1" fill="white" />
              )}
            </motion.button>
          )}
        </div>

        {/* Controles inferiores */}
        <div
          className={`absolute bottom-0 left-0 right-0 transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Barra de progreso clickeable */}
          <div
            ref={progressBarRef}
            onClick={handleProgressClick}
            onTouchStart={handleProgressTouch}
            onTouchMove={handleProgressTouch}
            className="relative h-10 cursor-pointer group/progress flex items-end pb-2 px-3"
          >
            {/* Fondo de la barra */}
            <div className="absolute bottom-2 left-2 right-2 h-1 bg-white/20 rounded-full overflow-hidden">
              {/* Buffer */}
              <div
                className="absolute top-0 left-0 h-full bg-white/30 transition-all"
                style={{ width: `${buffered}%` }}
              />
              {/* Progreso */}
              <div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#B89968] to-[#D4AF37] rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            {/* Handle/Bolita */}
            <div
              className="absolute bottom-1 w-3 h-3 bg-[#D4AF37] rounded-full shadow-lg opacity-0 group-hover/progress:opacity-100 transition-opacity"
              style={{ left: `calc(${progress}% + 8px - 6px)` }}
            />
          </div>

          {/* Barra de controles */}
          <div className="flex items-center justify-between px-3 pb-3 bg-gradient-to-t from-black/60 to-transparent">
            {/* Tiempo */}
            <div className="font-fira text-xs sm:text-sm text-white/80">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>

            {/* Botones de control */}
            <div className="flex items-center gap-2">
              {/* Botón de sonido */}
              <button
                onClick={toggleMute}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4 text-white" />
                ) : (
                  <Volume2 className="w-4 h-4 text-white" />
                )}
              </button>

              {/* Botón de pantalla completa */}
              <button
                onClick={toggleFullscreen}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                {isFullscreen ? (
                  <Minimize className="w-4 h-4 text-white" />
                ) : (
                  <Maximize className="w-4 h-4 text-white" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Título y descripción */}
      {(video.title || video.description) && (
        <div className="mt-4 sm:mt-6 text-center">
          {video.title && (
            <h3 className="font-voga text-xl sm:text-2xl text-white mb-2">
              {video.title}
            </h3>
          )}
          {video.description && (
            <p className="font-fira text-white/60 text-sm sm:text-base">
              {video.description}
            </p>
          )}
        </div>
      )}
    </motion.div>
  );
}
