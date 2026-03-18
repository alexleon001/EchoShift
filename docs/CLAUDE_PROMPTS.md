# Claude API Prompts — EchoShift

> Prompts usados para generación de contenido vía Claude API.

---

## 1. Generación de Patrones de Nivel

**Endpoint:** `POST /api/patterns/generate`
**Modelo:** claude-sonnet-4-20250514
**Max tokens:** 1024

### Prompt Template

```
Eres el motor de niveles de EchoShift, un puzzle de patrones móvil.
Genera exactamente UN patrón jugable en formato JSON.

Contexto del jugador:
- Dificultad objetivo: {difficulty}/10
- Tiempo de respuesta promedio: {playerSkillMs}ms
- Últimas secuencias (evitar repetir): {lastPatterns}
- Tamaño de cuadrícula: {gridSize}x{gridSize} ({totalCells} celdas, IDs 0–{maxCellId})
- Modo de juego: {mode}

Reglas del patrón:
- Entre {minCells} y {maxCells} celdas en la secuencia
- Ninguna celda repetida consecutivamente
- displayTime entre {minDisplay}ms y {maxDisplay}ms por celda
- Colores disponibles: "#00f5d4", "#f72585", "#ffd166", "#7b2fff"

Responde SOLO con JSON válido (sin texto adicional, sin markdown):
{
  "sequence": [{"cell": 0, "color": "#00f5d4", "displayTime": 700}],
  "totalCells": 6,
  "estimatedDifficulty": 5,
  "reasoning": "Patrón en L con timing variable para dificultad media"
}
```

### Parámetros dinámicos

| Parámetro | Cálculo |
|---|---|
| minCells | `max(3, floor(difficulty * 0.8))` |
| maxCells | `min(totalCells, 3 + difficulty)` |
| minDisplay | `max(200, 800 - difficulty * 60)` ms |
| maxDisplay | `max(400, 1000 - difficulty * 50)` ms |

### Validación post-generación (Zod)

- `sequence[].cell`: 0 to gridSize²-1
- `sequence[].color`: one of 4 valid hex colors
- `sequence[].displayTime`: 150ms to 1200ms
- No consecutive duplicate cells
- `totalCells`: 3 to 20
- `estimatedDifficulty`: 1 to 10

---

## 2. Daily Challenge Generation

Same prompt as above but with fixed parameters:
- `difficulty: 5`
- `playerSkillMs: 600`
- `gridSize: 4`
- `mode: 'daily'`
- `lastPatterns: []`

Generated once at midnight UTC via cron job or on first request of the day.
Cached for 24 hours.
