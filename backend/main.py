"""
====================================================
 EventoAI - Backend Principal (FastAPI)
 Autor:   GattiDev
 Fecha:   01/06/2026
 Version: 2.2 - Con .env y python-dotenv
====================================================

 QUE HACE ESTE ARCHIVO:
 ----------------------
 Es el CEREBRO del proyecto. Servidor web hecho con
 FastAPI (Python) que hace 4 cosas:

 1. CATALOGO: Guarda y devuelve productos del negocio
             (sillas, manteles, decoraciones, estilos)

 2. PROMPT:   Convierte opciones del usuario en descripcion
             en ingles para la IA.
             Ej: "Tiffany Blanca" -> "white Tiffany chairs"

 3. IMAGENES: Llama a la API de IA (Hugging Face o OpenAI)
             para generar foto del evento decorado

 4. CACHE:    Guarda cada imagen. Si alguien pide la misma
             combinacion, devuelve la imagen guardada SIN
             volver a llamar a la IA. Ahorra dinero y tiempo.

 ARQUITECTURA:
 Frontend (React) -> Backend (FastAPI) -> API de IA
                           |
                     SQLite (catalogo + cache)
====================================================
"""

# ─────────────────────────────────────────────────
#  IMPORTACIONES
# ─────────────────────────────────────────────────

from fastapi import FastAPI, HTTPException
# FastAPI: framework que crea el servidor web
# HTTPException: para devolver errores HTTP (400, 500, etc.)

from fastapi.middleware.cors import CORSMiddleware
# CORS: permite que React en localhost:3000 llame al backend
# en localhost:8000. Sin esto el navegador bloquea las llamadas.

from fastapi.staticfiles import StaticFiles
# StaticFiles: sirve las imagenes generadas como URLs publicas

from pydantic import BaseModel
# BaseModel: define la "forma" de los datos que recibe la API
# Si el frontend manda datos incorrectos, Pydantic los rechaza

from typing import Optional
# Optional: indica que un campo puede estar vacio (None)

import hashlib
# hashlib: genera hash MD5 del prompt
# El mismo texto SIEMPRE genera el mismo hash -> sirve para el cache

import os
# os: maneja archivos, carpetas y variables de entorno (API Keys)

import sqlite3
# sqlite3: base de datos en un solo archivo .db
# No necesita instalar nada extra, viene con Python

import httpx
# httpx: hace llamadas HTTP a APIs externas (HF, OpenAI)
# Como "fetch" de JavaScript pero para Python

import time

# ─────────────────────────────────────────────────
#  CARGA DE VARIABLES DE ENTORNO (.env)
#  load_dotenv() lee el archivo backend/.env
#  y carga HF_API_KEY, OPENAI_API_KEY, etc.
#  Si no existe el .env, lee igual las variables
#  del sistema (configuradas con export/set).
#  En produccion (Render/Railway) NO se usa .env,
#  las variables se configuran en el panel del servidor.
# ─────────────────────────────────────────────────
from dotenv import load_dotenv
load_dotenv()
# time: para guardar la fecha de creacion de cada imagen


# ─────────────────────────────────────────────────
#  CONFIGURACION
#  Editá estas variables segun el proveedor que uses
# ─────────────────────────────────────────────────

# Proveedor de IA activo: "huggingface" o "openai"
# Para cambiar: set AI_PROVIDER=openai (Windows)
#               export AI_PROVIDER=openai (Mac/Linux/Git Bash)
AI_PROVIDER = os.getenv("AI_PROVIDER", "huggingface")

# --- Hugging Face (GRATIS) ---
# Token gratis en: https://huggingface.co/settings/tokens
# Configura con: set HF_API_KEY=hf_tuTokenAqui
HF_API_KEY = os.getenv("HF_API_KEY", "")
HF_MODEL   = "stabilityai/stable-diffusion-xl-base-1.0"
# ATENCION: En 2024 HF cambio su URL. La URL correcta es esta:
HF_URL     = f"https://router.huggingface.co/hf-inference/models/{HF_MODEL}"

# --- OpenAI / DALL-E 3 (PAGO - mejor calidad) ---
# API key en: https://platform.openai.com/api-keys
# Costo: ~$0.04 USD por imagen
# Configura con: set OPENAI_API_KEY=sk-tuKeyAqui
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_URL     = "https://api.openai.com/v1/images/generations"

