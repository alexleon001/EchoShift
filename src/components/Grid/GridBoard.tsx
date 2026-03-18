import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { GridCell } from './GridCell';
import { useGameStore } from '@/store/gameStore';
import { COLORS } from '@/constants/theme';
import { triggerCorrect, triggerError, triggerCombo } from '@/utils/haptics';
import { playTone, playError, playSuccess, playComboBreak } from '@/utils/audio';

const GRID_PADDING = 16;
const CELL_GAP = 8;
const MAX_GRID_WIDTH = Platform.OS === 'web' ? 375 : 9999;

interface CellFlash {
  cellIndex: number;
  color: string;
}

export function GridBoard() {
  const { width: screenWidth } = useWindowDimensions();
  const {
    currentPattern,
    activeCell,
    phase,
    difficulty,
    nextExpectedCell,
    hintCells,
    freezeActive,
    slowCellsRemaining,
    shieldActive,
    setPhase,
    setActiveCell,
    handleCellTap,
    nextRound,
  } = useGameStore();

  const tapStartTime = useRef<number>(Date.now());
  const playbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [replicateFlash, setReplicateFlash] = useState<CellFlash | null>(null);
  // Flash the correct cell when user makes an error
  const [errorHintFlash, setErrorHintFlash] = useState<CellFlash | null>(null);

  const gridSize = difficulty.gridSize;
  const totalCells = gridSize * gridSize;
  const clampedWidth = Math.min(screenWidth, MAX_GRID_WIDTH);
  const availableWidth = clampedWidth - GRID_PADDING * 2;
  const cellSize = (availableWidth - CELL_GAP * gridSize) / gridSize;

  // Play back the pattern during 'observe' phase
  useEffect(() => {
    if (phase !== 'observe' || !currentPattern) return;

    const sequence = currentPattern.sequence;
    let stepIndex = 0;

    const playStep = () => {
      if (stepIndex >= sequence.length) {
        setActiveCell(null);
        // Near-instant transition to replicate
        playbackTimer.current = setTimeout(() => {
          setPhase('replicate');
          tapStartTime.current = Date.now();
          // Clear freeze flag if it was a freeze replay
          const gs = useGameStore.getState();
          if (gs.freezeActive) {
            // Restore the next expected cell to where the player left off
            const idx = gs._patternEngine.getPlayerInputIndex();
            const nextStep = gs.currentPattern?.sequence[idx];
            useGameStore.setState({ freezeActive: false, nextExpectedCell: nextStep?.cell ?? null });
          }
        }, 100);
        return;
      }

      const step = sequence[stepIndex];
      if (!step) return;
      setActiveCell(step.cell);
      playTone(step.color);

      // Slow power-up: increase display time by 1.4x for remaining cells
      const slowActive = useGameStore.getState().slowCellsRemaining > 0;
      const effectiveTime = slowActive ? Math.round(step.displayTime * 1.4) : step.displayTime;

      playbackTimer.current = setTimeout(() => {
        setActiveCell(null);
        playbackTimer.current = setTimeout(() => {
          stepIndex++;
          playStep();
        }, 60); // Minimal gap between cells for snappy feel
      }, effectiveTime);
    };

    playStep();

    return () => {
      if (playbackTimer.current) clearTimeout(playbackTimer.current);
    };
  }, [phase, currentPattern]);

  // Clear flashes on phase change
  useEffect(() => {
    if (phase !== 'replicate') {
      setReplicateFlash(null);
      setErrorHintFlash(null);
    }
  }, [phase]);

  const handlePress = useCallback(
    (cellIndex: number) => {
      if (phase !== 'replicate') return;

      const responseTime = Date.now() - tapStartTime.current;
      tapStartTime.current = Date.now();

      // Capture state BEFORE validation
      const inputIdx = useGameStore.getState()._patternEngine.getPlayerInputIndex();
      const expectedStep = currentPattern?.sequence[inputIdx];
      const prevMultiplier = useGameStore.getState().combo.multiplier;

      const result = handleCellTap(cellIndex, responseTime);

      if (result.correct) {
        const step = currentPattern?.sequence[result.cellIndex];
        const color = step?.color ?? COLORS.cyan;
        setReplicateFlash({ cellIndex, color });

        triggerCorrect();
        playTone(color);

        const combo = useGameStore.getState().combo;
        if (combo.isActive && combo.correctCount % 5 === 0) {
          triggerCombo();
        }
      } else {
        // Flash error on the wrong cell
        setReplicateFlash({ cellIndex, color: COLORS.magenta });
        triggerError();

        // Play combo break sound if multiplier was active, otherwise normal error
        if (prevMultiplier > 1) {
          playComboBreak();
        } else {
          playError();
        }

        // Show the CORRECT cell briefly so player knows where they should have tapped
        if (expectedStep) {
          setTimeout(() => {
            setErrorHintFlash({
              cellIndex: expectedStep.cell,
              color: expectedStep.color,
            });
            setTimeout(() => setErrorHintFlash(null), 500);
          }, 200);
        }
      }

      setTimeout(() => setReplicateFlash(null), 120);

      if (result.isComplete) {
        playSuccess();
        setTimeout(() => nextRound(), 300);
      }
    },
    [phase, handleCellTap, nextRound, currentPattern],
  );

  // Build the set of cells that are part of the current pattern (for ghost tint)
  const patternCellMap = new Map<number, string>();
  if (phase === 'replicate' && currentPattern) {
    for (const step of currentPattern.sequence) {
      if (!patternCellMap.has(step.cell)) {
        patternCellMap.set(step.cell, step.color);
      }
    }
  }

  // Show hints at difficulty <= 5
  const showHints = phase === 'replicate' && difficulty.difficulty <= 5;

  let hintCellIndex: number | null = null;
  let hintCellColor: string | null = null;
  if (showHints && nextExpectedCell != null && currentPattern) {
    hintCellIndex = nextExpectedCell;
    const idx = useGameStore.getState()._patternEngine.getPlayerInputIndex();
    const step = currentPattern.sequence[idx];
    hintCellColor = step?.color ?? null;
  }

  const cells = [];
  for (let i = 0; i < totalCells; i++) {
    let cellColor: string | null = null;
    let isActive = false;
    let isHint = false;
    let cellHintColor: string | null = null;
    // Ghost: subtle tint for cells that are part of the pattern
    const ghostColor = phase === 'replicate' ? (patternCellMap.get(i) ?? null) : null;

    if (phase === 'observe' && activeCell === i) {
      const step = currentPattern?.sequence.find((s) => s.cell === i);
      cellColor = step?.color ?? null;
      isActive = true;
    } else if (errorHintFlash?.cellIndex === i) {
      // Show the correct cell after an error
      cellColor = errorHintFlash.color;
      isActive = true;
    } else if (phase === 'replicate' && replicateFlash?.cellIndex === i) {
      cellColor = replicateFlash.color;
      isActive = true;
    } else if (hintCells.length > 0 && hintCells.includes(i)) {
      // Power-up hint: show highlighted cells from Hint power-up
      const step = currentPattern?.sequence.find((s) => s.cell === i);
      cellColor = step?.color ?? COLORS.cyan;
      isActive = true;
    } else if (showHints && hintCells.length === 0 && i === hintCellIndex && !replicateFlash && !errorHintFlash) {
      isHint = true;
      cellHintColor = hintCellColor;
    }

    cells.push(
      <GridCell
        key={i}
        index={i}
        color={cellColor}
        isActive={isActive}
        isHint={isHint}
        hintColor={cellHintColor}
        ghostColor={ghostColor}
        size={cellSize}
        onPress={handlePress}
        disabled={phase !== 'replicate'}
      />,
    );
  }

  const rows = [];
  for (let r = 0; r < gridSize; r++) {
    rows.push(
      <View key={r} style={styles.row}>
        {cells.slice(r * gridSize, (r + 1) * gridSize)}
      </View>,
    );
  }

  return <View style={styles.container}>{rows}</View>;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
  },
});
