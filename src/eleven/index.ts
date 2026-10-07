/**
 * Eleven board graph helpers for gameslib and other consumers.
 *
 * @example
 * ```ts
 * import {
 *   ELEVEN_GRAPH,
 *   ELEVEN_BOARD_TOPOLOGY,
 *   elevenPitchId,
 *   parsePitchId,
 * } from "@abstractplay/renderer/eleven";
 * ```
 *
 * @packageDocumentation
 */

export {
    ELEVEN_BOARD_TOPOLOGY,
    ELEVEN_COLUMN_SLICES,
    ELEVEN_GRAPH,
    ELEVEN_RESERVED_PITCH_CENTER,
    ELEVEN_RESERVED_PITCH_EAST_GOAL,
    ELEVEN_RESERVED_PITCH_WEST_GOAL,
    buildElevenGraphHelpers,
    buildElevenPitchIds,
    classifyElevenSpaces,
    elevenIndexFromPitchId,
    elevenPitchId,
    findElevenReservedSpaces,
    formatPitchId,
    grassColumnFromX,
    parsePitchId,
    renderElevenTopologyDebugSvg,
    reservedPitchId,
    sideBandFromGrassColumn,
    elevenMarkerTarget,
    elevenResolveCell,
} from "../common/eleven/index.js";

export type {
    ElevenBand,
    ElevenDebugLabelMode,
    ElevenGraphHelpers,
    ElevenMarker,
    ElevenReservedRole,
    ElevenReservedSpaces,
    ElevenSide,
    ElevenSpace,
    ElevenSpaceRef,
    ElevenTopology,
    ParsedElevenPitchId,
    RenderElevenTopologyDebugOptions,
    ElevenCellRef,
    ElevenResolvedCell,
} from "../common/eleven/index.js";