# Carpeta donde se guardan las imagenes en el servidor
IMAGE_DIR = "generated_images"

# Archivo de base de datos (se crea automaticamente)
DB_PATH = "eventos.db"

# Crea la carpeta de imagenes si no existe
os.makedirs(IMAGE_DIR, exist_ok=True)


# ─────────────────────────────────────────────────
#  INICIALIZACION DE FASTAPI
# ─────────────────────────────────────────────────

app = FastAPI(
    title="EventoAI API",
    version="2.0.0",
    description="API para visualizacion de eventos con IA"
)

# Configura CORS - permite que React llame al backend
# Sin esto veras errores "CORS policy" en el navegador
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "*"  # En produccion reemplaza con tu dominio: "https://tudominio.com"
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Las imagenes se acceden como URL: http://localhost:8000/images/nombre.png
app.mount("/images", StaticFiles(directory=IMAGE_DIR), name="images")


# ─────────────────────────────────────────────────
#  BASE DE DATOS (SQLite)
# ─────────────────────────────────────────────────

def init_db():
    """
    Crea las tablas de la base de datos si no existen.
    Se ejecuta una sola vez al arrancar el servidor.
    """
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    # TABLA 1: catalogo - productos del negocio
    # tipo: 'silla', 'mantel', 'decoracion' o 'estilo'
    c.execute("""
        CREATE TABLE IF NOT EXISTS catalogo (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            tipo        TEXT NOT NULL,
            nombre      TEXT NOT NULL,
            descripcion TEXT
        )
    """)

    # TABLA 2: imagenes - cache de imagenes generadas
    # prompt_hash: huella digital del prompt, evita duplicados
    # archivo: nombre del PNG guardado en el servidor
    c.execute("""
        CREATE TABLE IF NOT EXISTS imagenes (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            prompt_hash  TEXT UNIQUE NOT NULL,
            prompt_texto TEXT NOT NULL,
            archivo      TEXT NOT NULL,
            creado_en    INTEGER NOT NULL
        )
    """)

    # Cargar productos de ejemplo si el catalogo esta vacio
    c.execute("SELECT COUNT(*) FROM catalogo")
    if c.fetchone()[0] == 0:
        _insertar_catalogo_demo(c)

    conn.commit()
    conn.close()


def _insertar_catalogo_demo(c):
    """
    Carga productos de ejemplo al iniciar por primera vez.
    Podes reemplazar estos con los productos reales del negocio
    desde el Panel Admin en el frontend.
    """
    items = [
        # (tipo, nombre_que_ve_el_cliente, descripcion_para_IA)

        ("silla", "Tiffany Blanca",   "silla transparente estilo Tiffany color blanco"),
        ("silla", "Tiffany Dorada",   "silla Tiffany con detalles dorados"),
        ("silla", "Americana Negra",  "silla americana clasica color negro"),
        ("silla", "Chiavari Plata",   "silla Chiavari elegante color plata"),

        ("mantel", "Rosa Pastel",      "mantel liso color rosa pastel"),
        ("mantel", "Blanco Marfil",    "mantel blanco marfil con textura"),
        ("mantel", "Azul Cielo",       "mantel azul cielo suave"),
        ("mantel", "Dorado Brillante", "mantel con acabado dorado brillante"),

        ("decoracion", "Centro Floral",    "centro de mesa con flores naturales"),
        ("decoracion", "Globos Metalicos", "arreglo de globos metalicos"),
        ("decoracion", "Luces Calidas",    "iluminacion con luces LED calidas tipo fairy lights"),
        ("decoracion", "Velas Flotantes",  "centros con velas flotantes en agua"),

        ("estilo", "15 Anos Romantico",   "quinceañera romantica y elegante"),
        ("estilo", "Boda Clasica",        "casamiento tradicional y elegante"),
        ("estilo", "Cumpleanos Infantil", "festejo tematico para ninos"),
        ("estilo", "Corporativo Moderno", "evento empresarial estilo moderno"),
    ]

    c.executemany(
        "INSERT INTO catalogo (tipo, nombre, descripcion) VALUES (?, ?, ?)",
        items
    )


# ─────────────────────────────────────────────────
#  MODELOS DE DATOS (Pydantic)
#  Define que datos espera recibir cada endpoint
# ─────────────────────────────────────────────────

