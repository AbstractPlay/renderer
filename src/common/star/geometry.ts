import { geSolve, Graph as PentGraph } from "../pentagons";
import { IPoint } from "../../grids";

const PENTAGON_SCALE = 65;

const lerp = (a: IPoint, b: IPoint, t: number): IPoint => ({
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
});

/** Five quark corners of a regular pentagon (one vertex pointing up). */
const pentagonCorners = (frequency: number): IPoint[] => {
    const radius = PENTAGON_SCALE * frequency;
    const sideAngle = (2 * Math.PI) / 5;
    return Array.from({ length: 5 }, (_, side) => {
        const angle = 0.5 * Math.PI + side * sideAngle;
        return {
            x: radius * Math.cos(angle),
            y: radius * Math.sin(angle),
        };
    });
};

/** Fix outer vertices on straight pentagon edges; corners stay at quark positions. */
const setStraightOuterLocations = (topology: PentGraph, frequency: number): void => {
    const corners = pentagonCorners(frequency);
    const outer = topology.layers[frequency]!;

    for (let side = 0; side < 5; side++) {
        const curve = outer[side]!;
        const start = corners[side]!;
        const end = corners[(side + 1) % 5]!;
        const segments = curve.length - 1;

        for (let n = 0; n < segments; n++) {
            const pt = lerp(start, end, n / segments);
            curve[n]!.setPoint(pt.x, pt.y);
        }
    }
};

const tutteEmbedding = (topology: PentGraph): void => {
    const vertices = topology.vertices;
    const vCount = vertices.length;
    const k: number[][] = Array.from({ length: vCount }, () =>
        Array.from({ length: vCount }, () => 0),
    );

    for (let row = 0; row < vCount; row++) {
        for (let col = 0; col < vCount; col++) {
            if (row === col) {
                k[row]![col] = vertices[row]!.nbors.length;
            } else if (vertices[row]!.nbors.includes(vertices[col]!.id)) {
                k[row]![col] = -1;
            }
        }
    }

    const internal: number[] = [];
    for (let vid = 0; vid < vCount; vid++) {
        if (!vertices[vid]!.isOuter) {
            internal.push(vid);
        }
    }
    const internalCount = internal.length;

    const ax: number[][] = Array.from({ length: internalCount }, () =>
        Array.from({ length: internalCount }, () => 0),
    );
    const ay: number[][] = Array.from({ length: internalCount }, () =>
        Array.from({ length: internalCount }, () => 0),
    );
    const bx: number[] = Array.from({ length: internalCount }, () => 0);
    const by: number[] = Array.from({ length: internalCount }, () => 0);

    for (let row = 0; row < internalCount; row++) {
        const vidR = internal[row]!;
        let col = 0;
        for (let v = 0; v < vCount; v++) {
            const vertex = vertices[v]!;
            const coeff = k[vidR]![v]!;

            if (vertex.isOuter) {
                if (vertex.pt === undefined) {
                    throw new Error(`Outer vertex ${vertex.id} has no position`);
                }
                bx[row]! -= coeff * vertex.pt.x;
                by[row]! -= coeff * vertex.pt.y;
            } else {
                ax[row]![col] = coeff;
                ay[row]![col] = coeff;
                col++;
            }
        }
    }

    const xs = geSolve(ax, bx);
    const ys = geSolve(ay, by);

    for (let s = 0; s < internal.length; s++) {
        vertices[internal[s]!]!.setPoint(xs[s]!, ys[s]!);
    }
};

/** Match {@link pentagonalBoard} orientation (flip x and y). */
export const applyStarOrientation = (topology: PentGraph): void => {
    for (const vertex of topology.vertices) {
        if (vertex.pt === undefined) {
            throw new Error(`Vertex ${vertex.id} is missing a position`);
        }
        vertex.setPoint(vertex.pt.x * -1, vertex.pt.y * -1);
    }
};

/**
 * Re-embed a pentagonal mesh with straight outer edges and Tutte interior solve.
 * The pentagonal graph constructor uses polar/circular outer placement; Star needs
 * a flat pentagon boundary like realstar.png.
 */
export const embedStarPositions = (topology: PentGraph, frequency: number): void => {
    setStraightOuterLocations(topology, frequency);
    tutteEmbedding(topology);
    applyStarOrientation(topology);
};
