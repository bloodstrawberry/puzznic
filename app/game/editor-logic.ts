"use client";

import { useState, useCallback, useRef } from "react";
import {
  BLOCK_EMPTY,
  BLOCK_WALL,
} from "../object/constants";

import {
  CellType,
  LevelData,
  copyGrid,
  realMap,
} from "./types";
import { playEngineSound } from "./sound";

/** Custom hook for all level-editor state and actions. */
export const useEditorEngine = (
  isEditorMode: boolean,
  grid: CellType[][],
  setGrid: React.Dispatch<React.SetStateAction<CellType[][]>>,
  setCursor: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>,
  setTimeLeft: React.Dispatch<React.SetStateAction<number>>,
  muted: boolean,
  updateBlockCounts: (board: CellType[][]) => Record<string, number>,
  setBlockCounts: React.Dispatch<React.SetStateAction<Record<string, number>>>,
  setGrabbed: React.Dispatch<React.SetStateAction<boolean>>,
  setIsGameOver: React.Dispatch<React.SetStateAction<boolean>>,
  setIsLevelCleared: React.Dispatch<React.SetStateAction<boolean>>,
  setIsProcessing: React.Dispatch<React.SetStateAction<boolean>>,
  setBullets: React.Dispatch<React.SetStateAction<{ id: string; startX: number; startY: number; targetX: number; targetY: number; dir: number }[]>>,
  setFlashingBlocks: React.Dispatch<React.SetStateAction<Record<string, boolean>>>,
  stateRef: React.MutableRefObject<{ flashingBlocks: Record<string, boolean> } | undefined>,
  setHasMovedFirstBlock: React.Dispatch<React.SetStateAction<boolean>>,
  updateGrabbed: (updater: boolean | ((prev: boolean) => boolean)) => void,
) => {
  // Editor level states
  const [editorLevels, setEditorLevels] = useState<LevelData[]>(() => {
    if (realMap.length === 0) {
      return [
        {
          name: "LEVEL 1-1",
          grid: Array.from({ length: 8 }, () => Array(8).fill(BLOCK_EMPTY)),
          timeLimit: 180,
        },
      ];
    }
    return realMap.map((lvl) => ({
      name: lvl.name,
      grid: copyGrid(lvl.grid as CellType[][]),
      timeLimit: lvl.timeLimit ?? 180,
    }));
  });
  const [editorActiveIndex, setEditorActiveIndex] = useState<number>(0);
  const [, setEditorHistory] = useState<CellType[][][]>([]);

  const editorPushHistory = useCallback((customGrid?: CellType[][]) => {
    const gridToSave = customGrid || grid;
    setEditorHistory((prev) => {
      const next = [...prev, copyGrid(gridToSave)];
      if (next.length > 50) {
        next.shift();
      }
      return next;
    });
  }, [grid]);

  const updateEditorLevelGrid = useCallback(
    (newGrid: CellType[][]) => {
      setEditorLevels((prev) => {
        const next = [...prev];
        if (next[editorActiveIndex]) {
          next[editorActiveIndex] = {
            ...next[editorActiveIndex],
            grid: copyGrid(newGrid),
          };
        }
        return next;
      });
    },
    [editorActiveIndex],
  );

  const selectEditorLevel = useCallback(
    (idx: number) => {
      if (idx < 0 || idx >= editorLevels.length) return;
      setEditorActiveIndex(idx);
      const lvl = editorLevels[idx];
      setGrid(copyGrid(lvl.grid));
      setTimeLeft(lvl.timeLimit);
      setCursor({
        x: Math.floor(lvl.grid[0].length / 2),
        y: lvl.grid.length - 1,
      });
      updateBlockCounts(lvl.grid);
      setEditorHistory([]);
    },
    [editorLevels, updateBlockCounts, setGrid, setTimeLeft, setCursor],
  );

  const editorAddLevel = useCallback(() => {
    if (!isEditorMode) return;
    const insertIdx = editorActiveIndex + 1;
    const currentRows = grid.length;
    const currentCols = grid[0]?.length || 8;
    setEditorLevels((prev) => {
      const next = [...prev];
      const newLvl: LevelData = {
        name: "",
        grid: Array.from({ length: currentRows }, () => Array(currentCols).fill(BLOCK_EMPTY)),
        timeLimit: 180,
      };
      next.splice(insertIdx, 0, newLvl);
      const reindexed = next.map((lvl, i) => ({
        ...lvl,
        name: `LEVEL 1-${i + 1}`,
      }));
      setTimeout(() => {
        setEditorActiveIndex(insertIdx);
        const lvl = reindexed[insertIdx];
        setGrid(copyGrid(lvl.grid));
        setTimeLeft(lvl.timeLimit);
        setCursor({
          x: Math.floor(lvl.grid[0].length / 2),
          y: lvl.grid.length - 1,
        });
        updateBlockCounts(lvl.grid);
      }, 0);
      return reindexed;
    });
    playEngineSound("start", muted);
  }, [isEditorMode, muted, editorActiveIndex, updateBlockCounts, grid, setGrid, setTimeLeft, setCursor]);

  const editorDeleteLevel = useCallback(() => {
    if (!isEditorMode || editorLevels.length <= 1) return;
    setEditorLevels((prev) => {
      const next = prev.filter((_, i) => i !== editorActiveIndex);
      const reindexed = next.map((lvl, i) => ({
        ...lvl,
        name: `LEVEL 1-${i + 1}`,
      }));
      const nextIdx = Math.max(0, Math.min(reindexed.length - 1, editorActiveIndex));
      setTimeout(() => {
        setEditorActiveIndex(nextIdx);
        const lvl = reindexed[nextIdx];
        setGrid(copyGrid(lvl.grid));
        setTimeLeft(lvl.timeLimit);
        setCursor({
          x: Math.floor(lvl.grid[0].length / 2),
          y: lvl.grid.length - 1,
        });
        updateBlockCounts(lvl.grid);
      }, 0);
      return reindexed;
    });
    playEngineSound("error", muted);
  }, [isEditorMode, editorLevels.length, editorActiveIndex, muted, updateBlockCounts, setGrid, setTimeLeft, setCursor]);

  const editorUpdateTimeLimit = useCallback(
    (limit: number) => {
      if (!isEditorMode) return;
      const cleanLimit = Math.max(1, limit);
      setTimeLeft(cleanLimit);
      setEditorLevels((prev) => {
        const next = [...prev];
        if (next[editorActiveIndex]) {
          next[editorActiveIndex] = {
            ...next[editorActiveIndex],
            timeLimit: cleanLimit,
          };
        }
        return next;
      });
    },
    [isEditorMode, editorActiveIndex, setTimeLeft],
  );

  const editorUndo = useCallback(() => {
    if (!isEditorMode) return;
    let reverted = false;
    setEditorHistory((prev) => {
      if (prev.length === 0) {
        return prev;
      }
      const next = [...prev];
      const prevGrid = next.pop()!;
      
      setGrid(copyGrid(prevGrid));
      updateBlockCounts(prevGrid);
      updateEditorLevelGrid(prevGrid);
      reverted = true;
      
      return next;
    });
    if (reverted) {
      playEngineSound("select", muted);
    } else {
      playEngineSound("error", muted);
    }
  }, [isEditorMode, muted, updateBlockCounts, updateEditorLevelGrid, setGrid]);

  const editorImportJSON = useCallback((jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed)) {
        const valid = parsed.every((lvl) => lvl && Array.isArray(lvl.grid));
        if (valid) {
          const cleaned = parsed.map((lvl, i) => ({
            name: lvl.name || `LEVEL 1-${i + 1}`,
            grid: copyGrid(lvl.grid as CellType[][]),
            timeLimit: lvl.timeLimit ?? 180,
          }));
          setEditorLevels(cleaned);
          setEditorActiveIndex(0);
          setGrid(copyGrid(cleaned[0].grid));
          setTimeLeft(cleaned[0].timeLimit);
          setCursor({
            x: Math.floor(cleaned[0].grid[0].length / 2),
            y: cleaned[0].grid.length - 1,
          });
          updateBlockCounts(cleaned[0].grid);
          setEditorHistory([]);
          return true;
        }
      } else if (parsed && Array.isArray(parsed.grid)) {
        const cleaned: LevelData = {
          name: parsed.name || "CUSTOM LEVEL",
          grid: copyGrid(parsed.grid as CellType[][]),
          timeLimit: parsed.timeLimit ?? 180,
        };
        setEditorLevels([cleaned]);
        setEditorActiveIndex(0);
        setGrid(copyGrid(cleaned.grid));
        setTimeLeft(cleaned.timeLimit);
        setCursor({
          x: Math.floor(cleaned.grid.length > 0 ? cleaned.grid[0].length / 2 : 4),
          y: cleaned.grid.length > 0 ? cleaned.grid.length - 1 : 7,
        });
        updateBlockCounts(cleaned.grid);
        setEditorHistory([]);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [updateBlockCounts, setGrid, setTimeLeft, setCursor]);

  const editorRestoreLevel = useCallback(() => {
    const activeLvl = editorLevels[editorActiveIndex];
    if (activeLvl) {
      setGrid(copyGrid(activeLvl.grid));
      updateBlockCounts(activeLvl.grid);
      setTimeLeft(activeLvl.timeLimit);
    }
    setIsGameOver(false);
    setIsLevelCleared(false);
    setIsProcessing(false);
    setBullets([]);
    setFlashingBlocks({});
    if (stateRef.current) stateRef.current.flashingBlocks = {};
    setHasMovedFirstBlock(false);
    updateGrabbed(false);
  }, [editorActiveIndex, editorLevels, updateBlockCounts, updateGrabbed, setGrid, setTimeLeft, setIsGameOver, setIsLevelCleared, setIsProcessing, setBullets, setFlashingBlocks, stateRef, setHasMovedFirstBlock]);

  const editorPlaceBlock = useCallback(
    (x: number, y: number, blockType: CellType) => {
      if (!isEditorMode) return;
      if (grid[y]?.[x] === blockType) return;
      const nextGrid = grid.map((row) => [...row]);
      nextGrid[y][x] = blockType;
      setGrid(nextGrid);
      updateBlockCounts(nextGrid);
      updateEditorLevelGrid(nextGrid);
      playEngineSound("select", muted);
    },
    [grid, isEditorMode, updateBlockCounts, updateEditorLevelGrid, muted, setGrid],
  );

  const editorClearGrid = useCallback(() => {
    if (!isEditorMode) return;
    setGrabbed(false);
    editorPushHistory(grid);
    const currentRows = grid.length;
    const currentCols = grid[0]?.length || 8;
    const newGrid = Array.from({ length: currentRows }, () => Array(currentCols).fill(BLOCK_EMPTY));
    setGrid(newGrid);
    setBlockCounts({});
    updateEditorLevelGrid(newGrid);
    playEngineSound("error", muted);
  }, [isEditorMode, muted, setBlockCounts, setGrabbed, updateEditorLevelGrid, grid, editorPushHistory, setGrid]);

  const editorFillBorder = useCallback(() => {
    if (!isEditorMode) return;
    setGrabbed(false);
    editorPushHistory(grid);
    setGrid((prevGrid) => {
      const rows = prevGrid.length;
      const cols = prevGrid[0]?.length || 0;
      if (rows === 0 || cols === 0) return prevGrid;

      const nextGrid = prevGrid.map((row, y) =>
        row.map((cell, x) => {
          if (y === 0 || y === rows - 1 || x === 0 || x === cols - 1) {
            return BLOCK_WALL;
          }
          return cell;
        })
      );

      updateBlockCounts(nextGrid);
      updateEditorLevelGrid(nextGrid);
      return nextGrid;
    });
    playEngineSound("select", muted);
  }, [isEditorMode, muted, updateBlockCounts, updateEditorLevelGrid, setGrabbed, grid, editorPushHistory, setGrid]);

  const editorResizeGrid = useCallback(
    (newRows: number, newCols: number) => {
      if (!isEditorMode) return;
      editorPushHistory(grid);
      const rows = Math.max(4, Math.min(12, newRows));
      const cols = Math.max(4, Math.min(16, newCols));

      setGrid((prevGrid) => {
        const currentRows = prevGrid.length;
        const currentCols = prevGrid[0]?.length || 0;

        let nextGrid = prevGrid.map((row) => [...row]);

        // Resize rows
        if (rows > currentRows) {
          for (let i = currentRows; i < rows; i++) {
            nextGrid.push(Array(currentCols).fill(BLOCK_EMPTY));
          }
        } else if (rows < currentRows) {
          nextGrid = nextGrid.slice(0, rows);
        }

        // Resize columns
        nextGrid = nextGrid.map((row) => {
          if (cols > currentCols) {
            return [...row, ...Array(cols - currentCols).fill(BLOCK_EMPTY)];
          } else {
            return row.slice(0, cols);
          }
        });

        // Clamp cursor position
        setCursor((prev) => ({
          x: Math.max(0, Math.min(cols - 1, prev.x)),
          y: Math.max(0, Math.min(rows - 1, prev.y)),
        }));

        updateBlockCounts(nextGrid);
        updateEditorLevelGrid(nextGrid);
        return nextGrid;
      });
    },
    [isEditorMode, updateBlockCounts, updateEditorLevelGrid, grid, editorPushHistory, setGrid, setCursor],
  );

  const editorDeleteRow = useCallback(
    (y: number) => {
      if (!isEditorMode) return;

      const targetRow = grid[y];
      if (!targetRow) return;

      const isRowEmpty = targetRow.every((cell) => cell === BLOCK_EMPTY);

      editorPushHistory(grid);

      if (!isRowEmpty) {
        // Not empty: make the whole row empty
        const nextGrid = grid.map((row, idx) =>
          idx === y ? row.map(() => BLOCK_EMPTY) : [...row]
        );
        setGrid(nextGrid);
        updateBlockCounts(nextGrid);
        updateEditorLevelGrid(nextGrid);
        playEngineSound("select", muted);
      } else {
        // Already empty: remove the row itself
        if (grid.length <= 4) {
          playEngineSound("error", muted);
          return;
        }
        const nextGrid = grid.filter((_, idx) => idx !== y);
        setGrid(nextGrid);

        // Adjust cursor
        setCursor((prev) => ({
          x: prev.x,
          y: Math.max(0, Math.min(nextGrid.length - 1, prev.y)),
        }));

        updateBlockCounts(nextGrid);
        updateEditorLevelGrid(nextGrid);
        playEngineSound("break", muted);
      }
    },
    [isEditorMode, grid, muted, setGrid, setCursor, updateBlockCounts, updateEditorLevelGrid, editorPushHistory]
  );

  const editorDeleteCol = useCallback(
    (x: number) => {
      if (!isEditorMode) return;

      const isColEmpty = grid.every((row) => row[x] === BLOCK_EMPTY);

      editorPushHistory(grid);

      if (!isColEmpty) {
        // Not empty: make the whole column empty
        const nextGrid = grid.map((row) =>
          row.map((cell, idx) => (idx === x ? BLOCK_EMPTY : cell))
        );
        setGrid(nextGrid);
        updateBlockCounts(nextGrid);
        updateEditorLevelGrid(nextGrid);
        playEngineSound("select", muted);
      } else {
        // Already empty: remove the column itself
        const currentCols = grid[0]?.length || 0;
        if (currentCols <= 4) {
          playEngineSound("error", muted);
          return;
        }
        const nextGrid = grid.map((row) => row.filter((_, idx) => idx !== x));
        setGrid(nextGrid);

        // Adjust cursor
        setCursor((prev) => ({
          x: Math.max(0, Math.min(nextGrid[0].length - 1, prev.x)),
          y: prev.y,
        }));

        updateBlockCounts(nextGrid);
        updateEditorLevelGrid(nextGrid);
        playEngineSound("break", muted);
      }
    },
    [isEditorMode, grid, muted, setGrid, setCursor, updateBlockCounts, updateEditorLevelGrid, editorPushHistory]
  );

  return {
    editorLevels,
    setEditorLevels,
    editorActiveIndex,
    setEditorActiveIndex,
    selectEditorLevel,
    editorAddLevel,
    editorDeleteLevel,
    editorUpdateTimeLimit,
    editorUndo,
    editorImportJSON,
    editorRestoreLevel,
    editorPlaceBlock,
    editorClearGrid,
    editorFillBorder,
    editorResizeGrid,
    editorPushHistory,
    editorDeleteRow,
    editorDeleteCol,
  };
};
