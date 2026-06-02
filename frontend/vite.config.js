/**
 * ====================================================
 *  EventoAI - Configuración de Vite (bundler)
 *  Autor:  GattiDev
 *  Fecha:  01/06/2026
 * ====================================================
 *
 *  QUE HACE ESTE ARCHIVO:
 *  ----------------------
 *  Configura Vite, la herramienta que:
 *  - Sirve el frontend en desarrollo (npm run dev)
 *  - Compila React para producción (npm run build)
 *
 *  PUNTOS CLAVE:
 *  - server.port: el frontend corre en localhost:3000
 *  - publicDir: la carpeta "public" sirve archivos estáticos
 *    (no existe en este proyecto, pero Vite también sirve
 *     automáticamente archivos desde la raíz del frontend,
 *     por eso /galeria/icono.png funciona directamente)
 * ====================================================
 */

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Plugin oficial de React para Vite (habilita JSX, Fast Refresh, etc.)
  plugins: [react()],

  server: {
    // Puerto del servidor de desarrollo
    // Acceder en: http://localhost:3000
    port: 3000,
  },
})
