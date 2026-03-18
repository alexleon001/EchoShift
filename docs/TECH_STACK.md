# 🛠️ TECH_STACK.md — EchoShift
> Stack tecnológico oficial del proyecto. Versión 1.0

---

## 1. Decisión de Framework

**React Native + Expo SDK 52** es el framework principal.

### Por qué esta elección:
- Un solo codebase para iOS y Android
- Expo EAS Build genera `.ipa` y `.apk` sin Mac obligatorio
- React Native Skia permite efectos visuales de nivel nativo (shaders, partículas, glow)
- Reanimated 3 para animaciones a 60/120fps en el hilo nativo
- Ecosistema maduro de monetización móvil (RevenueCat, AdMob)
- Hot reload acelera el desarrollo del gameplay

---

## 2. Stack Completo

### 2.1 Frontend (App Móvil)

| Tecnología | Versión | Uso |
|---|---|---|
| React Native | 0.76+ | Framework base |
| Expo SDK | 52 | Toolchain, builds, OTA updates |
| Expo Router | 4.x | Navegación file-based |
| React Native Skia | latest | Canvas, efectos neón, partículas |
| Reanimated 3 | 3.x | Animaciones nativas (60/120fps) |
| React Native Sound | latest | Audio en tiempo real |
| Expo Haptics | latest | Feedback táctil |
| Zustand | 5.x | Estado global (gameStore, playerStore) |
| TanStack Query | 5.x | Fetching y cache de patrones |
| Expo SecureStore | latest | Tokens y datos sensibles |
| React Native MMKV | latest | Storage rápido para preferencias |

### 2.2 Backend (Servidor de Niveles)

| Tecnología | Versión | Uso |
|---|---|---|
| Node.js | 22 LTS | Runtime |
| Fastify | 5.x | HTTP server (más rápido que Express) |
| TypeScript | 5.x | Tipado estricto |
| Anthropic SDK | latest | Cliente oficial Claude API |
| Supabase JS | 2.x | Cliente DB y Auth |
| ioredis | latest | Cache Redis de patrones |
| Zod | 3.x | Validación de schemas |
| pino | latest | Logging estructurado |

### 2.3 Infraestructura y Servicios

| Servicio | Uso |
|---|---|
| Supabase | PostgreSQL (scores, perfiles, Daily), Auth (email + Google + Apple) |
| Redis (Upstash) | Cache de patrones generados, leaderboard en tiempo real |
| Claude API (Anthropic) | Generación de patrones y Daily Challenge |
| RevenueCat | Gestión de suscripciones (EchoPass) e IAP cross-platform |
| Google AdMob | Anuncios rewarded opcionales |
| Expo EAS | Build nativo, OTA updates, Submit a stores |
| Railway / Fly.io | Deploy del servidor Node.js |

---

## 3. Arquitectura del Sistema

```
┌─────────────────────────────────────────┐
│           CLIENTE (React Native)         │
│                                          │
│  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │PatternEng│  │  Skia    │  │ Audio  │ │
│  │ (local)  │  │ Renderer │  │ Engine │ │
│  └────┬─────┘  └──────────┘  └────────┘ │
│       │                                  │
│  ┌────▼─────────────────────────────┐   │
│  │         Zustand Store             │   │
│  │  gameStore / playerStore          │   │
│  └────┬─────────────────────────────┘   │
└───────┼─────────────────────────────────┘
        │ HTTPS / WebSocket
        ▼
┌─────────────────────────────────────────┐
│         SERVIDOR (Node.js + Fastify)     │
│                                          │
│  POST /api/patterns/generate             │
│  GET  /api/daily-challenge               │
│  GET  /api/leaderboard                   │
│  POST /api/scores                        │
│                                          │
│  ┌──────────────┐  ┌──────────────────┐ │
│  │ClaudeGenerator│  │  PatternCache    │ │
│  │(Anthropic SDK)│  │  (Redis/Upstash) │ │
│  └──────┬────────┘  └──────────────────┘ │
└─────────┼───────────────────────────────┘
          │
          ▼
┌─────────────────┐    ┌──────────────────┐
│   Claude API    │    │    Supabase       │
│  (Anthropic)    │    │  PostgreSQL + Auth│
└─────────────────┘    └──────────────────┘
```

---

## 4. Base de Datos — Esquema Supabase

