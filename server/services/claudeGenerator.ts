import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

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

export type GeneratedPattern = z.infer<typeof PatternSchema>;

interface GenerateParams {
  difficulty: number;
  playerSkillMs: number;
  lastPatterns: number[][];
  gridSize: 4 | 5 | 6;
  mode: 'endless' | 'blitz' | 'daily';
}

/**
 * Calls Claude API to generate a game pattern.
 * The prompt is carefully crafted to produce valid, playable patterns.
 */
export async function generatePattern(params: GenerateParams): Promise<GeneratedPattern> {
  const { difficulty, playerSkillMs, lastPatterns, gridSize, mode } = params;
  const totalCells = gridSize * gridSize;

  // Scale sequence length and timing with difficulty
  const minCells = Math.max(3, Math.floor(difficulty * 0.8));
  const maxCells = Math.min(totalCells, 3 + difficulty);
  const minDisplay = Math.max(200, 800 - difficulty * 60);
  const maxDisplay = Math.max(400, 1000 - difficulty * 50);

  const prompt = `Eres el motor de niveles de EchoShift, un puzzle de patrones móvil.
Genera exactamente UN patrón jugable en formato JSON.

Contexto del jugador:
- Dificultad objetivo: ${difficulty}/10
- Tiempo de respuesta promedio: ${playerSkillMs}ms
- Últimas secuencias (evitar repetir): ${JSON.stringify(lastPatterns)}
- Tamaño de cuadrícula: ${gridSize}x${gridSize} (${totalCells} celdas, IDs 0–${totalCells - 1})
- Modo de juego: ${mode}

Reglas del patrón:
- Entre ${minCells} y ${maxCells} celdas en la secuencia
- Ninguna celda repetida consecutivamente
- displayTime entre ${minDisplay}ms y ${maxDisplay}ms por celda
- Colores disponibles: "#00f5d4", "#f72585", "#ffd166", "#7b2fff"

Responde SOLO con este JSON (sin texto adicional, sin markdown):
{
  "sequence": [
    {"cell": 0, "color": "#00f5d4", "displayTime": 700}
  ],
  "totalCells": 6,
  "estimatedDifficulty": 5,
  "reasoning": "Patrón en L con timing variable para dificultad media"
}`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const textBlock = message.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from Claude');
  }

  const parsed = JSON.parse(textBlock.text);
  const validated = PatternSchema.parse(parsed);

  // Extra validation: no consecutive duplicate cells
  for (let i = 1; i < validated.sequence.length; i++) {
    if (validated.sequence[i]!.cell === validated.sequence[i - 1]!.cell) {
      throw new Error('Pattern has consecutive duplicate cells');
    }
  }

  return validated;
}
