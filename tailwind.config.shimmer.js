// Agregar esto a tu tailwind.config.js existente

module.exports = {
  // ... tu configuración existente
  theme: {
    extend: {
      // ... tus extensiones existentes
      fontFamily: {
        voga: ['Voga', 'serif'],
        fira: ['Fira Sans', 'sans-serif'],
      },
      colors: {
        brown: {
          dark: '#8B5E3C',
          medium: '#B89968',
          deep: '#6d4a2f',
        },
      },
      // Agregar animación shimmer
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        shimmer: 'shimmer 2s infinite',
      },
    },
  },
};
