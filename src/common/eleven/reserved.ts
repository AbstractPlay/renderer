import type { ElevenTopology } from "./types.js";

export const ELEVEN_RESERVED_PITCH_WEST_GOAL = "WG";
export const ELEVEN_RESERVED_PITCH_EAST_GOAL = "EG";
export const ELEVEN_RESERVED_PITCH_CENTER = "C";

export type ElevenReservedRole = "westGoal" | "eastGoal" | "center";

export type ElevenReservedSpaces = {
    westGoal: number;
    eastGoal: number;
    center: number;
};

const dist = (a: { x: number; y: number }, b: { x: number; y: number }) =>
    Math.hypot(a.x - b.x, a.y - b.y);

/** Goal mouths (shoot-only) and kick-off / centre space from topology geometry. */
export const findElevenReservedSpaces = (topology: ElevenTopology): ElevenReservedSpaces => {
    const n = topology.spaces.length;
    const moveDegree = new Array<number>(n).fill(0);
    const shootDegree = new Array<number>(n).fill(0);
    for (const [a, b] of topology.moveEdges) {
        moveDegree[a]++;
        moveDegree[b]++;
    }
    for (const [a, b] of topology.shootEdges) {
        shootDegree[a]++;
        shootDegree[b]++;
    }

    const goalMouths = topology.spaces.filter((s) => moveDegree[s.i] === 0 && shootDegree[s.i] > 0);
    if (goalMouths.length !== 2) {
        throw new Error(`expected 2 goal mouths, found ${goalMouths.length}`);
    }
    const westGoal = goalMouths.reduce((a, b) => (a.x < b.x ? a : b)).i;
    const eastGoal = goalMouths.reduce((a, b) => (a.x > b.x ? a : b)).i;

    const centerSpot = topology.markers.find((m) => m.kind === "centerSpot");
    if (centerSpot === undefined) {
        throw new Error("eleven topology missing centerSpot marker");
    }
    const spot = { x: centerSpot.cx, y: centerSpot.cy };
    const center = topology.spaces.reduce((best, s) =>
        dist(s, spot) < dist(best, spot) ? s : best,
    ).i;

    return { westGoal, eastGoal, center };
};

export const reservedPitchId = (role: ElevenReservedRole): string => {
    switch (role) {
        case "westGoal":
            return ELEVEN_RESERVED_PITCH_WEST_GOAL;
        case "eastGoal":
            return ELEVEN_RESERVED_PITCH_EAST_GOAL;
        case "center":
            return ELEVEN_RESERVED_PITCH_CENTER;
    }
};

export const reservedRoleForIndex = (
    reserved: ElevenReservedSpaces,
    index: number,
): ElevenReservedRole | undefined => {
    if (index === reserved.westGoal) {
        return "westGoal";
    }
    if (index === reserved.eastGoal) {
        return "eastGoal";
    }
    if (index === reserved.center) {
        return "center";
    }
    return undefined;
};
