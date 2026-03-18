# 🗺️ ROADMAP.md — EchoShift
> Plan de desarrollo y lanzamiento. Versión 1.0

---

## Visión General

```
Fase 1 (Semanas 1–4)  → MVP jugable internamente
Fase 2 (Semanas 5–8)  → Pulido, monetización, beta pública
Fase 3 (Semanas 9–12) → Social, launch en stores
Fase 4 (Mes 4+)       → Crecimiento y retención continua
```

---

## FASE 1 — MVP Core (Semanas 1–4)

**Objetivo:** Tener el juego jugable end-to-end en un dispositivo físico.

### Semana 1 — Scaffold y Setup
- [ ] Crear proyecto Expo con TypeScript estricto
- [ ] Configurar EAS Build (iOS + Android profiles)
- [ ] Setup Supabase: proyecto, schema inicial, Auth
- [ ] Setup servidor Fastify en Railway (staging)
- [ ] Integrar Anthropic SDK en el servidor
- [ ] Variables de entorno configuradas en todos los entornos
- [ ] README con instrucciones de setup en 5 pasos

### Semana 2 — Motor de Juego
- [ ] `GridBoard.tsx` — cuadrícula 4×4 con Skia (celdas, colores, glow)
- [ ] `PatternEngine.ts` — generar, reproducir y validar secuencias
- [ ] `ComboSystem.ts` — multiplicadores x1 a x10
- [ ] `claudeGenerator.ts` — endpoint que llama a Claude API
- [ ] Patrones de fallback offline (50 patrones hardcodeados)
- [ ] Haptics y audio básico (4 tonos, un tono por color)

### Semana 3 — Gameplay Completo
- [ ] HUD completo: score, combo, timer visual
- [ ] Pantalla de resultados con score breakdown
- [ ] Modo Endless funcionando end-to-end
- [ ] Persistencia de récord personal (MMKV local)
- [ ] Animación de game over y retry
- [ ] DifficultyAdapter: ajuste de timing según skill del jugador

### Semana 4 — Integración y Testing
- [ ] Auth con Supabase (email + Google)
- [ ] Guardar scores en DB remota
- [ ] Leaderboard global básico (top 10)
- [ ] Testing en dispositivos físicos iOS y Android
- [ ] Fix de bugs críticos de gameplay
- [ ] Daily Challenge básico (generado manualmente, sin cron aún)

**Entregable Fase 1:** Build de TestFlight + APK interno. El core loop es fluido y divertido.

---

## FASE 2 — Pulido y Monetización (Semanas 5–8)

**Objetivo:** Experiencia premium lista para usuarios reales.

### Semana 5 — Visual y Audio
- [ ] Efectos de partículas en racha (React Native Skia)
- [ ] Bloom/glow avanzado en celdas activas
- [ ] Animaciones de transición entre modos (Reanimated 3)
- [ ] Música generativa que reacciona al combo (BPM dinámico)
- [ ] Scanlines y grid de fondo animado
- [ ] Animación de combo break dramática

### Semana 6 — Sistema de Economía
- [ ] Moneda Echoes: ganar, gastar, balance en HUD
- [ ] 5 Power-ups implementados con lógica completa
- [ ] Sistema de XP y rangos visibles (Bronce → Diamante)
- [ ] Inventario de items del jugador en Supabase

### Semana 7 — Monetización Real
- [ ] RevenueCat integrado (iOS + Android)
- [ ] EchoPass $4.99/mes: compra, validación, beneficios activos
- [ ] 3 packs de Echoes en tienda
- [ ] Google AdMob rewarded: integración y límite diario
- [ ] Tienda in-app: UI completa con previews de skins
- [ ] 2 skins de cuadrícula (incluida una gratuita)

### Semana 8 — Beta Pública
- [ ] Modo Blitz ⚡ completo
- [ ] Daily Challenge automatizado (cron job medianoche UTC)
- [ ] Push notifications: recordatorio Daily Challenge
- [ ] Onboarding de 3 pasos para nuevos jugadores
- [ ] 100 beta testers vía TestFlight y Google Play Beta
- [ ] Crash reporting (Sentry)

**Entregable Fase 2:** App monetizada con 100 beta users activos.

---

## FASE 3 — Social y Launch (Semanas 9–12)

**Objetivo:** Lanzamiento público con viralidad y retención.

