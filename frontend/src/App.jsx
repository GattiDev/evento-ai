/**
 * ╔══════════════════════════════════════════════════════════╗
 *  EventoAI — Frontend Principal (React)
 *  Autor:   GattiDev
 *  Fecha:   01/06/2026
 *  Versión: 2.2 — Footer fijo, sin ícono en logo, comentarios
 * ╠══════════════════════════════════════════════════════════╣
 *
 *  ¿QUÉ HACE ESTE ARCHIVO?
 *  ─────────────────────────────────────────────────────────
 *  Es toda la interfaz visual del proyecto en un solo archivo.
 *  Contiene 5 partes bien diferenciadas:
 *
 *  [1] ESTILOS (CSS-in-JS)
 *      Variables de color, tipografías, layouts, animaciones.
 *      Se inyectan directo en el <head> del HTML.
 *
 *  [2] COMPONENTE PromptPreview
 *      Muestra un resumen de lo que se va a generar
 *      antes de presionar el botón "Visualizar Evento".
 *
 *  [3] COMPONENTE PanelAdmin
 *      Formulario para agregar productos al catálogo +
 *      grilla con historial de imágenes generadas.
 *
 *  [4] COMPONENTE Footer
 *      Pie de página FIJO en la parte inferior de la pantalla.
 *      Contiene el logo GattiDev y los créditos del proyecto.
 *
 *  [5] COMPONENTE App (principal)
 *      Controla todo el estado: formulario, resultado de IA,
 *      carga, errores, tab activo (Diseñar / Admin).
 *
 *  FLUJO DE DATOS:
 *  Usuario elige opciones → POST /api/generar → imagen de IA
 * ╚══════════════════════════════════════════════════════════╝
 */

import { useState, useEffect } from "react";

// ══════════════════════════════════════════════════════════
//  [CONFIG] URL BASE DEL BACKEND
//  Si el backend corre en otro host o puerto, cambiá esta
//  constante. En producción (VPS) ponés tu dominio o IP.
//  Ejemplo producción: "https://eventoai.tudominio.com"
// ══════════════════════════════════════════════════════════
// ── URL del backend ──────────────────────────────────────────
// En desarrollo local:  http://localhost:8000
// En producción Render: https://eventoai-api.onrender.com
// Cambiá esta línea según donde esté corriendo el backend
const API_BASE = "http://localhost:8000";

