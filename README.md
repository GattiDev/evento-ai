# EventoAI — Visualizador de Eventos con IA

**Autor:** GattiDev
**Fecha:** 01/06/2026

---

## ¿Qué es EventoAI?

EventoAI es una aplicación web que permite visualizar decoraciones de eventos mediante inteligencia artificial. El usuario elige el estilo del evento, mobiliario y decoración desde un formulario, y el sistema genera automáticamente una imagen realista usando IA (Hugging Face o OpenAI).

Incluye caché inteligente: si la misma combinación de opciones ya fue generada antes, devuelve la imagen guardada de forma instantánea sin llamar a la IA nuevamente.

---

## Tecnologías

| Parte | Tecnología |
|---|---|
| Frontend | React + Vite |
| Backend | Python FastAPI |
| Base de datos | SQLite |
| IA (imágenes) | Hugging Face (gratis) / OpenAI DALL-E 3 (pago) |

---

## Estructura del proyecto

```
EventoAI/
├── backend/
│   ├── main.py              ← Servidor FastAPI (toda la lógica)
│   ├── requirements.txt     ← Dependencias Python
│   ├── .env                 ← API keys locales (NO se sube a Git)
│   ├── .env.example         ← Plantilla del .env (SÍ se sube a Git)
│   ├── eventos.db           ← Base de datos (se crea automáticamente)
│   └── generated_images/    ← Imágenes generadas (se crea automáticamente)
├── frontend/
│   ├── galeria/
│   │   ├── icono.png        ← Favicon de la app
│   │   └── footer.png       ← Logo GattiDev del footer
│   ├── src/
│   │   ├── App.jsx          ← Interfaz completa en React
│   │   └── main.jsx         ← Punto de entrada
│   ├── index.html
│   └── vite.config.js
├── .gitignore               ← Excluye .env, node_modules, venv, etc.
├── INICIAR.bat              ← Inicio rápido para Windows
└── README.md
```

---

## Cómo ejecutar el proyecto

### Requisitos previos

- **Python 3.12** → https://www.python.org/downloads/ (marcar "Add Python to PATH")
- **Node.js 18+** → https://nodejs.org/

### Opción A — Windows (recomendado)

Doble clic en `INICIAR.bat`. Instala todo y abre el navegador automáticamente.

### Opción B — Manual

**Terminal 1 — Backend:**
```bash
cd backend
python -m venv venv
source venv/Scripts/activate        # Git Bash / Mac / Linux
# venv\Scripts\activate             # Windows CMD

pip install -r requirements.txt

# Configurar la API key en el archivo .env (ver sección siguiente)
uvicorn main:app --reload
# Servidor corriendo en: http://localhost:8000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm install
npm run dev
# App disponible en: http://localhost:3000
```

> Las dos terminales deben quedar abiertas y corriendo al mismo tiempo.

---

## Configurar la HF_API_KEY

### Con archivo .env (recomendado)

El proyecto usa un archivo `.env` en la carpeta `backend/` para guardar las keys de forma segura. Este archivo **no se sube a Git** (está en el `.gitignore`).

**Paso 1 — Copiar la plantilla:**
```bash
cd backend
cp .env.example .env
```

**Paso 2 — Editar el `.env` con tu token real:**
```
HF_API_KEY=hf_tuTokenRealAqui
OPENAI_API_KEY=          ← dejar vacío si no usás OpenAI
AI_PROVIDER=huggingface
```

**Paso 3 — Iniciar el backend normalmente:**
```bash
uvicorn main:app --reload
```

El archivo `.env` se carga automáticamente al arrancar. No hace falta hacer ningún `export`.

---

## Cómo generar la HF_API_KEY en Hugging Face

Sin esta clave la app funciona en **modo demo** (muestra un placeholder en lugar de imágenes reales). Es **gratuita** y lleva menos de 5 minutos configurarla.

### Paso 1 — Crear cuenta

1. Ir a **https://huggingface.co** y hacer clic en **Sign Up**
2. Completar: username, email y contraseña
3. Verificar el email con el link que llega al correo

