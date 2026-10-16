import { createContext, useContext, type CSSProperties, type ReactNode } from 'react';

/** The quiz layout around a question (REDESIGN.md, 7.3). */
export interface Stage {
  /** The two-pane stage, from 1000 px: the visual in the left pane, words and answers in the right column. */
  wide: boolean;
  /** Room for the visual pane in px: its width, and the window height below the progress row. 0 when stacked. */
  width: number;
  height: number;
}

export const StageContext = createContext<Stage>({ wide: false, width: 0, height: 0 });

export const useStage = () => useContext(StageContext);

/** The widest the stage draws a fretboard (XL), and its height per unit of width. */
export const STAGE_NECK_MAX = 1160;
const BOARD_RATIO = { interactive: 224 / 560, plain: 174 / 560 };
// The paper around VexFlow output: padding and border.
const PAPER = 18;

interface NotationSize {
  /** The size the notation is drawn at, in px. */
  width: number;
  height: number;
  /** The widest it may grow, in px. */
  max: number;
  /** Share of the pane width it may take. */
  share?: number;
  /** A fretboard shown, now or after answering, under it in the same pane; room is kept for it. */
  board?: 'interactive' | 'plain';
}

/**
 * Draws VexFlow notation larger in the stage's visual pane: up to `share` of the pane's width and `max` px,
 * keeping room for a fretboard under it and never smaller than drawn. The size does not change when the
 * round is answered, so nothing jumps. When the quiz is stacked it renders the notation as is.
 */
export function StageNotation({ children, width, height, max, share = 0.7, board }: NotationSize & { children: ReactNode }) {
  const stage = useStage();
  if (!stage.wide || !stage.width) return <>{children}</>;
  const boardHeight = board ? Math.min(stage.width, STAGE_NECK_MAX) * BOARD_RATIO[board] + 24 : 0;
  const byHeight = (stage.height - boardHeight - PAPER) * (width / height);
  const scaled = Math.max(width, Math.min(max, stage.width * share, byHeight));
  return (
    <div className="stage-notation" style={{ '--notation-w': `${Math.round(scaled)}px` } as CSSProperties}>
      {children}
    </div>
  );
}

/** Holds the place of a fretboard that appears under the visual once the round is answered, so nothing moves then. */
export function BoardSlot() {
  return <div className="board-slot" aria-hidden="true" />;
}