class OpcionesEvento(BaseModel):
    """
    Datos que manda el frontend al presionar 'Visualizar Evento'.
    Cada campo es una seleccion del formulario.
    """
    estilo:     str                  # Ej: "15 Anos Romantico"
    cantidad:   int                  # Ej: 100
    silla:      str                  # Ej: "Tiffany Blanca"
    mantel:     str                  # Ej: "Rosa Pastel"
    decoracion: str                  # Ej: "Centro Floral"
    extras:     Optional[str] = ""   # Texto libre opcional del usuario


class ItemCatalogo(BaseModel):
    """
    Datos para agregar un producto nuevo desde el Panel Admin.
    """
    tipo:        str                  # 'silla', 'mantel', 'decoracion' o 'estilo'
    nombre:      str                  # Nombre visible para el cliente
    descripcion: Optional[str] = ""   # Descripcion para mejorar el prompt de IA


# ─────────────────────────────────────────────────
#  CONSTRUCCION DEL PROMPT
#  Parte "hibrida": convierte opciones reales del
#  catalogo en descripcion que entiende la IA
# ─────────────────────────────────────────────────

def construir_prompt(opciones: OpcionesEvento) -> str:
    """
    Transforma las opciones elegidas en un prompt para la IA.

    Por que en ingles?
    Los modelos de IA fueron entrenados principalmente con
    texto en ingles. Los prompts en ingles generan imagenes
    de mejor calidad.

    Ejemplo de resultado:
    "Professional event decoration photography,
     romantic quinceañera party, elegant banquet hall
     for 100 guests, white Tiffany chairs,
     pastel pink tablecloths, floral centerpieces,
     luxury decoration, warm lighting, 4k, detailed"
    """

    # Diccionario de traduccion: nombre en catalogo -> descripcion en ingles
    # Si agregas productos nuevos al catalogo, agrega su traduccion aca
    traducciones = {
        "15 Anos Romantico":   "romantic quinceañera party",
        "Boda Clasica":        "classic elegant wedding reception",
        "Cumpleanos Infantil": "colorful children birthday party",
        "Corporativo Moderno": "modern corporate event",

        "Tiffany Blanca":  "white Tiffany ghost chairs",
        "Tiffany Dorada":  "golden Tiffany chairs",
        "Americana Negra": "black classic banquet chairs",
        "Chiavari Plata":  "silver Chiavari chairs",

        "Rosa Pastel":      "pastel pink satin tablecloths",
        "Blanco Marfil":    "ivory white textured tablecloths",
        "Azul Cielo":       "sky blue tablecloths",
        "Dorado Brillante": "shiny golden tablecloths",

        "Centro Floral":    "elegant floral centerpieces",
        "Globos Metalicos": "metallic balloon arch decorations",
        "Luces Calidas":    "warm fairy lights string lights",
        "Velas Flotantes":  "floating candles water centerpieces",
    }

    # Traduce cada opcion (si no hay traduccion usa el nombre tal cual)
    estilo_en     = traducciones.get(opciones.estilo,     opciones.estilo)
    silla_en      = traducciones.get(opciones.silla,      opciones.silla)
    mantel_en     = traducciones.get(opciones.mantel,     opciones.mantel)
    decoracion_en = traducciones.get(opciones.decoracion, opciones.decoracion)

    # ── POSITIVE PROMPT ──────────────────────────────────────────
    # Le dice a la IA QUE queremos que aparezca en la imagen.
    # Estas palabras guian el estilo fotografico y la calidad.
    prompt = (
        f"Professional event hall decoration photography, {estilo_en}, "
        f"elegant banquet hall setup for {opciones.cantidad} people, "
        f"{silla_en}, {mantel_en}, {decoracion_en}, "
        f"soft depth of field, documentary wedding photography style, "
        f"shot on Canon EOS R5, 85mm lens, f/1.8, natural color grading, "
        f"realistic fabric texture, true-to-life lighting, "
        f"high dynamic range, professional event photography"
    )

    # Agrega extras si el usuario escribio algo
    if opciones.extras:
        prompt += f", {opciones.extras}"

    # ── NEGATIVE PROMPT ───────────────────────────────────────────
    # Le dice a la IA QUE NO queremos en la imagen.
    # Hugging Face (Stable Diffusion) acepta negative_prompt como
    # parametro separado, lo que da MUCHO mejor control sobre el resultado.
    # DALL-E 3 no lo soporta de forma nativa, pero igual lo agregamos
    # al final del prompt principal entre parentesis como workaround.
    negative_prompt = (
        "no CGI, no 3D render look, no artificial shine, "
        "no overexposed highlights, no plastic texture, "
        "no perfect symmetry, no unrealistic lighting, "
        "no cartoon style, no 3D render, no fake looking, "
        "no oversaturated colors, no HDR look"
    )

    return prompt, negative_prompt