```sql
-- Perfiles de jugador
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users,
  username    TEXT UNIQUE NOT NULL,
  avatar_url  TEXT,
  rank        TEXT DEFAULT 'Bronce',
  total_xp    INTEGER DEFAULT 0,
  echoes      INTEGER DEFAULT 100,      -- moneda del juego
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Scores por modo
CREATE TABLE scores (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id   UUID REFERENCES profiles(id),
  mode        TEXT NOT NULL,            -- 'endless' | 'blitz' | 'daily' | 'duo'
  score       INTEGER NOT NULL,
  max_combo   INTEGER DEFAULT 0,
  cells_hit   INTEGER DEFAULT 0,
  duration_ms INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Daily Challenges
CREATE TABLE daily_challenges (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date        DATE UNIQUE NOT NULL,
  pattern     JSONB NOT NULL,           -- secuencia generada por Claude
  attempts    INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Items del jugador (skins, poderes)
CREATE TABLE player_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id   UUID REFERENCES profiles(id),
  item_id     TEXT NOT NULL,
  acquired_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 5. Integración Claude API

### Endpoint del servidor: `POST /api/patterns/generate`

**Request payload:**
```typescript
interface GeneratePatternRequest {
  difficulty: number;        // 1–10
  playerSkillMs: number;     // tiempo promedio de respuesta del jugador en ms
  lastPatterns: number[][];  // últimas 3 secuencias (array de cell IDs)
  gridSize: 4 | 5 | 6;      // tamaño de cuadrícula actual
  mode: 'endless' | 'blitz' | 'daily';
}
```

**Prompt base a Claude:**
```
Eres el motor de niveles de EchoShift, un puzzle de patrones móvil.
Genera exactamente UN patrón jugable en formato JSON.

Contexto del jugador:
- Dificultad objetivo: {difficulty}/10
- Tiempo de respuesta promedio: {playerSkillMs}ms
- Últimas secuencias (evitar repetir): {lastPatterns}
- Tamaño de cuadrícula: {gridSize}x{gridSize} ({gridSize*gridSize} celdas, IDs 0–{gridSize*gridSize-1})

Reglas del patrón:
- Entre {minCells} y {maxCells} celdas en la secuencia
- Ninguna celda repetida consecutivamente
- displayTime entre {minDisplay}ms y {maxDisplay}ms por celda
- Colores disponibles: "#00f5d4", "#f72585", "#ffd166", "#7b2fff"

Responde SOLO con este JSON (sin texto adicional, sin markdown):
{
  "sequence": [
    {"cell": 0, "color": "#00f5d4", "displayTime": 700}
  ],
  "totalCells": 6,
  "estimatedDifficulty": 5,
  "reasoning": "Patrón en L con timing variable para dificultad media"
}
```

**Response schema (Zod):**
```typescript
const PatternSchema = z.object({
  sequence: z.array(z.object({
    cell: z.number().min(0).max(35),
    color: z.enum(['#00f5d4', '#f72585', '#ffd166', '#7b2fff']),
    displayTime: z.number().min(150).max(1200),
  })),
  totalCells: z.number().min(3).max(20),
  estimatedDifficulty: z.number().min(1).max(10),
  reasoning: z.string(),
});
```

### Cache strategy (Redis):
- Patrones generados se cachean por `{difficulty}-{gridSize}-{hash(lastPatterns)}`
- TTL: 5 minutos (para evitar llamadas redundantes)
- Daily Challenge: cacheado 24 horas

---

## 6. Monetización — Implementación Técnica

### RevenueCat (IAP)
```typescript
// Productos configurados en RevenueCat dashboard
const PRODUCTS = {
  ECHO_PASS_MONTHLY: 'echoshift_pass_monthly_499',  // $4.99/mes
  ECHOES_SMALL:      'echoes_pack_100_099',          // 100 Echoes $0.99
  ECHOES_MEDIUM:     'echoes_pack_500_399',          // 500 Echoes $3.99
  ECHOES_LARGE:      'echoes_pack_1500_999',         // 1500 Echoes $9.99
  SKIN_PACK_NEON:    'skin_pack_neon_199',           // Skin pack $1.99
};
```

### AdMob (Rewarded Ads)
- Ad Unit ID en `.env` (separado para iOS y Android)
- Solo anuncios de tipo `RewardedAd`
- Recompensa estándar: 15 Echoes por anuncio visto
- Máximo 5 anuncios rewarded por día por usuario
- Usuarios con EchoPass activo: no ven propuestas de anuncios

---

## 7. Variables de Entorno

```bash
# .env.example

# Claude API
ANTHROPIC_API_KEY=sk-ant-...

# Supabase
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...        # Solo servidor, nunca en cliente

# Redis (Upstash)
UPSTASH_REDIS_URL=https://...
UPSTASH_REDIS_TOKEN=...

# RevenueCat
REVENUECAT_IOS_KEY=appl_...
REVENUECAT_ANDROID_KEY=goog_...

# AdMob
ADMOB_IOS_APP_ID=ca-app-pub-...
ADMOB_ANDROID_APP_ID=ca-app-pub-...
ADMOB_REWARDED_IOS=ca-app-pub-.../...
ADMOB_REWARDED_ANDROID=ca-app-pub-.../...

# App Config
API_BASE_URL=https://api.echoshift.app
ENVIRONMENT=development             # development | staging | production
```

---

## 8. Comandos de Desarrollo

```bash
# Instalar dependencias
npm install

# Arrancar app en Expo Go
npx expo start

# Arrancar servidor local
cd server && npm run dev

# Build de producción iOS
eas build --platform ios --profile production

# Build de producción Android
eas build --platform android --profile production

# TypeScript check
npx tsc --noEmit

# Tests
npm run test
```
