import topologyJson from "../../boards/eleven/topology.json" with { type: "json" };
import { buildElevenGraphHelpers } from "./graph.js";
import type { ElevenTopology } from "./types.js";

export const ELEVEN_BOARD_TOPOLOGY = topologyJson as unknown as ElevenTopology;

/** Graph helpers for the committed eleven board (indices, pitch ids, move/shoot adjacency). */
export const ELEVEN_GRAPH = buildElevenGraphHelpers(ELEVEN_BOARD_TOPOLOGY);

export { buildElevenGraphHelpers, elevenIndexFromPitchId, elevenPitchId } from "./graph.js";
export { buildElevenPitchIds, formatPitchId, parsePitchId } from "./pitchId.js";
export type { ParsedElevenPitchId } from "./pitchId.js";
export {
    ELEVEN_RESERVED_PITCH_CENTER,
    ELEVEN_RESERVED_PITCH_EAST_GOAL,
    ELEVEN_RESERVED_PITCH_WEST_GOAL,
    findElevenReservedSpaces,
    reservedPitchId,
} from "./reserved.js";
export type { ElevenReservedRole, ElevenReservedSpaces } from "./reserved.js";
export {
    classifyElevenSpaces,
    ELEVEN_COLUMN_SLICES,
    grassColumnFromX,
    sideBandFromGrassColumn,
} from "./classify.js";
export { renderElevenTopologyDebugSvg } from "./debugSvg.js";
export { elevenMarkerTarget, elevenResolveCell } from "./cellRef.js";
export type { ElevenCellRef, ElevenResolvedCell } from "./cellRef.js";
export type {
    ElevenBand,
    ElevenGraphHelpers,
    ElevenMarker,
    ElevenSide,
    ElevenSpace,
    ElevenSpaceRef,
    ElevenTopology,
} from "./types.js";
export type { ElevenDebugLabelMode, RenderElevenTopologyDebugOptions } from "./debugSvg.js";
