"use client";

import { useEffect, useRef } from "react";
import {
  BLOCK_WALL,
  PUZZLE_BLOCK_TYPES,
  BLOCK_BOMB,
  BLOCK_WALL_V,
  BLOCK_WALL_H,
  BLOCK_AUTO_WALL_V,
  BLOCK_AUTO_WALL_H,
  BLOCK_SHOOTER_L,
  BLOCK_SHOOTER_R,
  BLOCK_SHOOTER_L_ONCE,
  BLOCK_SHOOTER_R_ONCE,
  BLOCK_SPIKE_U,
  BLOCK_SPIKE_D,
  BLOCK_SPIKE_L,
  BLOCK_SPIKE_R,
  type BlockId,
} from "../object";

export type CellType = BlockId;

export interface KeyCombo {
  key: string;      // e.g., 'ArrowLeft', 'z', 'b', 'c', 'e', '1', 'Tab'
  ctrl?: boolean;   // true if Ctrl key is required
  shift?: boolean;  // true if Shift key is required
  alt?: boolean;    // true if Alt key is required
}

export interface HotkeyConfig {
  prevStage: KeyCombo;
  nextStage: KeyCombo;
  addStage: KeyCombo;         // 'N'
  undo: KeyCombo;
  borderWall: KeyCombo;
  clearGrid: KeyCombo;
  exportJson: KeyCombo;
  selectBrick: KeyCombo;      // '1'
  selectBlock2: KeyCombo;     // '2'
  selectBlock3: KeyCombo;     // '3'
  selectBlock4: KeyCombo;     // '4'
  selectBlock5: KeyCombo;     // '5'
  selectBlock6: KeyCombo;     // '6'
  selectBlock7: KeyCombo;     // '7'
  selectBlock8: KeyCombo;     // '8'
  selectBlock9: KeyCombo;     // '9'
  selectNextBlock: KeyCombo;  // 'Tab'
  selectPrevBlock: KeyCombo;  // 'Shift + Tab'
}

// Default Hotkey Mappings - Edit this object to change default keyboard shortcuts
export const DEFAULT_HOTKEYS: HotkeyConfig = {
  prevStage: { key: "ArrowLeft", shift: true },
  nextStage: { key: "ArrowRight", shift: true },
  addStage: { key: "n" },
  undo: { key: "z", ctrl: true },
  borderWall: { key: "b" },
  clearGrid: { key: "c" },
  exportJson: { key: "e", ctrl: true },
  selectBrick: { key: "1" },
  selectBlock2: { key: "2" },
  selectBlock3: { key: "3" },
  selectBlock4: { key: "4" },
  selectBlock5: { key: "5" },
  selectBlock6: { key: "6" },
  selectBlock7: { key: "7" },
  selectBlock8: { key: "8" },
  selectBlock9: { key: "9" },
  selectNextBlock: { key: "Tab" },
  selectPrevBlock: { key: "Tab", shift: true },
};

// All paint tools in sequence for selection cycling (Tab/Shift+Tab)
export const ALL_PAINT_TOOLS: (CellType | "eraser")[] = [
  "eraser",
  BLOCK_WALL,
  ...PUZZLE_BLOCK_TYPES,
  BLOCK_BOMB,
  BLOCK_WALL_V,
  BLOCK_WALL_H,
  BLOCK_AUTO_WALL_V,
  BLOCK_AUTO_WALL_H,
  BLOCK_SHOOTER_L,
  BLOCK_SHOOTER_R,
  BLOCK_SHOOTER_L_ONCE,
  BLOCK_SHOOTER_R_ONCE,
  BLOCK_SPIKE_U,
  BLOCK_SPIKE_D,
  BLOCK_SPIKE_L,
  BLOCK_SPIKE_R,
];