# ─────────────────────────────────────────────────
#  SISTEMA DE CACHE
#  Evita regenerar la misma imagen dos veces
# ─────────────────────────────────────────────────

def hash_prompt(prompt: str) -> str:
    """
    Convierte el prompt en un codigo unico de 32 caracteres (hash MD5).

    El mismo prompt SIEMPRE da el mismo hash.
    Prompts distintos dan hashes distintos.

    Ejemplo:
    "Professional event..." -> "a3f5c2d1e8b94f7c..."
    """
    return hashlib.md5(prompt.encode("utf-8")).hexdigest()


def buscar_en_cache(prompt_hash: str) -> Optional[dict]:
    """
    Busca si ya existe una imagen generada con este prompt.
    Retorna info de la imagen si existe, None si no existe.
    """
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute(
        "SELECT archivo, prompt_texto, creado_en FROM imagenes WHERE prompt_hash = ?",
        (prompt_hash,)
    )
    row = c.fetchone()
    conn.close()

    if row:
        return {"archivo": row[0], "prompt": row[1], "creado_en": row[2]}
    return None


def guardar_en_cache(prompt_hash: str, prompt: str, archivo: str):
    """
    Guarda la referencia de la imagen en la base de datos.
    Se llama despues de generar una imagen nueva exitosamente.
    """
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute(
        "INSERT INTO imagenes (prompt_hash, prompt_texto, archivo, creado_en) VALUES (?, ?, ?, ?)",
        (prompt_hash, prompt, archivo, int(time.time()))
    )
    conn.commit()
    conn.close()


# ─────────────────────────────────────────────────
#  GENERACION DE IMAGENES
#  Soporta Hugging Face (gratis) y OpenAI (pago)
# ─────────────────────────────────────────────────

async def generar_imagen_hf(prompt: str, negative_prompt: str, archivo_destino: str) -> bool:
    """
    Genera imagen con Hugging Face Inference API (GRATIS).

    Limites plan gratuito: ~1000 requests/mes
    Velocidad: 20-60 segundos por imagen
    Calidad: buena

    Como obtener token:
    1. Registrarse en huggingface.co
    2. Ir a huggingface.co/settings/tokens
    3. Crear token con permiso "Read" o "Inference"
    4. Windows:   set HF_API_KEY=hf_tuToken
       Git Bash:  export HF_API_KEY=hf_tuToken
    """
    if not HF_API_KEY:
        # Sin API key -> modo demo con placeholder
        _generar_placeholder(archivo_destino, prompt)
        return True

    headers = {"Authorization": f"Bearer {HF_API_KEY}"}
    payload = {
        "inputs": prompt,
        "parameters": {
            "width":  1024,
            "height": 768,
            "num_inference_steps": 30,  # Mas pasos = mejor calidad pero mas lento
            # negative_prompt: le dice a Stable Diffusion que evitar
            # Es una funcion nativa del modelo, muy efectiva
            "negative_prompt": negative_prompt,
        }
    }

    async with httpx.AsyncClient(timeout=120.0) as client:
        resp = await client.post(HF_URL, headers=headers, json=payload)

        if resp.status_code == 200:
            # Guarda los bytes de la imagen como PNG
            with open(archivo_destino, "wb") as f:
                f.write(resp.content)
            return True
        else:
            print(f"Error HF API: {resp.status_code} - {resp.text}")
            return False


