/** Tailwind 设计规范 - VOYAGE 风格（slate/emerald，圆角与阴影） */
(function () {
  var config = {
    theme: {
      extend: {
        fontFamily: {
          sans: ['Inter', 'sans-serif'],
          mono: ['"JetBrains Mono"', 'monospace'],
        },
        colors: {
          canvas: '#f8fafc',
          surface: '#ffffff',
          obsidian: '#0f172a',
          charcoal: '#334155',
          subtle: '#64748b',
          border: '#e2e8f0',
          accent: '#059669',
          primary: '#0f172a',
          slate: {
            50: '#f8fafc',
            100: '#f1f5f9',
            200: '#e2e8f0',
            400: '#94a3b8',
            500: '#64748b',
            600: '#475569',
            700: '#334155',
            900: '#0f172a',
          },
          emerald: {
            500: '#10b981',
            600: '#059669',
            700: '#047857',
          },
        },
        borderRadius: {
          xl: '0.75rem',
          '2xl': '1rem',
          '3xl': '1.25rem',
        },
        letterSpacing: { tight: '-0.02em', tighter: '-0.04em' },
        boxShadow: {
          card: '0 1px 3px 0 rgba(0,0,0,0.04), 0 4px 12px -2px rgba(0,0,0,0.05)',
          'card-hover': '0 4px 12px -2px rgba(0,0,0,0.06), 0 12px 32px -6px rgba(0,0,0,0.08)',
          voyage: '0 4px 20px -4px rgba(0,0,0,0.08)',
        },
      },
    },
  };

  function apply() {
    if (typeof window !== 'undefined' && window.tailwind != null) {
      window.tailwind.config = config;
      return true;
    }
    return false;
  }

  if (!apply()) {
    window.__tailwindConfig = config;
    var tries = 0;
    var t = setInterval(function () {
      if (apply() || tries++ > 50) clearInterval(t);
    }, 20);
  }
})();
