export {
    ROW_COL_FLAT_RECT,
    VERTEX_STYLES,
    ROW_COL_GRID_STACKED,
    getBoardStyleEntry,
    getCompatibleStyles,
    isCrossGroupStyleChange,
    isInvalidStylePair,
    markerSupportedOnStyle,
} from "./registry.js";
export type { BoardStyleRegistryEntry, CompatibilityGroup } from "./registry.js";
export {
    isStringGridPieces,
    isBoardBasicBoard,
    isBoardChromeEligible,
    isBoardStyleCustomizationEligible,
    isBoardFieldChromeEligible,
} from "./piecesShape.js";
export { BOARD_CHROME_BOARD_KEYS, BOARD_CHROME_DENIED_KEYS } from "./allowlist.js";
export { applyBoardChrome } from "./merge.js";
export { sanitizeRenderRep, sanitizeRenderRepWithWarnings, filterBoardMarkers } from "./sanitize.js";
export { validateRenderCustomization } from "./validate.js";
export type { BoardChromeInput, SanitizeMode, SanitizeOptions, ValidateResult } from "./types.js";
