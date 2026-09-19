import type { BoardBasic } from "../schemas/schema.js";

/** Partial board override from user customization (`render.board` + optional `options`). */
export type BoardChromeInput = Partial<BoardBasic> & {
    options?: string[];
};

export type SanitizeMode = "live" | "strict";

export interface SanitizeOptions {
    mode: SanitizeMode;
}

export interface ValidateResult {
    ok: boolean;
    errors: string[];
    warnings: string[];
    sanitized: import("../schemas/schema.js").APRenderRep | null;
}