async def generar_imagen_openai(prompt: str, negative_prompt: str, archivo_destino: str) -> bool:
    """
    Genera imagen con OpenAI DALL-E 3 (PAGO - mejor calidad).

    Precio: ~$0.04 USD por imagen (1024x1024 standard)
            ~$0.08 USD por imagen (1792x1024 standard)
    Velocidad: 5-15 segundos
    Calidad: excelente, fotorrealista

    Como obtener API key:
    1. Crear cuenta en platform.openai.com
    2. Ir a platform.openai.com/api-keys
    3. Crear nueva API key
    4. Cargar creditos (minimo $5 USD)
    5. Windows:   set OPENAI_API_KEY=sk-tuKey
       Git Bash:  export OPENAI_API_KEY=sk-tuKey
    """
    if not OPENAI_API_KEY:
        _generar_placeholder(archivo_destino, prompt)
        return True

    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json"
    }

    # DALL-E 3 no tiene campo native de negative_prompt.
    # Lo agregamos al final del prompt principal entre parentesis.
    # Es un workaround conocido que funciona bien en la practica.
    prompt_completo = f"{prompt}. Avoid: {negative_prompt}"

    payload = {
        "model":   "dall-e-3",
        "prompt":  prompt_completo,
        "n":       1,               # DALL-E 3 solo permite 1 imagen por llamada
        "size":    "1792x1024",     # Horizontal, ideal para salones de eventos
        "quality": "standard",      # "standard" o "hd" (hd = doble precio)
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(OPENAI_URL, headers=headers, json=payload)

        if resp.status_code == 200:
            data = resp.json()
            # OpenAI devuelve una URL temporal (expira en ~1 hora)
            # Descargamos y guardamos la imagen localmente
            image_url = data["data"][0]["url"]
            img_resp = await client.get(image_url)
            with open(archivo_destino, "wb") as f:
                f.write(img_resp.content)
            return True
        else:
            print(f"Error OpenAI API: {resp.status_code} - {resp.text}")
            return False


def _generar_placeholder(archivo_destino: str, prompt: str):
    """
    Crea una imagen SVG de placeholder cuando no hay API key.
    Util para probar que el flujo completo funciona sin gastar creditos.
    """
    svg = f"""<svg width="1024" height="768" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a1a2e"/>
      <stop offset="100%" style="stop-color:#16213e"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="768" fill="url(#bg)"/>
  <rect x="50" y="50" width="924" height="668" fill="none"
        stroke="#c9a96e" stroke-width="2" stroke-dasharray="10,5" rx="8"/>
  <text x="512" y="280" font-family="Arial" font-size="32"
        fill="#c9a96e" text-anchor="middle" font-weight="bold">
    EventoAI - Modo Demo
  </text>
  <text x="512" y="340" font-family="Arial" font-size="16"
        fill="#a0a0b0" text-anchor="middle">
    Configura HF_API_KEY o OPENAI_API_KEY para imagenes reales
  </text>
  <text x="512" y="420" font-family="Arial" font-size="13"
        fill="#606080" text-anchor="middle">
    {prompt[:90]}...
  </text>
</svg>"""

    with open(archivo_destino.replace(".png", ".svg"), "w", encoding="utf-8") as f:
        f.write(svg)
    with open(archivo_destino, "wb") as f:
        f.write(b"")


async def generar_imagen(prompt: str, negative_prompt: str, archivo_destino: str) -> bool:
    """
    Funcion principal: decide que API usar segun la configuracion.

    Logica de decision:
    - Si AI_PROVIDER=openai Y hay OPENAI_API_KEY -> usa DALL-E 3
    - Si hay HF_API_KEY -> usa Hugging Face
    - Si no hay ninguna key -> modo demo (placeholder)
    """
    if AI_PROVIDER == "openai" and OPENAI_API_KEY:
        return await generar_imagen_openai(prompt, negative_prompt, archivo_destino)
    elif HF_API_KEY:
        return await generar_imagen_hf(prompt, negative_prompt, archivo_destino)
    else:
        _generar_placeholder(archivo_destino, prompt)
        return True


# ─────────────────────────────────────────────────
#  ENDPOINTS (URLs de la API)
# ─────────────────────────────────────────────────

@app.on_event("startup")
def on_startup():
    """Se ejecuta al arrancar el servidor. Muestra estado en la terminal."""
    init_db()
    print("\n" + "="*45)
    print("  EventoAI Backend v2.0 listo")
    print("="*45)
    print(f"  Proveedor IA:   {AI_PROVIDER}")
    print(f"  HF Key:         {'Configurada' if HF_API_KEY else 'NO configurada (modo demo)'}")
    print(f"  OpenAI Key:     {'Configurada' if OPENAI_API_KEY else 'NO configurada'}")
    print(f"  Imagenes en:    {os.path.abspath(IMAGE_DIR)}")
    print("="*45 + "\n")


@app.post("/api/generar")
async def generar(opciones: OpcionesEvento):
    """
    Endpoint principal. El frontend lo llama al presionar 'Visualizar Evento'.

    Flujo:
    1. Construye el prompt en ingles desde las opciones
    2. Calcula el hash del prompt
    3. Busca en cache -> si existe, devuelve instantaneo
    4. Si no existe -> genera con IA, guarda, devuelve
    """
    # Construir el prompt y el negative prompt
    # construir_prompt ahora devuelve dos valores: (prompt, negative_prompt)
    prompt, negative_prompt = construir_prompt(opciones)
    print(f"\nPrompt: {prompt}")
    print(f"Negative: {negative_prompt}")

    # Calcular hash para buscar en cache
    phash = hash_prompt(prompt)

    # Buscar en cache
    cached = buscar_en_cache(phash)
    if cached:
        archivo = cached["archivo"]
        # Verificar si es SVG (modo demo) o PNG (imagen real)
        nombre_real = (
            archivo.replace(".png", ".svg")
            if os.path.exists(os.path.join(IMAGE_DIR, archivo.replace(".png", ".svg")))
            else archivo
        )
        print(f"Cache encontrado: {nombre_real}")
        return {
            "imagen_url":  f"/images/{nombre_real}",
            "prompt":      cached["prompt"],
            "desde_cache": True,
            "mensaje":     "Imagen encontrada en cache"
        }

    # Generar nueva imagen
    nombre_archivo = f"{phash}.png"
    ruta_completa  = os.path.join(IMAGE_DIR, nombre_archivo)

    print(f"Generando nueva imagen...")
    exito = await generar_imagen(prompt, negative_prompt, ruta_completa)

    if not exito:
        raise HTTPException(
            status_code=500,
            detail="Error al generar imagen. Verifica tu API key y conexion a internet."
        )

    # Guardar en cache
    guardar_en_cache(phash, prompt, nombre_archivo)

    nombre_real = (
        nombre_archivo.replace(".png", ".svg")
        if os.path.exists(ruta_completa.replace(".png", ".svg"))
        else nombre_archivo
    )

    print(f"Imagen guardada: {nombre_real}")
    return {
        "imagen_url":  f"/images/{nombre_real}",
        "prompt":      prompt,
        "desde_cache": False,
        "mensaje":     "Nueva imagen generada y guardada"
    }


@app.get("/api/catalogo")
def obtener_catalogo():
    """
    Devuelve todos los productos agrupados por tipo.
    El frontend usa esto para llenar los dropdowns del formulario.
    """
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT tipo, nombre, descripcion FROM catalogo ORDER BY tipo, nombre")
    rows = c.fetchall()
    conn.close()

    catalogo = {}
    for tipo, nombre, desc in rows:
        if tipo not in catalogo:
            catalogo[tipo] = []
        catalogo[tipo].append({"nombre": nombre, "descripcion": desc})

    return catalogo


@app.post("/api/catalogo")
def agregar_item(item: ItemCatalogo):
    """
    Agrega un producto nuevo al catalogo desde el Panel Admin.
    """
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute(
        "INSERT INTO catalogo (tipo, nombre, descripcion) VALUES (?, ?, ?)",
        (item.tipo, item.nombre, item.descripcion)
    )
    conn.commit()
    conn.close()
    return {"mensaje": f"Item '{item.nombre}' agregado al catalogo"}


@app.get("/api/historial")
def obtener_historial():
    """
    Lista todas las imagenes generadas. Usado en el Panel Admin.
    """
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute(
        "SELECT prompt_hash, prompt_texto, archivo, creado_en "
        "FROM imagenes ORDER BY creado_en DESC"
    )
    rows = c.fetchall()
    conn.close()

    return [
        {
            "hash":       r[0][:8] + "...",
            "prompt":     r[1],
            "imagen_url": f"/images/{r[2]}",
            "creado_en":  r[3]
        }
        for r in rows
    ]


@app.get("/api/health")
def health():
    """
    Verifica que el servidor esta corriendo.
    Abrir en el navegador: http://localhost:8000/api/health
    """
    return {
        "status":             "ok",
        "hf_configurado":     bool(HF_API_KEY),
        "openai_configurado": bool(OPENAI_API_KEY),
        "proveedor_activo":   AI_PROVIDER
    }
