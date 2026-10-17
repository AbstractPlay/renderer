import type { APRenderCompositeLayout, APRenderCompositePanel } from "../schemas/composite.js";

export const COMPOSITE_CELL_PX = 50;

export const COMPOSITE_LABEL_FONT_SIZE = 14;

export type PanelBBox = {
    x: number;
    y: number;
    width: number;
    height: number;
};

export type PanelPlacement = {
    panel: APRenderCompositePanel;
    bbox: PanelBBox;
    labelBand: number;
    /** Top-left of the reserved cell (title band + board footprint). */
    cellX: number;
    cellY: number;
    cellWidth: number;
    cellHeight: number;
    /** Where the panel bbox top-left should land in composite coordinates. */
    boardX: number;
    boardTop: number;
};

const alignOffset = (align: "start" | "center" | "end", item: number, span: number): number => {
    if (align === "start") {
        return 0;
    }
    if (align === "end") {
        return span - item;
    }
    return (span - item) / 2;
};

const cellContentHeight = (labelBand: number, boardHeight: number): number => {
    return labelBand + boardHeight;
};

export const gapPixels = (layout: APRenderCompositeLayout): number => {
    const units = layout.gap ?? 1;
    return units * COMPOSITE_CELL_PX;
};

type PanelInput = { panel: APRenderCompositePanel; bbox: PanelBBox; labelBand: number };

/**
 * Assign each panel a fixed cell and board anchor in composite coordinates.
 * Grid (and row) layouts normalize per-row board height and per-column board width
 * so equal-sized boards share the same cell geometry and align.
 */
export const layoutCompositePanels = (
    panels: PanelInput[],
    layout: APRenderCompositeLayout,
    gapPx: number,
): PanelPlacement[] => {
    const align = layout.align ?? "center";

    if (layout.arrangement === "row") {
        const rowBoardH = Math.max(...panels.map((p) => p.bbox.height));
        let cellX = 0;
        return panels.map(({ panel, bbox, labelBand }) => {
            const cellWidth = bbox.width;
            const cellHeight = cellContentHeight(labelBand, rowBoardH);
            const placement: PanelPlacement = {
                panel,
                bbox,
                labelBand,
                cellX,
                cellY: 0,
                cellWidth,
                cellHeight,
                boardX: cellX,
                boardTop: labelBand,
            };
            cellX += cellWidth + gapPx;
            return placement;
        });
    }

    if (layout.arrangement === "column") {
        const colBoardW = Math.max(...panels.map((p) => p.bbox.width));
        let cellY = 0;
        return panels.map(({ panel, bbox, labelBand }) => {
            const cellWidth = colBoardW;
            const cellHeight = cellContentHeight(labelBand, bbox.height);
            const boardX = alignOffset(align, bbox.width, cellWidth);
            const placement: PanelPlacement = {
                panel,
                bbox,
                labelBand,
                cellX: 0,
                cellY,
                cellWidth,
                cellHeight,
                boardX,
                boardTop: cellY + labelBand,
            };
            cellY += cellHeight + gapPx;
            return placement;
        });
    }

    const columns = layout.columns ?? 1;
    const rows: PanelInput[][] = [];
    for (let i = 0; i < panels.length; i += columns) {
        rows.push(panels.slice(i, i + columns));
    }

    const colBoardW: number[] = [];
    for (let c = 0; c < columns; c++) {
        let maxW = 0;
        for (const row of rows) {
            const cell = row[c];
            if (cell !== undefined) {
                maxW = Math.max(maxW, cell.bbox.width);
            }
        }
        colBoardW.push(maxW);
    }

    const rowBoardH = rows.map((row) => Math.max(...row.map((p) => p.bbox.height)));

    const placements: PanelPlacement[] = [];
    let cellY = 0;
    for (let r = 0; r < rows.length; r++) {
        const row = rows[r]!;
        const boardH = rowBoardH[r]!;
        const rowCellH = Math.max(
            ...row.map((p) => cellContentHeight(p.labelBand, boardH)),
        );
        let cellX = 0;
        for (let c = 0; c < columns; c++) {
            const cell = row[c];
            const cellWidth = colBoardW[c] ?? 0;
            if (cell === undefined) {
                cellX += cellWidth + gapPx;
                continue;
            }
            const { panel, bbox, labelBand } = cell;
            const boardX = cellX + alignOffset(align, bbox.width, cellWidth);
            const boardTop = cellY + labelBand;
            placements.push({
                panel,
                bbox,
                labelBand,
                cellX,
                cellY,
                cellWidth,
                cellHeight: rowCellH,
                boardX,
                boardTop,
            });
            cellX += cellWidth + gapPx;
        }
        cellY += rowCellH + gapPx;
    }
    return placements;
};

export const compositeExtent = (placements: PanelPlacement[]): { width: number; height: number } => {
    let maxX = 0;
    let maxY = 0;
    for (const p of placements) {
        maxX = Math.max(maxX, p.cellX + p.cellWidth);
        maxY = Math.max(maxY, p.cellY + p.cellHeight);
    }
    return { width: maxX, height: maxY };
};
