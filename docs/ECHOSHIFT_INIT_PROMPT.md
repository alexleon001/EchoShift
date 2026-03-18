# 🌀 ECHOSHIFT — AI Driven Project Starter Prompt
> Pega este prompt completo en tu Claude CLI para iniciar el proyecto.

---

## ROL Y CONTEXTO

Eres el arquitecto principal de **EchoShift**, un videojuego móvil para iOS y Android.
Tu misión en esta sesión es leer los archivos de contexto del proyecto (`GAME_DESIGN.md`,
`TECH_STACK.md`, `ROADMAP.md`), comprenderlos en profundidad y usarlos como fuente
de verdad absoluta para todas las decisiones que tomes.

No asumas nada que no esté en esos archivos. Si algo no está definido, pregunta
antes de inventar. Si hay contradicciones entre archivos, señálalas.

---

## INSTRUCCIONES PARA LEER EL AI DRIVEN PROJECT STARTER

Antes de escribir una sola línea de código o crear cualquier archivo, ejecuta
estos pasos en orden y confírmalos uno a uno:

### PASO 1 — Leer y resumir cada archivo de contexto

```
Lee GAME_DESIGN.md y extrae:
  - Nombre del juego y concepto central
  - Core loop exacto (los pasos del gameplay)
  - Todos los modos de juego listados
  - Universo visual y estética
  - Qué rol cumple la IA (Claude API) dentro del juego

Lee TECH_STACK.md y extrae:
  - Framework principal y versión
  - Librerías de animación y canvas
  - Stack de backend y base de datos
  - Sistema de monetización (IAP provider)
  - Cómo se conecta Claude API al servidor

Lee ROADMAP.md y extrae:
  - Fases del proyecto con fechas o duraciones
  - Entregables de la Fase 1 (MVP)
  - KPIs objetivo del mes 6
  - Dependencias críticas entre fases
```

Al terminar este paso, imprime un resumen estructurado de lo que entendiste
de cada archivo. Espera mi confirmación antes de continuar.

---

### PASO 2 — Validar coherencia entre archivos

Cruza la información de los tres archivos y responde:

1. ¿El tech stack soporta todas las mecánicas descritas en el game design?
2. ¿El roadmap es realista dado el scope del game design?
3. ¿Hay alguna mecánica (ej: modo Duo en tiempo real, generación IA) que
   necesite infraestructura no mencionada en TECH_STACK.md?
4. ¿Los KPIs del roadmap son alcanzables con el modelo de monetización descrito?

Lista cualquier gap o inconsistencia. Espera mi validación antes de continuar.

---

### PASO 3 — Scaffolding del proyecto

Solo cuando yo confirme el paso anterior, crea la estructura completa del proyecto:

```
echoshift/
├── app/                          # React Native + Expo (App Router)
│   ├── (tabs)/
│   │   ├── index.tsx             # Pantalla principal / juego
│   │   ├── leaderboard.tsx       # Rankings
│   │   └── profile.tsx           # Perfil y logros
│   ├── game/
│   │   ├── [mode].tsx            # Endless, Blitz, Daily, Duo
│   └── _layout.tsx
├── src/
│   ├── components/
│   │   ├── Grid/                 # Cuadrícula principal del juego
│   │   │   ├── GridCell.tsx
│   │   │   ├── GridBoard.tsx
│   │   │   └── GridEffects.tsx   # Partículas, neón, shaders (Skia)
│   │   ├── HUD/                  # Score, combo, timer
│   │   ├── Shop/                 # Tienda y EchoPass
│   │   └── UI/                   # Botones, modales, toasts
│   ├── engine/
│   │   ├── PatternEngine.ts      # Lógica de generación y validación
│   │   ├── ComboSystem.ts        # Multiplicadores y streaks
│   │   ├── DifficultyAdapter.ts  # Ajuste dinámico de dificultad
│   │   └── SoundEngine.ts        # Audio reactivo al gameplay
│   ├── services/
│   │   ├── claude.ts             # Cliente Claude API (generación de niveles)
│   │   ├── supabase.ts           # Auth, perfil, scores
│   │   ├── revenuecat.ts         # Suscripciones e IAP
│   │   └── analytics.ts          # Eventos de gameplay
│   ├── store/
│   │   ├── gameStore.ts          # Estado global (Zustand)
│   │   ├── playerStore.ts        # Perfil, XP, items
│   │   └── settingsStore.ts      # Preferencias y accesibilidad
│   ├── constants/
│   │   ├── theme.ts              # Colores neón, tipografía, espaciado
│   │   ├── patterns.ts           # Patrones offline de fallback
│   │   └── config.ts             # Feature flags, URLs, keys
│   └── utils/
│       ├── haptics.ts            # Feedback táctil
│       ├── audio.ts              # Helpers de sonido
│       └── validators.ts         # Validar respuesta del jugador
├── server/                       # Backend Node.js + Fastify
│   ├── routes/
│   │   ├── patterns.ts           # POST /generate — llama a Claude API
│   │   ├── leaderboard.ts        # GET /scores, POST /score
│   │   └── daily.ts              # GET /daily-challenge
│   ├── services/
│   │   ├── claudeGenerator.ts    # Lógica de prompt a Claude para niveles
│   │   └── patternCache.ts       # Redis cache de patrones generados
│   └── index.ts                  # Entry point Fastify
├── docs/
│   ├── GAME_DESIGN.md            # ← Archivo fuente (ya existe)
│   ├── TECH_STACK.md             # ← Archivo fuente (ya existe)
│   ├── ROADMAP.md                # ← Archivo fuente (ya existe)
│   └── CLAUDE_PROMPTS.md         # Prompts usados para generar niveles
├── assets/
│   ├── sounds/
│   ├── fonts/
│   └── icons/
├── app.json                      # Config Expo
├── eas.json                      # Config EAS Build (iOS + Android)
├── package.json
├── tsconfig.json
└── .env.example                  # Variables de entorno documentadas
```

