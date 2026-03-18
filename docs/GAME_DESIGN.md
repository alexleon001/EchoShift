# 🌀 GAME_DESIGN.md — EchoShift
> Fuente de verdad del diseño del juego. Versión 1.0

---

## 1. Concepto Central

**EchoShift** es un juego de puzzles de patrones rítmicos para iOS y Android.
Una cuadrícula se ilumina en secuencia; el jugador debe replicar el patrón exacto
antes de que se complejice. Cada nivel es generado dinámicamente por Claude API,
garantizando infinita variedad y dificultad adaptativa.

**Tagline:** *"Infinito. Adictivo. Nunca el mismo dos veces."*

**Género:** Casual Puzzle + Memory + Ritmo  
**Target:** Todas las edades (7+). PEGI 3 / ESRB Everyone  
**Plataformas:** iOS 16+ / Android 8+  
**Orientación:** Portrait (vertical) únicamente  
**Sesión promedio objetivo:** 4–8 minutos  

---

## 2. Core Loop

```
1. OBSERVE  → La cuadrícula reproduce una secuencia de N celdas iluminadas
2. REPLICATE → El jugador toca las celdas en el mismo orden
3. VALIDATE  → El sistema verifica la respuesta en tiempo real
4. EVOLVE    → Si es correcto: +1 celda al patrón, velocidad aumenta levemente
5. SCORE     → Puntos = celdas × multiplicador de combo × bonus de velocidad
6. SHARE     → Al romper récord: pantalla de share nativa
```

Un **error** reduce el combo a x1 pero NO termina el nivel inmediatamente.
Tres errores consecutivos = fin del nivel con pantalla de resultados.

---

## 3. Mecánica de la Cuadrícula

- **Tamaño inicial:** 4×4 (16 celdas)
- **Evolución:** La cuadrícula crece a 5×5, 6×6 según nivel de habilidad
- **Colores activos:** 4 colores neón base: Cian `#00f5d4`, Magenta `#f72585`, Amarillo `#ffd166`, Violeta `#7b2fff`
- **Timing de display:** 800ms por celda al inicio, mínimo 200ms en niveles altos
- **Feedback táctil:** Haptic suave en celda correcta, haptic fuerte en error
- **Feedback sonoro:** Cada color tiene un tono musical único (Do, Re, Mi, Sol)

---

## 4. Sistema de Combo y Puntuación

| Celdas correctas consecutivas | Multiplicador |
|---|---|
| 1–4   | x1 |
| 5–9   | x2 |
| 10–14 | x3 |
| 15–19 | x5 |
| 20+   | x10 |

**Fórmula base:**
```
score = celdas_correctas × multiplicador × (1000 / tiempo_respuesta_ms)
```

**Bonus de racha:** cada 10 celdas perfectas sin error → +500 puntos fijos

---

## 5. Modos de Juego

### 5.1 Endless (principal)
- Sin límite de tiempo ni niveles
- El patrón crece indefinidamente
- Récord personal y global en tiempo real
- Disponible offline con patrones de fallback

### 5.2 Daily Challenge
- Un patrón único por día, igual para todos los jugadores del mundo
- Generado por Claude API a medianoche UTC
- 3 intentos máximo por día
- Leaderboard exclusivo del día
- Recompensa: 50 Echoes (moneda del juego)

### 5.3 Blitz ⚡
- 60 segundos exactos
- Patrones más cortos y rápidos
- Objetivo: máximos puntos en el tiempo
- Sin penalización por errores (solo pierdes combo)

### 5.4 Duo 🤝 *(Fase 3)*
- 2 jugadores en tiempo real vía WebSocket
- Misma cuadrícula, cada uno replica en su dispositivo
- Gana quien cometa menos errores en 10 rondas
- Modo invitación por link o código de sala

### 5.5 Creative 🎨 *(Fase 4)*
- El jugador diseña su propio patrón
- Lo comparte con código QR
- Otros jugadores pueden intentarlo
- Rating comunitario (⭐ 1–5)

---

## 6. Sistema de Poderes (Power-ups)

| Power | Efecto | Costo |
|---|---|---|
| ❄️ Freeze | Congela el timer 3 segundos | 20 Echoes |
| 👁️ Hint | Revela 2 celdas de la secuencia | 15 Echoes |
| ↩️ Undo | Deshace el último error | 10 Echoes |
| 🐢 Slow | Reduce velocidad a 0.7x por 5 celdas | 25 Echoes |
| 🛡️ Shield | Protege el combo de un error | 30 Echoes |

Los poderes se obtienen jugando (recompensas) o comprando Echoes.
Máximo 1 poder activo a la vez.

---

## 7. Progresión del Jugador

### Niveles de habilidad (internos, no mostrados al jugador)
```
Novice    → tiempo respuesta promedio > 900ms
Explorer  → 600–900ms
Master    → 350–600ms
Legend    → 200–350ms
Infinite  → < 200ms
```

### XP y Rangos visibles
```
Bronce  → 0–999 XP
Plata   → 1000–4999 XP
Oro     → 5000–14999 XP
Platino → 15000–39999 XP
Diamante → 40000+ XP
```

XP ganado: `15 × nivel_dificultad` por partida completada + bonus de racha

---

## 8. Universo Visual y Estética

- **Paleta:** Fondo negro profundo `#07080f`, acentos neón (cian, magenta, amarillo, violeta)
- **Estilo:** Retro-futurista oscuro. Inspiración: Tron + Monument Valley + Alto's Odyssey
- **Grid:** Celdas con bordes luminosos, glow al activarse, partículas al completar racha
- **Tipografía:** Monospace para scores/números, sans-serif geométrico para UI
- **Efectos:** Ondas de sonido visualizadas, scanlines sutiles en el fondo, bloom en celdas activas
- **Música:** Generativa, reacciona al combo del jugador. BPM aumenta con el multiplicador
- **Transiciones:** Morphing suave entre modos, no cortes abruptos

---

## 9. Rol de Claude API en el Juego

Claude API es el **motor generativo** del juego, no un feature opcional.

### Responsabilidades de Claude:
1. **Generar patrones de nivel** adaptados a la habilidad real del jugador
2. **Crear el Daily Challenge** diario (cron job a medianoche UTC)
3. **Validar jugabilidad** de cada patrón generado antes de enviarlo al cliente
4. **Evitar repetición** analizando el historial reciente del jugador
5. **Ajustar dificultad elástica** si el jugador está en racha o frustrándose

### Qué NO hace Claude:
- No valida las respuestas del jugador (eso es lógica local determinista)
- No maneja pagos ni IAP
- No procesa datos personales del jugador

---

## 10. Métricas de Éxito del Juego

| Métrica | Objetivo Mes 3 | Objetivo Mes 6 |
|---|---|---|
| Day-1 Retention | 40% | 35% |
| Day-7 Retention | 15% | 12% |
| Sesión promedio | 5 min | 7 min |
| Sesiones/día/usuario | 2.5 | 3.2 |
| Conversión a pagador | 2% | 4% |
| Rating App Store | 4.2+ | 4.5+ |