### Paso 2 — Crear el token

1. Iniciar sesión en https://huggingface.co
2. Clic en la foto de perfil (arriba a la derecha) → **Settings**
3. En el menú izquierdo → **Access Tokens**
   - URL directa: https://huggingface.co/settings/tokens
4. Clic en **New token**
5. Completar:
   - **Name:** `evento-ai` (o cualquier nombre)
   - **Token type:** `Read`
6. Clic en **Generate a token**
7. **Copiar el token inmediatamente** — solo se muestra una vez
   - Formato: `hf_aBcDeFgHiJkLmNoPqRsTuVwXyZ123456`

> Si lo perdés, simplemente creá uno nuevo desde el mismo lugar.

### Paso 3 — Pegarlo en el .env

```
HF_API_KEY=hf_tuTokenRealAqui
```

### Paso 4 — Verificar que funciona

Con el backend corriendo, abrir en el navegador:
```
http://localhost:8000/api/health
```

Debe mostrar:
```json
{
  "status": "ok",
  "hf_configurado": true,
  "proveedor_activo": "huggingface"
}
```

---

## Subir a GitHub

```bash
# Desde la raíz del proyecto
git init
git add .
git commit -m "feat: EventoAI v2.2 - GattiDev"
git remote add origin https://github.com/tu-usuario/eventoai.git
git push -u origin main
```

> El `.gitignore` ya excluye automáticamente el `.env`, `node_modules/`,
> `venv/`, `eventos.db` y la carpeta de imágenes generadas.
> Solo se sube el `.env.example` (sin valores reales) como guía.

---

## Despliegue gratuito para portfolio

Para que cualquier persona pueda probarlo desde el navegador sin instalar nada, se despliega el backend y el frontend por separado:

| Parte | Servicio | URL de ejemplo |
|---|---|---|
| Backend (FastAPI) | **Render.com** | `https://eventoai-api.onrender.com` |
| Frontend (React) | **Vercel** | `https://eventoai.vercel.app` |

### Backend en Render

1. Crear cuenta en https://render.com
2. **New → Web Service** → conectar repositorio de GitHub
3. Configurar:
   - **Root directory:** `backend`
   - **Build command:** `pip install -r requirements.txt`
   - **Start command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. En **Environment Variables** agregar:
   - `HF_API_KEY` = `hf_tuTokenReal`
   - `AI_PROVIDER` = `huggingface`
5. Render genera una URL pública automáticamente

### Frontend en Vercel

1. En `frontend/src/App.jsx` cambiar `API_BASE` a la URL de Render:
   ```js
   const API_BASE = "https://eventoai-api.onrender.com";
   ```
2. Crear cuenta en https://vercel.com
3. **Import** → repositorio de GitHub → carpeta `frontend`
4. Vercel detecta Vite automáticamente y despliega

> ⚠️ **Aviso importante para visitantes del portfolio:**
> El backend en Render (plan gratuito) **se duerme automáticamente** después de
> 15 minutos sin recibir visitas. La **primera generación puede tardar hasta
> 30–40 segundos** mientras el servidor despierta. Las siguientes son normales.
> Esto es una limitación del plan gratuito de Render, no del proyecto.

---

## Solución de errores comunes

| Error | Solución |
|---|---|
| "No se puede conectar con el backend" | El backend no está corriendo. Ejecutar `uvicorn main:app --reload` |
| `hf_configurado: false` en /api/health | Verificar que el `.env` tiene el token correcto y está en la carpeta `backend/` |
| "uvicorn: command not found" | El entorno virtual no está activado. Ejecutar `source venv/Scripts/activate` |
| "Module not found: dotenv" | Ejecutar `pip install -r requirements.txt` para instalar `python-dotenv` |
| Las imágenes no se ven en producción | Verificar que `API_BASE` en `App.jsx` apunta a la URL de Render y recompilar con `npm run build` |

---

*EventoAI — Desarrollado por GattiDev · 01/06/2026*