Crea cada archivo con su contenido inicial correcto, no vacío.
Los archivos de lógica deben tener su interfaz TypeScript definida.
Los componentes deben tener su estructura JSX base.

---

### PASO 4 — Implementar el Core Loop (MVP Fase 1)

Con el scaffold creado, implementa en este orden exacto:

1. **`GridBoard.tsx`** — cuadrícula 4×4 con celdas tocables, colores neón,
   animación de activación con React Native Skia

2. **`PatternEngine.ts`** — genera una secuencia de N celdas, controla
   el timing de reproducción, valida la respuesta del jugador

3. **`claudeGenerator.ts`** (server) — endpoint que llama a Claude API con
   este prompt base:

   ```
   Genera un patrón de juego para EchoShift.
   Nivel de dificultad: {difficulty} (1–10)
   Habilidad del jugador: {playerSkill} (ms de tiempo de reacción promedio)
   Historial reciente: {lastPatterns} (últimas 3 secuencias para evitar repetición)

   Responde SOLO con JSON válido:
   {
     "sequence": [{"cell": 0-15, "color": "#hex", "duration": ms}],
     "displayTime": ms,
     "difficulty": 1-10,
     "reasoning": "breve explicación del patrón"
   }
   ```

4. **`ComboSystem.ts`** — multiplicadores x1 a x10, animación de combo break

5. **`HUD`** — score en tiempo real, combo counter, timer visual

6. **Pantalla principal** — conecta todo: fetch patrón → mostrar → input
   jugador → validar → score → siguiente patrón

---

### PASO 5 — Checklist de calidad antes de cerrar la sesión

Antes de terminar, verifica cada punto:

- [ ] La app corre con `npx expo start` sin errores
- [ ] El core loop es jugable end-to-end (ver → replicar → puntuar)
- [ ] Claude API genera al menos un patrón válido en el servidor local
- [ ] TypeScript sin errores (`tsc --noEmit`)
- [ ] No hay `any` types sin justificación
- [ ] Todas las variables de entorno están en `.env.example`
- [ ] El README explica cómo correr el proyecto en 5 pasos o menos

---

## REGLAS DE TRABAJO PARA TODA LA SESIÓN

```
SIEMPRE:
  ✅ Leer los archivos .md antes de actuar
  ✅ Confirmar cada paso antes de avanzar al siguiente
  ✅ Escribir TypeScript estricto
  ✅ Comentar la lógica no obvia del PatternEngine
  ✅ Usar los nombres de archivos y carpetas exactos del scaffold

NUNCA:
  ❌ Hardcodear API keys (usar process.env siempre)
  ❌ Crear lógica de juego en componentes UI
  ❌ Usar `any` en TypeScript sin un comentario que explique por qué
  ❌ Saltar pasos del checklist
  ❌ Asumir decisiones de diseño sin consultar GAME_DESIGN.md
```

---

## PRIMER MENSAJE QUE DEBES DARME

Cuando termines de leer este prompt, respóndeme con:

1. Confirmación de que leíste los 3 archivos `.md`
2. Resumen de 5 puntos clave de cada uno
3. Lista de cualquier información faltante que necesites de mí
4. Tu plan de acción para esta sesión en formato de checklist

**Comenzamos. Lee los archivos y preséntame tu comprensión del proyecto.**
