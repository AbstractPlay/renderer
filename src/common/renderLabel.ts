import type { RenderLabel } from "../schemas/schema";

/** Coerce a render label to plain text for SVG drawing (front resolves structured labels first). */
export function labelDisplayText(label: RenderLabel): string {
    if (typeof label === "string") {
        return label;
    }
    return label.textKey;
}
