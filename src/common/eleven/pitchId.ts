import { classifyElevenSpaces, sortTopLeft } from "./classify.js";
import {
    findElevenReservedSpaces,
    reservedPitchId,
    reservedRoleForIndex,
} from "./reserved.js";
import type { ElevenBand, ElevenSide, ElevenSpaceRef, ElevenTopology } from "./types.js";

const BAND_ORDER: ElevenBand[] = ["G", "P", "F", "C"];

const numberedPitchIdPattern = /^([WE])([GPFC])(\d+)$/;

export type ParsedElevenPitchId =
    | { kind: "numbered"; side: ElevenSide; band: ElevenBand; number: number }
    | { kind: "westGoal"; pitchId: "WG" }
    | { kind: "eastGoal"; pitchId: "EG" }
    | { kind: "center"; pitchId: "C" };

export const formatPitchNumber = (n: number, groupSize: number): string => {
    const width = Math.max(2, String(groupSize).length);
    return String(n).padStart(width, "0");
};

export const formatPitchId = (side: ElevenSide, band: ElevenBand, number: number, groupSize: number): string =>
    `${side}${band}${formatPitchNumber(number, groupSize)}`;

export const parsePitchId = (pitchId: string): ParsedElevenPitchId => {
    if (pitchId === "WG") {
        return { kind: "westGoal", pitchId: "WG" };
    }
    if (pitchId === "EG") {
        return { kind: "eastGoal", pitchId: "EG" };
    }
    if (pitchId === "C") {
        return { kind: "center", pitchId: "C" };
    }
    const m = numberedPitchIdPattern.exec(pitchId);
    if (m === null) {
        throw new Error(`invalid eleven pitch id: ${pitchId}`);
    }
    return {
        kind: "numbered",
        side: m[1] as ElevenSide,
        band: m[2] as ElevenBand,
        number: parseInt(m[3], 10),
    };
};

export const buildElevenPitchIds = (topology: ElevenTopology): ElevenSpaceRef[] => {
    const reserved = findElevenReservedSpaces(topology);
    const classified = classifyElevenSpaces(topology);
    const groups = new Map<string, typeof classified>();
    for (const side of ["W", "E"] as const) {
        for (const band of BAND_ORDER) {
            groups.set(`${side}|${band}`, []);
        }
    }
    for (const row of classified) {
        if (reservedRoleForIndex(reserved, row.index) !== undefined) {
            continue;
        }
        groups.get(`${row.side}|${row.band}`)!.push(row);
    }

    const byIndex = new Map<number, ElevenSpaceRef>();

    for (const row of classified) {
        const role = reservedRoleForIndex(reserved, row.index);
        if (role !== undefined) {
            byIndex.set(row.index, {
                index: row.index,
                column: row.column,
                side: row.side,
                band: row.band,
                number: null,
                pitchId: reservedPitchId(role),
                x: row.x,
                y: row.y,
            });
        }
    }

    for (const [, list] of groups) {
        list.sort((a, b) => sortTopLeft(a, b));
        const size = list.length;
        list.forEach((row, idx) => {
            const number = idx + 1;
            byIndex.set(row.index, {
                index: row.index,
                column: row.column,
                side: row.side,
                band: row.band,
                number,
                pitchId: formatPitchId(row.side, row.band, number, size),
                x: row.x,
                y: row.y,
            });
        });
    }

    return topology.spaces.map((s) => {
        const ref = byIndex.get(s.i);
        if (ref === undefined) {
            throw new Error(`missing pitch id for space ${s.i}`);
        }
        return ref;
    });
};
