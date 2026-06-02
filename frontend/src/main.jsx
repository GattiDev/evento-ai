/**
 * ====================================================
 *  EventoAI - Punto de entrada de React
 *  Autor:  GattiDev
 *  Fecha:  01/06/2026
 * ====================================================
 *
 *  QUE HACE ESTE ARCHIVO:
 *  ----------------------
 *  Es el archivo que Vite ejecuta primero al cargar
 *  la app en el navegador.
 *
 *  Su única función es "montar" el componente App
 *  dentro del <div id="root"> del index.html.
 *
 *  StrictMode: modo de React que detecta errores y
 *  malos patrones durante el desarrollo.
 *  No afecta el comportamiento en producción.
 * ====================================================
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

// Monta el componente principal en el nodo #root del HTML
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