interface UseEditorHotkeysProps {
  active: boolean;
  handlers: {
    onPrevStage: () => void;
    onNextStage: () => void;
    onUndo: () => void;
    onBorderWall: () => void;
    onClearGrid: () => void;
    onExportJson: () => void;
    onSelectBlock: (index: number) => void;
    onSelectNextBlock: () => void;
    onSelectPrevBlock: () => void;
    onAddStage: () => void;
  };
  config?: HotkeyConfig;
}

export function useEditorHotkeys({
  active,
  handlers,
  config = DEFAULT_HOTKEYS,
}: UseEditorHotkeysProps) {
  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    if (!active) return;

    const matchesCombo = (e: KeyboardEvent, combo: KeyCombo) => {
      // Compare keys case-insensitively for alphabet letters
      const isLetter = combo.key.length === 1 && combo.key.match(/[a-z]/i);
      const keyMatch = isLetter
        ? e.key.toLowerCase() === combo.key.toLowerCase()
        : e.key === combo.key;

      const ctrlMatch = !!combo.ctrl === (e.ctrlKey || e.metaKey);
      const shiftMatch = !!combo.shift === e.shiftKey;
      const altMatch = !!combo.alt === e.altKey;

      return keyMatch && ctrlMatch && shiftMatch && altMatch;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent shortcut triggers when typing inside input/textarea fields
      const activeEl = document.activeElement as HTMLElement | null;
      if (
        activeEl &&
        (activeEl.tagName === "INPUT" ||
          activeEl.tagName === "TEXTAREA" ||
          activeEl.isContentEditable)
      ) {
        return;
      }

      const curHandlers = handlersRef.current;

      if (matchesCombo(e, config.prevStage)) {
        e.preventDefault();
        curHandlers.onPrevStage();
      } else if (matchesCombo(e, config.nextStage)) {
        e.preventDefault();
        curHandlers.onNextStage();
      } else if (matchesCombo(e, config.addStage)) {
        e.preventDefault();
        curHandlers.onAddStage();
      } else if (matchesCombo(e, config.undo)) {
        e.preventDefault();
        curHandlers.onUndo();
      } else if (matchesCombo(e, config.borderWall)) {
        e.preventDefault();
        curHandlers.onBorderWall();
      } else if (matchesCombo(e, config.clearGrid)) {
        e.preventDefault();
        curHandlers.onClearGrid();
      } else if (matchesCombo(e, config.exportJson)) {
        e.preventDefault();
        curHandlers.onExportJson();
      } else if (matchesCombo(e, config.selectBrick)) {
        e.preventDefault();
        curHandlers.onSelectBlock(1);
      } else if (matchesCombo(e, config.selectBlock2)) {
        e.preventDefault();
        curHandlers.onSelectBlock(2);
      } else if (matchesCombo(e, config.selectBlock3)) {
        e.preventDefault();
        curHandlers.onSelectBlock(3);
      } else if (matchesCombo(e, config.selectBlock4)) {
        e.preventDefault();
        curHandlers.onSelectBlock(4);
      } else if (matchesCombo(e, config.selectBlock5)) {
        e.preventDefault();
        curHandlers.onSelectBlock(5);
      } else if (matchesCombo(e, config.selectBlock6)) {
        e.preventDefault();
        curHandlers.onSelectBlock(6);
      } else if (matchesCombo(e, config.selectBlock7)) {
        e.preventDefault();
        curHandlers.onSelectBlock(7);
      } else if (matchesCombo(e, config.selectBlock8)) {
        e.preventDefault();
        curHandlers.onSelectBlock(8);
      } else if (matchesCombo(e, config.selectBlock9)) {
        e.preventDefault();
        curHandlers.onSelectBlock(9);
      } else if (matchesCombo(e, config.selectPrevBlock)) {
        // Must check Shift+Tab combo before Tab combo
        e.preventDefault();
        curHandlers.onSelectPrevBlock();
      } else if (matchesCombo(e, config.selectNextBlock)) {
        e.preventDefault();
        curHandlers.onSelectNextBlock();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [active, config]);
}
