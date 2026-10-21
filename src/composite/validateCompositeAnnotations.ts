import type { APRenderComposite } from "../schemas/composite.js";

export const validateCompositeAnnotationTargets = (json: APRenderComposite): void => {
    const panelIds = new Set(json.panels.map((p) => p.id));
    const annotations = json.annotations;
    if (annotations === undefined || annotations.length === 0) {
        return;
    }

    for (const note of annotations) {
        if (note.type === "move" || note.type === "line") {
            if (note.targets.length < 2) {
                throw new Error(`Composite ${note.type} annotation requires at least two targets.`);
            }
        }
        if (note.type === "outline" && note.targets.length < 3) {
            throw new Error("Composite outline annotation requires at least three targets.");
        }

        for (const target of note.targets) {
            if (!panelIds.has(target.panel)) {
                throw new Error(`Composite annotation references unknown panel "${target.panel}".`);
            }
            const panel = json.panels.find((p) => p.id === target.panel)!;
            const board = panel.render.board;
            if (
                board === null
                || board === undefined
                || !("width" in board)
                || !("height" in board)
            ) {
                throw new Error(
                    `Composite annotation target on panel "${target.panel}" requires a board with width and height.`,
                );
            }
            const width = Number(board.width);
            const height = Number(board.height);
            if (target.row < 0 || target.row >= height || target.col < 0 || target.col >= width) {
                throw new Error(
                    `Composite annotation target (${target.panel} row ${target.row}, col ${target.col}) is out of bounds.`,
                );
            }
        }
    }
};