### Semana 9 — Social Layer
- [ ] Perfil público con stats y ranking
- [ ] Lista de amigos (buscar por username)
- [ ] Leaderboard de amigos vs global
- [ ] Share nativo de score con imagen generada (OG card)
- [ ] Deep links para score challenges (`echoshift://challenge/xyz`)

### Semana 10 — Modo Duo
- [ ] WebSocket rooms en servidor (socket.io o Fastify WS)
- [ ] Modo Duo 1v1 en tiempo real
- [ ] Generación de código de sala de 6 dígitos
- [ ] Compartir sala por link nativo
- [ ] Pantalla de resultados Duo con diferencial de errores

### Semana 11 — Pre-Launch
- [ ] ASO completo: screenshots, preview video, descripción en EN/ES
- [ ] App icon final + splash screen animado
- [ ] Privacy Policy y Terms of Service (páginas web estáticas)
- [ ] Revisión de Apple App Store (submit)
- [ ] Revisión de Google Play (submit)
- [ ] Landing page del juego (echoshift.app)

### Semana 12 — Launch 🚀
- [ ] Lanzamiento simultáneo iOS + Android
- [ ] Post en redes sociales (TikTok, Instagram, Reddit r/indiegaming)
- [ ] Press kit enviado a 20 blogs de gaming indie
- [ ] Respuesta activa a reviews en stores (primeras 72hs críticas)
- [ ] Monitor de métricas: retention D1, D3, D7

**Entregable Fase 3:** Juego publicado en App Store y Google Play.

---

## FASE 4 — Crecimiento Continuo (Mes 4+)

**Objetivo:** Retención a largo plazo y crecimiento orgánico.

### Mes 4
- [ ] Sistema de temporadas (Season Pass cada 30 días)
- [ ] 10 skins nuevas (5 gratuitas vía gameplay, 5 de pago)
- [ ] Torneos semanales con leaderboard exclusivo y premios
- [ ] Notificaciones push mejoradas con personalización
- [ ] A/B testing de precios con RevenueCat

### Mes 5
- [ ] Sistema de clanes: crear, unirse, logo personalizado
- [ ] Retos de clan semanales
- [ ] Modo Creative 🎨 (diseñar y compartir patrones)
- [ ] Rating de patrones de la comunidad

### Mes 6+
- [ ] Expansión web (PWA con Next.js)
- [ ] Partnerships con creadores de contenido (código de afiliado)
- [ ] Localización: Portugués, Francés, Alemán, Japonés
- [ ] Widgets de iOS 17 (Daily Challenge en homescreen)
- [ ] Análisis de churn y campaña de re-engagement

---

## KPIs y Métricas de Éxito

### Adquisición
| Métrica | Mes 1 | Mes 3 | Mes 6 |
|---|---|---|---|
| Descargas totales | 2K | 15K | 50K |
| Organic vs Paid | 80/20 | 70/30 | 60/40 |
| Rating App Store | 4.0+ | 4.3+ | 4.5+ |

### Retención
| Métrica | Objetivo |
|---|---|
| Day-1 Retention | 40% |
| Day-7 Retention | 15% |
| Day-30 Retention | 8% |
| Sesiones por día | 2.5+ |
| Duración sesión | 6 min+ |

### Monetización
| Métrica | Mes 3 | Mes 6 |
|---|---|---|
| Conversión a pagador | 2% | 4% |
| ARPU pagador/mes | $6 | $10 |
| MRR | $1.8K | $8K+ |
| ARPDAU (free) | $0.02 | $0.04 |

---

## Dependencias Críticas

```
Fase 1 → Fase 2: El core loop DEBE ser divertido (validado por ≥5 testers)
Fase 2 → Fase 3: RevenueCat y AdMob DEBEN estar aprobados por Apple/Google
Fase 3 → Launch: App Review de Apple puede tomar 2–7 días hábiles
Fase 4: Sistema de clanes requiere WebSockets escalables (revisar plan Railway)
```

---

## Riesgos y Mitigaciones

| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| App Review rechazada | Media | Revisar guidelines antes de submit, usar TestFlight para feedback |
| Claude API latencia alta | Baja | Cache Redis + 50 patrones offline de fallback |
| RevenueCat integración compleja | Baja | SDK maduro, documentación clara, testear en sandbox |
| Retention baja D7 | Media | Onboarding A/B testing, push notifications personalizadas |
| Copias del concept | Alta | Velocidad de ejecución + branding fuerte desde el día 1 |
