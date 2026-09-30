/** Pack stack column indices into rows (one index per stack column). */
export const buildLocalStashRows = (stackCount: number, maxStacksPerRow: number): number[][] => {
    if (stackCount <= 0 || maxStacksPerRow <= 0) {
        return [];
    }
    const rows: number[][] = [];
    for (let i = 0; i < stackCount; i += maxStacksPerRow) {
        const row: number[] = [];
        for (let j = i; j < Math.min(i + maxStacksPerRow, stackCount); j++) {
            row.push(j);
        }
        rows.push(row);
    }
    return rows;
};

/** Layers above the bottom piece in a pyramid stack (includes `-` placeholders). */
export const localStashStackLayersAboveBottom = (stack: string[]): number => {
    return Math.max(stack.length - 1, 0);
};