// ══════════════════════════════════════════════════════════
//  [1] ESTILOS GLOBALES (CSS-in-JS)
//
//  Se usa esta técnica (CSS embebido en JS) porque el proyecto
//  no usa archivos .css separados. Todas las clases están acá.
//
//  VARIABLES CSS (definidas en :root):
//  --crema   → fondo general de la app
//  --arena   → bordes y separadores suaves
//  --dorado  → color de acento principal (botones, títulos)
//  --dorado2 → versión más oscura del dorado (hover, labels)
//  --oscuro  → fondo del panel izquierdo y footer
//  --gris    → textos secundarios
//  --blanco  → fondo de tarjetas y formularios
//
//  TIPOGRAFÍAS (Google Fonts):
//  Cormorant Garamond → títulos y textos elegantes
//  DM Sans            → textos de interfaz y formularios
// ══════════════════════════════════════════════════════════
const estilos = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300&family=DM+Sans:wght@300;400;500&display=swap');

  /* Reset básico: elimina márgenes y paddings del navegador */
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  /* ── Variables de color y tipografía de toda la app ── */
  :root {
    --crema:    #f5f0e8;
    --arena:    #e8dcc8;
    --dorado:   #c9a96e;
    --dorado2:  #a07840;
    --oscuro:   #1c1410;
    --gris:     #6b5f52;
    --blanco:   #fdfaf5;
    --error:    #c0392b;
    --exito:    #27ae60;
  }

  /* ── Base del body: fondo crema y fuente general ── */
  body {
    font-family: 'DM Sans', sans-serif;
    background: var(--crema);
    color: var(--oscuro);
    min-height: 100vh;
  }

  /*
   * ── LAYOUT PRINCIPAL (.app) ──────────────────────────
   * Grid de 2 columnas:
   *   Columna 1 (400px fija): panel izquierdo con formulario
   *   Columna 2 (resto):      panel derecho con resultado
   *
   * padding-bottom: 62px → deja espacio para el footer fijo
   * para que el contenido no quede tapado por debajo
   */
  .app {
    display: grid;
    grid-template-columns: 400px 1fr;
    min-height: 100vh;
    padding-bottom: 62px;
  }

  /*
   * ── PANEL IZQUIERDO (.panel-izq) ─────────────────────
   * Barra lateral oscura con el formulario de opciones.
   *
   * position: sticky + height: 100vh → el panel queda fijo
   * mientras el usuario hace scroll en el panel derecho.
   *
   * overflow-y: auto → si el contenido es muy largo,
   * aparece scroll SOLO en este panel (no en toda la página)
   */
  .panel-izq {
    background: var(--oscuro);
    padding: 2.5rem 2rem;
    display: flex;
    flex-direction: column;
    gap: 2rem;
    overflow-y: auto;
    position: sticky;
    top: 0;
    height: 100vh;
  }

  /*
   * ── LOGO DEL PANEL IZQUIERDO (.logo) ─────────────────
   * Encabezado con el nombre "EventoAI" y el subtítulo.
   * Solo texto, sin ícono (se eliminó el icono.png del logo).
   * Tiene una línea dorada debajo como separador.
   */
  .logo {
    text-align: center;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid rgba(201,169,110,0.3);
  }

  /* Título principal "EventoAI" en dorado */
  .logo h1 {
    font-family: 'Cormorant Garamond', serif;
    font-size: 2.4rem;
    font-weight: 300;
    color: var(--dorado);
    letter-spacing: 0.05em;
  }

  /* Subtítulo en blanco semitransparente debajo del título */
  .logo p {
    font-size: 0.75rem;
    color: rgba(255,255,255,0.4);
    letter-spacing: 0.2em;
    text-transform: uppercase;
    margin-top: 0.4rem;
  }

  /*
   * ── TÍTULOS DE SECCIÓN DEL FORMULARIO ────────────────
   * Cada grupo de campos (Evento, Mobiliario, Decoración)
   * tiene un h2 con rombos (◆) y letras en mayúsculas.
   */
  .seccion-form h2 {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1rem;
    font-weight: 400;
    color: var(--dorado);
    letter-spacing: 0.15em;
    text-transform: uppercase;
    margin-bottom: 0.8rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  /*
   * ── CAMPO DE FORMULARIO (.campo) ─────────────────────
   * Wrapper que agrupa un label + su input/select.
   * margin-bottom separa los campos entre sí.
   */
  .campo { margin-bottom: 0.8rem; }

  /* Label en mayúsculas pequeñas y semitransparente */
  .campo label {
    display: block;
    font-size: 0.72rem;
    color: rgba(255,255,255,0.5);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    margin-bottom: 0.35rem;
  }

  /*
   * ── INPUTS Y SELECTS DEL FORMULARIO ──────────────────
   * Fondo casi transparente sobre el panel oscuro.
   * Borde dorado semitransparente que se ilumina al enfocar.
   * appearance: none → elimina la flecha nativa del select
   */
  .campo select,
  .campo input {
    width: 100%;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(201,169,110,0.25);
    border-radius: 4px;
    padding: 0.6rem 0.8rem;
    color: var(--crema);
    font-family: 'DM Sans', sans-serif;
    font-size: 0.85rem;
    transition: border-color 0.2s;
    appearance: none;
  }

  /* Al hacer foco: el borde se vuelve dorado completo */
  .campo select:focus,
  .campo input:focus {
    outline: none;
    border-color: var(--dorado);
  }

  /* Opciones del select con fondo oscuro para mantener el tema */
  .campo select option { background: #2a2010; }

  /*
   * ── BOTÓN GENERAR (.btn-generar) ─────────────────────
   * Botón principal con gradiente dorado.
   * Se deshabilita mientras se está generando (cursor:not-allowed)
   * o cuando el formulario está incompleto.
   */
  .btn-generar {
    width: 100%;
    padding: 1rem;
    background: linear-gradient(135deg, var(--dorado), var(--dorado2));
    border: none;
    border-radius: 4px;
    color: var(--oscuro);
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.1rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    cursor: pointer;
    transition: opacity 0.2s, transform 0.1s;
    margin-top: 0.5rem;
  }

  /* Efecto hover: sube levemente y baja opacidad */
  .btn-generar:hover:not(:disabled) {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  /* Estado deshabilitado: opaco y sin cursor de pointer */
  .btn-generar:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /*
   * ── PANEL DERECHO (.panel-der) ───────────────────────
   * Área principal donde se muestra el resultado de la IA.
   * overflow-y: auto → scroll independiente del panel izquierdo
   */
  .panel-der {
    padding: 3rem;
    display: flex;
    flex-direction: column;
    gap: 2.5rem;
    overflow-y: auto;
  }

  /* Encabezado del panel derecho con título y descripción */
  .encabezado-der {
    border-bottom: 1px solid var(--arena);
    padding-bottom: 1.5rem;
  }

  .encabezado-der h2 {
    font-family: 'Cormorant Garamond', serif;
    font-size: 2.2rem;
    font-weight: 300;
    color: var(--oscuro);
  }

  .encabezado-der p {
    font-size: 0.85rem;
    color: var(--gris);
    margin-top: 0.4rem;
  }

  /*
   * ── TARJETA DE RESULTADO (.resultado) ────────────────
   * Contenedor blanco con sombra que muestra:
   *  - La imagen generada por la IA (o el aviso de modo demo)
   *  - El badge de caché
   *  - El prompt que se usó para generarla
   */
  .resultado {
    background: white;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 4px 24px rgba(28,20,16,0.1);
  }

  /* Imagen generada: ocupa el ancho completo, máx 500px alto */
  .resultado-img {
    width: 100%;
    max-height: 500px;
    object-fit: cover;
    display: block;
  }

  /* Barra de información debajo de la imagen */
  .resultado-info {
    padding: 1.2rem 1.5rem;
    background: var(--blanco);
    border-top: 1px solid var(--arena);
  }

  /*
   * ── BADGE DE CACHÉ (.badge-cache) ────────────────────
   * Indica si la imagen se generó ahora o vino del caché.
   * .cache → verde (imagen guardada, respuesta instantánea)
   * .nuevo → azul  (imagen recién generada por la IA)
   */
  .badge-cache {
    display: inline-block;
    padding: 0.2rem 0.7rem;
    border-radius: 20px;
    font-size: 0.72rem;
    letter-spacing: 0.08em;
    font-weight: 500;
    margin-bottom: 0.6rem;
  }

  .badge-cache.cache { background: #e8f5e9; color: #2e7d32; }
  .badge-cache.nuevo { background: #e3f2fd; color: #1565c0; }

  /* Texto del prompt en itálica debajo del badge */
  .prompt-texto {
    font-size: 0.8rem;
    color: var(--gris);
    font-style: italic;
    line-height: 1.6;
  }

  /*
   * ── INDICADOR DE CARGA (.loading) ────────────────────
   * Aparece mientras la IA genera la imagen (20-60 segundos).
   * Contiene un spinner CSS animado y textos de espera.
   */
  .loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem;
    gap: 1.5rem;
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 24px rgba(28,20,16,0.1);
  }

  /*
   * Spinner: círculo que gira infinitamente.
   * border-top-color diferente crea el efecto de "arco girando"
   */
  .spinner {
    width: 48px;
    height: 48px;
    border: 3px solid var(--arena);
    border-top-color: var(--dorado);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  .loading p {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.2rem;
    color: var(--gris);
  }

  /*
   * ── PREVIEW DEL PROMPT (.prompt-preview) ─────────────
   * Se muestra cuando el formulario está completo pero
   * todavía no se generó la imagen. Le da al usuario una
   * idea de qué se va a enviar a la IA.
   */
  .prompt-preview {
    background: white;
    border-radius: 8px;
    padding: 1.2rem 1.5rem;
    border-left: 3px solid var(--dorado);
  }

  .prompt-preview h3 {
    font-size: 0.72rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--dorado2);
    margin-bottom: 0.6rem;
  }

  .prompt-preview p {
    font-size: 0.85rem;
    color: var(--gris);
    font-style: italic;
    line-height: 1.7;
  }

  /*
   * ── HISTORIAL DE IMÁGENES (.historial) ───────────────
   * Grilla de tarjetas con thumbnails de imágenes generadas.
   * auto-fill + minmax → se adapta automáticamente al ancho
   * disponible: más columnas en pantallas grandes.
   */
  .historial h3 {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.5rem;
    font-weight: 300;
    margin-bottom: 1rem;
    color: var(--oscuro);
  }

  .historial-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
  }

  /* Tarjeta individual con efecto hover de elevación */
  .hist-item {
    background: white;
    border-radius: 6px;
    overflow: hidden;
    box-shadow: 0 2px 12px rgba(28,20,16,0.08);
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .hist-item:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 24px rgba(28,20,16,0.15);
  }

  /* Área del thumbnail: 120px de alto con fondo arena */
  .hist-thumb {
    width: 100%;
    height: 120px;
    background: var(--arena);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
  }

  /* Imagen del thumbnail: cubre todo el área sin deformarse */
  .hist-thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  /* Texto del prompt truncado a 2 líneas con ellipsis */
  .hist-info { padding: 0.7rem; }

  .hist-info p {
    font-size: 0.72rem;
    color: var(--gris);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    line-height: 1.5;
  }

  /*
   * ── ESTADO VACÍO (.vacio) ────────────────────────────
   * Pantalla inicial que ve el usuario antes de generar
   * su primera imagen. Invita a usar el formulario.
   */
  .vacio {
    text-align: center;
    padding: 5rem 2rem;
    color: var(--gris);
  }

  .vacio .icono { font-size: 4rem; margin-bottom: 1rem; opacity: 0.4; }

  .vacio h3 {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.8rem;
    font-weight: 300;
    margin-bottom: 0.5rem;
    color: var(--oscuro);
  }

  .vacio p { font-size: 0.9rem; }

  /*
   * ── MENSAJES DE AVISO (.aviso) ───────────────────────
   * Cajas de texto informativo o de error.
   * .error → fondo rojo suave para errores de conexión/generación
   * .info  → fondo amarillo suave para mensajes informativos
   */
  .aviso {
    padding: 1rem 1.2rem;
    border-radius: 6px;
    font-size: 0.85rem;
    line-height: 1.6;
  }

  .aviso.error { background: #fdecea; color: var(--error); }
  .aviso.info  { background: #fff8e1; color: #7d5a00; }

  /*
   * ── FORMULARIO ADMIN (.admin-form) ───────────────────
   * Tarjeta blanca para agregar nuevos ítems al catálogo.
   * Ancho máximo de 500px para que no quede muy ancho.
   */
  .admin-form {
    background: white;
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: 0 2px 12px rgba(28,20,16,0.08);
    max-width: 500px;
  }

  .admin-form h3 {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.4rem;
    font-weight: 400;
    margin-bottom: 1rem;
    color: var(--oscuro);
  }

  /* Campo del formulario admin: mismo patrón que .campo pero en claro */
  .admin-campo { margin-bottom: 1rem; }

  .admin-campo label {
    display: block;
    font-size: 0.78rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--gris);
    margin-bottom: 0.35rem;
  }

  /* Inputs claros con borde arena que se vuelve dorado al enfocar */
  .admin-campo select,
  .admin-campo input {
    width: 100%;
    border: 1px solid var(--arena);
    border-radius: 4px;
    padding: 0.6rem 0.8rem;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.88rem;
    color: var(--oscuro);
    background: white;
    transition: border-color 0.2s;
  }

  .admin-campo select:focus,
  .admin-campo input:focus {
    outline: none;
    border-color: var(--dorado);
  }

  /* Botón oscuro con texto dorado para el panel admin */
  .btn-admin {
    padding: 0.7rem 1.8rem;
    background: var(--oscuro);
    color: var(--dorado);
    border: none;
    border-radius: 4px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.88rem;
    cursor: pointer;
    transition: opacity 0.2s;
  }

  .btn-admin:hover { opacity: 0.8; }

  /*
   * ── FOOTER FIJO (.footer) ────────────────────────────
   * Pie de página que siempre queda visible en la parte
   * inferior de la ventana, sin importar el scroll.
   *
   * position: fixed → se mantiene fijo respecto a la ventana
   * bottom: 0       → pegado al borde inferior
   * left/right: 0   → ocupa todo el ancho de la ventana
   * z-index: 100    → queda por encima de todo el contenido
   *
   * IMPORTANTE: el .app tiene padding-bottom: 62px para que
   * el contenido de abajo no quede tapado por este footer.
   */
  .footer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 100;
    background: var(--oscuro);
    border-top: 1px solid rgba(201,169,110,0.2);
    padding: 0.9rem 2rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 0.8rem;
    height: 62px;
  }

  /* Logo GattiDev: 32px de alto, se ilumina al hacer hover */
  .footer-logo {
    height: 32px;
    object-fit: contain;
    opacity: 0.85;
    transition: opacity 0.2s;
  }

  .footer-logo:hover { opacity: 1; }

  /* Texto de créditos: semitransparente con año y autor en dorado */
  .footer-texto {
    font-size: 0.75rem;
    color: rgba(255,255,255,0.35);
    letter-spacing: 0.08em;
    text-align: right;
  }

  .footer-texto span {
    color: var(--dorado);
    opacity: 0.7;
  }

  /*
   * ── RESPONSIVE (pantallas pequeñas, < 768px) ─────────
   * En celulares y tablets: las 2 columnas se apilan.
   * El panel izquierdo deja de ser sticky (vuelve al flujo normal).
   * El footer se centra.
   */
  @media (max-width: 768px) {
    .app { grid-template-columns: 1fr; }
    .panel-izq { position: static; height: auto; }
    .panel-der { padding: 1.5rem; }
    .footer { justify-content: center; height: auto; padding: 0.8rem; }
    .footer-texto { text-align: center; }
  }
`;

// ══════════════════════════════════════════════════════════
//  [2] COMPONENTE: PromptPreview
//
//  ¿QUÉ HACE?
//  Muestra un preview del texto (prompt) que se va a enviar
//  a la IA antes de presionar "Visualizar Evento".
//
//  ¿CUÁNDO SE MUESTRA?
//  Solo cuando el formulario está completo y todavía no se
//  generó ninguna imagen (no reemplaza el resultado anterior).
//
//  PROPS:
//  - opciones: objeto con las opciones seleccionadas por el usuario
//    { estilo, cantidad, silla, mantel, decoracion, extras }
// ══════════════════════════════════════════════════════════
function PromptPreview({ opciones }) {
  // Si no hay estilo seleccionado, no renderiza nada
  if (!opciones.estilo) return null;

  // Junta todas las opciones no vacías en un array limpio
  const partes = [
    opciones.estilo,
    opciones.cantidad && `${opciones.cantidad} personas`,
    opciones.silla,
    opciones.mantel,
    opciones.decoracion,
    opciones.extras,
  ].filter(Boolean); // filter(Boolean) elimina vacíos, null, undefined

  return (
    <div className="prompt-preview">
      {/* Etiqueta indicadora del bloque */}
      <h3>✦ Prompt que se generará</h3>
      {/* Muestra las opciones unidas por comas, entre comillas */}
      <p>"{partes.join(", ")}"</p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  [3] COMPONENTE: PanelAdmin
//
//  ¿QUÉ HACE?
//  Panel de administración con dos funciones:
//
//  A) AGREGAR AL CATÁLOGO:
//     Formulario para crear nuevos productos (sillas, manteles,
//     estilos, decoraciones). Se guarda en la base de datos
//     del backend y aparece en el formulario de Diseño.
//
//  B) HISTORIAL DE IMÁGENES:
//     Grilla con todas las imágenes que se generaron,
//     cargadas desde /api/historial al montar el componente.
//
//  PROPS:
//  - catalogo:       el catálogo actual (no se usa directamente aquí)
//  - onItemAgregado: función del padre para recargar el catálogo
//                    después de agregar un nuevo item
// ══════════════════════════════════════════════════════════
function PanelAdmin({ catalogo, onItemAgregado }) {
  // Estado local del formulario de nuevo item
  const [form, setForm] = useState({ tipo: "silla", nombre: "", descripcion: "" });

  // Mensaje de éxito/error que se muestra luego de guardar
  const [msg, setMsg] = useState("");

  // Lista de imágenes del historial (se carga del backend)
  const [historial, setHistorial] = useState([]);

  // useEffect con [] → se ejecuta UNA SOLA VEZ al montar el componente
  // Carga el historial de imágenes generadas desde el backend
  useEffect(() => {
    fetch(`${API_BASE}/api/historial`)
      .then(r => r.json())
      .then(setHistorial)
      .catch(() => {}); // Si falla, no muestra error (historial queda vacío)
  }, []);

  // Guarda el nuevo item en el backend y limpia el formulario
  const guardar = async () => {
    // Validación básica: el nombre no puede estar vacío
    if (!form.nombre.trim()) return;

    const resp = await fetch(`${API_BASE}/api/catalogo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await resp.json();
    setMsg(data.mensaje || "✅ Guardado correctamente");

    // Le avisa al componente padre (App) para que recargue el catálogo
    // y el nuevo item aparezca inmediatamente en los selects del formulario
    if (onItemAgregado) onItemAgregado();

    // Limpia nombre y descripción, conserva el tipo seleccionado
    setForm(f => ({ ...f, nombre: "", descripcion: "" }));

    // Oculta el mensaje de confirmación después de 3 segundos
    setTimeout(() => setMsg(""), 3000);
  };

  return (
    <div>
      {/* ── Formulario para agregar nuevo producto ── */}
      <div className="admin-form">
        <h3>Agregar al Catálogo</h3>

        {/* Tipo de producto: silla, mantel, decoración o estilo */}
        <div className="admin-campo">
          <label>Tipo</label>
          <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
            <option value="silla">Silla</option>
            <option value="mantel">Mantel</option>
            <option value="decoracion">Decoración</option>
            <option value="estilo">Estilo de Evento</option>
          </select>
        </div>

        {/* Nombre del producto (aparecerá en el dropdown del formulario) */}
        <div className="admin-campo">
          <label>Nombre</label>
          <input
            value={form.nombre}
            onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
            placeholder="Ej: Tiffany Rosa"
          />
        </div>

        {/* Descripción opcional del producto */}
        <div className="admin-campo">
          <label>Descripción</label>
          <input
            value={form.descripcion}
            onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
            placeholder="Descripción corta del producto"
          />
        </div>

        <button className="btn-admin" onClick={guardar}>Guardar Item</button>

        {/* Mensaje de confirmación (verde) o error tras guardar */}
        {msg && (
          <p style={{ marginTop: "0.8rem", color: "var(--exito)", fontSize: "0.85rem" }}>
            {msg}
          </p>
        )}
      </div>

      {/* ── Historial de imágenes generadas (solo si hay) ── */}
      {historial.length > 0 && (
        <div className="historial" style={{ marginTop: "2rem" }}>
          <h3>Imágenes Generadas ({historial.length})</h3>
          <div className="historial-grid">
            {historial.map((item, i) => (
              <div key={i} className="hist-item">
                <div className="hist-thumb">
                  {/*
                    Si la URL termina en .svg → es el placeholder del modo demo
                    Si termina en .png      → es una imagen real de la IA
                  */}
                  {item.imagen_url.endsWith(".svg")
                    ? <span>🎭</span>
                    : (
                      <img
                        src={`${API_BASE}${item.imagen_url}`}
                        alt="evento generado"
                        onError={e => e.target.style.display = "none"} // oculta si no carga
                      />
                    )
                  }
                </div>
                {/* Prompt usado para generar esa imagen (truncado a 2 líneas) */}
                <div className="hist-info">
                  <p>{item.prompt}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  [4] COMPONENTE: Footer
//
//  ¿QUÉ HACE?
//  Pie de página FIJO que siempre se ve en la parte
//  inferior de la pantalla (position: fixed en el CSS).
//
//  CONTENIDO:
//  - Logo GattiDev (footer.png de la carpeta galeria/)
//  - Texto con nombre del proyecto, autor y fecha
//
//  NOTA TÉCNICA:
//  El .app tiene padding-bottom: 62px para que el contenido
//  de la página no quede oculto detrás del footer.
// ══════════════════════════════════════════════════════════
function Footer() {
  return (
    <footer className="footer">
      {/* Logo GattiDev cargado desde la carpeta galeria/ del proyecto */}
      <img
        src="/galeria/footer.png"
        alt="GattiDev"
        className="footer-logo"
      />

      {/* Texto de créditos: nombre del proyecto, autor y fecha */}
      <div className="footer-texto">
        <div>EventoAI &mdash; Visualizador de Eventos con IA</div>
        <div>
          Desarrollado por <span>GattiDev</span> &bull; 01/06/2026
        </div>
      </div>
    </footer>
  );
}

// ══════════════════════════════════════════════════════════
//  [5] COMPONENTE PRINCIPAL: App
//
//  ¿QUÉ HACE?
//  Es el cerebro de la aplicación. Maneja:
//
//  ESTADOS (useState):
//  - opciones    → lo que el usuario eligió en el formulario
//  - catalogo    → productos cargados del backend (sillas, etc.)
//  - resultado   → respuesta de la IA con la URL de la imagen
//  - cargando    → true mientras se espera la respuesta de la IA
//  - error       → mensaje de error visible al usuario
//  - tab         → cuál pestaña está activa ("disenar" / "admin")
//  - apiOk       → estado de conexión con el backend
//                  null=verificando, true=ok, false=sin conexión
//
//  ESTRUCTURA VISUAL:
//  ┌─────────────────┬──────────────────────────────────┐
//  │   Panel Izq     │          Panel Der               │
//  │   (formulario)  │   (resultado / admin)            │
//  └─────────────────┴──────────────────────────────────┘
//  ════════════════ FOOTER FIJO ══════════════════════════
// ══════════════════════════════════════════════════════════
export default function App() {

  // ── Estados del formulario ──────────────────────────────
  // Objeto con todas las opciones del evento que eligió el usuario
  const [opciones, setOpciones] = useState({
    estilo: "",    // Ej: "Quinceañera romántica"
    cantidad: 50,  // Número de personas (10–500)
    silla: "",     // Ej: "Tiffany Blanca"
    mantel: "",    // Ej: "Rosa pálido"
    decoracion: "", // Ej: "Flores naturales"
    extras: ""     // Detalles opcionales libres
  });

  // Catálogo de productos traído del backend (agrupa por tipo)
  // Estructura: { silla: [{nombre, descripcion}], mantel: [...], ... }
  const [catalogo, setCatalogo]   = useState({});

  // Respuesta del backend tras generar imagen:
  // { imagen_url, prompt, desde_cache }
  const [resultado, setResultado] = useState(null);

  // true mientras se espera la respuesta de /api/generar
  const [cargando, setCargando]   = useState(false);

  // Mensaje de error para mostrar al usuario (vacío = sin error)
  const [error, setError]         = useState("");

  // Tab activo en el panel izquierdo: "disenar" o "admin"
  const [tab, setTab]             = useState("disenar");

  // Estado de la conexión con el backend:
  // null = verificando | true = conectado | false = error
  const [apiOk, setApiOk]         = useState(null);

  // ── Función: cargarCatalogo ──────────────────────────────
  // Pide al backend la lista de productos y pre-selecciona
  // el primero de cada categoría para que el formulario
  // nunca quede vacío al abrir la app.
  const cargarCatalogo = () => {
    fetch(`${API_BASE}/api/catalogo`)
      .then(r => r.json())
      .then(data => {
        setCatalogo(data);
        // Pre-selecciona el primer item de cada categoría
        // usando o.campo || data.tipo?.[0]?.nombre → no pisa una
        // selección existente si el usuario ya eligió algo
        setOpciones(o => ({
          ...o,
          estilo:     o.estilo     || data.estilo?.[0]?.nombre     || "",
          silla:      o.silla      || data.silla?.[0]?.nombre      || "",
          mantel:     o.mantel     || data.mantel?.[0]?.nombre     || "",
          decoracion: o.decoracion || data.decoracion?.[0]?.nombre || "",
        }));
      })
      .catch(() => setError("No se pudo conectar con el servidor. ¿Está corriendo el backend?"));
  };

  // ── Efecto de inicialización ─────────────────────────────
  // Se ejecuta UNA SOLA VEZ al abrir la app ([] = sin dependencias).
  // 1. Verifica que el backend esté encendido (/api/health)
  // 2. Carga el catálogo de productos
  useEffect(() => {
    fetch(`${API_BASE}/api/health`)
      .then(r => r.json())
      .then(d => setApiOk(d.status === "ok"))
      .catch(() => setApiOk(false));

    cargarCatalogo();
  }, []);

  // ── Helper: set(campo) ───────────────────────────────────
  // Retorna un event handler para actualizar un campo del formulario.
  // Para "cantidad" convierte el string del input a número.
  // Uso: onChange={set("estilo")}  →  opciones.estilo = e.target.value
  const set = (campo) => (e) =>
    setOpciones(o => ({
      ...o,
      [campo]: campo === "cantidad" ? Number(e.target.value) : e.target.value
    }));

  // ── Función: generar ─────────────────────────────────────
  // Se llama al presionar "Visualizar Evento".
  // Envía las opciones al backend vía POST /api/generar.
  // El backend construye el prompt, consulta la IA y devuelve
  // la URL de la imagen (nueva o del caché).
  const generar = async () => {
    // Valida que todos los campos obligatorios tengan valor
    if (!opciones.estilo || !opciones.silla || !opciones.mantel || !opciones.decoracion) {
      setError("Por favor completá todas las opciones.");
      return;
    }

    // Resetea estados antes de la nueva llamada
    setError("");
    setCargando(true);
    setResultado(null);

    try {
      const resp = await fetch(`${API_BASE}/api/generar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(opciones),
      });

      if (!resp.ok) throw new Error(`Error ${resp.status}`);

      const data = await resp.json();
      setResultado(data); // Guarda la respuesta para mostrar la imagen

    } catch (e) {
      setError(`Error al generar: ${e.message}`);
    } finally {
      // finally siempre se ejecuta, haya error o no
      // Desactiva el spinner de carga
      setCargando(false);
    }
  };

  // true cuando todos los campos obligatorios tienen valor
  // Se usa para habilitar/deshabilitar el botón "Visualizar Evento"
  const formCompleto = opciones.estilo && opciones.silla && opciones.mantel && opciones.decoracion;

  // ── RENDER ───────────────────────────────────────────────
  return (
    <>
      {/* Inyecta todos los estilos CSS en el <head> del documento */}
      <style>{estilos}</style>

      <div className="app">

        {/* ══════════════════════════════════════════════
            PANEL IZQUIERDO
            Barra lateral oscura con:
            - Título "EventoAI" (solo texto, sin ícono)
            - Tabs Diseñar / Admin
            - Formulario de opciones (tab Diseñar)
            - Descripción del panel admin (tab Admin)
            ══════════════════════════════════════════════ */}
        <aside className="panel-izq">

          {/* Logo: solo texto, sin ícono (eliminado en v2.2) */}
          <div className="logo">
            <h1>EventoAI</h1>
            <p>Visualizador de Eventos</p>
          </div>

          {/* Tabs: botones para cambiar entre Diseñar y Admin */}
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {[["disenar", "✦ Diseñar"], ["admin", "⚙ Admin"]].map(([id, lbl]) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                style={{
                  flex: 1,
                  padding: "0.5rem",
                  // Fondo semitransparente dorado si está activo, nada si no
                  background: tab === id ? "rgba(201,169,110,0.15)" : "transparent",
                  // Borde dorado si activo, grisáceo si no
                  border: `1px solid ${tab === id ? "var(--dorado)" : "rgba(255,255,255,0.1)"}`,
                  borderRadius: "4px",
                  color: tab === id ? "var(--dorado)" : "rgba(255,255,255,0.5)",
                  fontSize: "0.78rem",
                  letterSpacing: "0.08em",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                {lbl}
              </button>
            ))}
          </div>

          {/* ── Contenido del tab DISEÑAR ── */}
          {tab === "disenar" && (
            <>
              {/* Sección 1: Tipo y tamaño del evento */}
              <div className="seccion-form">
                <h2>◆ Evento</h2>
                <div className="campo">
                  <label>Estilo</label>
                  <select value={opciones.estilo} onChange={set("estilo")}>
                    {(catalogo.estilo || []).map(i => (
                      <option key={i.nombre} value={i.nombre}>{i.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="campo">
                  <label>Cantidad de personas</label>
                  <input
                    type="number"
                    min="10"
                    max="500"
                    value={opciones.cantidad}
                    onChange={set("cantidad")}
                  />
                </div>
              </div>

              {/* Sección 2: Mobiliario */}
              <div className="seccion-form">
                <h2>◆ Mobiliario</h2>
                <div className="campo">
                  <label>Silla</label>
                  <select value={opciones.silla} onChange={set("silla")}>
                    {(catalogo.silla || []).map(i => (
                      <option key={i.nombre} value={i.nombre}>{i.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="campo">
                  <label>Mantel</label>
                  <select value={opciones.mantel} onChange={set("mantel")}>
                    {(catalogo.mantel || []).map(i => (
                      <option key={i.nombre} value={i.nombre}>{i.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Sección 3: Decoración y extras */}
              <div className="seccion-form">
                <h2>◆ Decoración</h2>
                <div className="campo">
                  <label>Decoración Principal</label>
                  <select value={opciones.decoracion} onChange={set("decoracion")}>
                    {(catalogo.decoracion || []).map(i => (
                      <option key={i.nombre} value={i.nombre}>{i.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="campo">
                  <label>Detalles extra (opcional)</label>
                  <input
                    type="text"
                    value={opciones.extras}
                    onChange={set("extras")}
                    placeholder="Ej: colores especiales, tema..."
                  />
                </div>
              </div>

              {/* Botón de acción principal
                  Deshabilitado si: está cargando o el form está incompleto */}
              <button
                className="btn-generar"
                onClick={generar}
                disabled={cargando || !formCompleto}
              >
                {cargando ? "Generando..." : "✦ Visualizar Evento"}
              </button>
            </>
          )}

          {/* ── Contenido del tab ADMIN (solo descripción, el formulario está en panel-der) ── */}
          {tab === "admin" && (
            <div style={{ color: "var(--crema)", fontSize: "0.82rem", lineHeight: 1.6 }}>
              <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: "1rem" }}>
                Panel para gestionar el catálogo de productos.
                Los cambios se ven en el formulario de diseño.
              </p>
            </div>
          )}
        </aside>

        {/* ══════════════════════════════════════════════
            PANEL DERECHO
            Área principal que cambia según el tab activo:
            - Tab "disenar": preview de prompt + imagen
            - Tab "admin":   formulario de catálogo + historial
            ══════════════════════════════════════════════ */}
        <main className="panel-der">

          {/* ── Vista DISEÑAR ── */}
          {tab === "disenar" && (
            <>
              {/* Encabezado descriptivo */}
              <div className="encabezado-der">
                <h2>Tu Evento Visualizado</h2>
                <p>Elegí las opciones y generá una vista previa de tu decoración</p>
              </div>

              {/* Error de conexión: el backend no responde */}
              {apiOk === false && (
                <div className="aviso error">
                  ⚠️ No se puede conectar con el backend. Asegurate de que el servidor esté corriendo en <strong>localhost:8000</strong>.<br />
                  Ejecutá: <code>cd backend &amp;&amp; uvicorn main:app --reload</code>
                </div>
              )}

              {/* Verificando: spinner mientras se comprueba la conexión */}
              {apiOk === null && (
                <div className="aviso info">Conectando con el servidor...</div>
              )}

              {/* Preview del prompt: visible solo cuando el form está completo
                  y todavía no se generó ni se está generando nada */}
              {formCompleto && !resultado && !cargando && (
                <PromptPreview opciones={opciones} />
              )}

              {/* Loading: spinner mientras la IA genera la imagen */}
              {cargando && (
                <div className="loading">
                  <div className="spinner" />
                  <p>Generando tu visualización...</p>
                  <p style={{ fontSize: "0.8rem", color: "#aaa" }}>
                    Esto puede tardar 20–60 segundos
                  </p>
                </div>
              )}

              {/* Error de generación: algo salió mal con la IA o el backend */}
              {error && <div className="aviso error">{error}</div>}

              {/* Resultado: imagen generada con badge de caché y prompt */}
              {resultado && !cargando && (
                <div className="resultado">
                  {resultado.imagen_url.endsWith(".svg") ? (
                    /* Modo demo: no hay HF_API_KEY configurada */
                    <div className="aviso info" style={{ margin: "1rem" }}>
                      🎭 <strong>Modo Demo:</strong> Configurá tu <code>HF_API_KEY</code> en el backend para generar imágenes reales.
                    </div>
                  ) : (
                    /* Imagen real generada por la IA */
                    <img
                      className="resultado-img"
                      src={`${API_BASE}${resultado.imagen_url}`}
                      alt="Visualización del evento"
                    />
                  )}
                  <div className="resultado-info">
                    {/* Verde = del caché (instantáneo) | Azul = nueva imagen generada */}
                    <span className={`badge-cache ${resultado.desde_cache ? "cache" : "nuevo"}`}>
                      {resultado.desde_cache ? "✓ Desde caché" : "✦ Nueva imagen"}
                    </span>
                    {/* Prompt exacto enviado a la IA */}
                    <p className="prompt-texto">Prompt: {resultado.prompt}</p>
                  </div>
                </div>
              )}

              {/* Estado vacío inicial: antes de generar la primera imagen */}
              {!resultado && !cargando && !error && apiOk && (
                <div className="vacio">
                  <div className="icono">✦</div>
                  <h3>Comenzá a diseñar</h3>
                  <p>
                    Seleccioná las opciones en el panel izquierdo<br />
                    y generá la visualización de tu evento
                  </p>
                </div>
              )}
            </>
          )}

          {/* ── Vista ADMIN ── */}
          {tab === "admin" && (
            <>
              {/* Encabezado del panel admin */}
              <div className="encabezado-der">
                <h2>Panel de Administración</h2>
                <p>Gestioná el catálogo de productos disponibles</p>
              </div>
              {/* Componente admin: formulario + historial de imágenes */}
              <PanelAdmin catalogo={catalogo} onItemAgregado={cargarCatalogo} />
            </>
          )}

        </main>

      </div>

      {/* ══════════════════════════════════════════════
          FOOTER FIJO
          Siempre visible en la parte inferior.
          Se renderiza FUERA del .app para que el
          position:fixed funcione correctamente.
          ══════════════════════════════════════════════ */}
      <Footer />
    </>
  );
}
