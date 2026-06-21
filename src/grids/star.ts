import { GridPoints, IGeneratorArgs, IPoint } from "./_base";
import { Graph as StarGraph } from "../common/star";

/**
 * Playable vertex positions for a Star board.
 * Rings run outside-in; row 0 is the perimeter from the top quark clockwise.
 */
export const star = (args: IGeneratorArgs): GridPoints => {
    if (args.starGraph === undefined) {
        throw new Error(`The star grid generator requires the "starGraph" parameter.`);
    }

    const grid: GridPoints = [];
    for (const layer of args.starGraph.gridLayers) {
        const row: IPoint[] = [];
        for (const vertex of layer) {
            const canonical = args.starGraph.vertices[vertex.id];
            if (canonical === undefined || canonical.pt === undefined) {
                throw new Error(`Could not find the canonical vertex id ${vertex.id}`);
            }
            row.push(canonical.pt);
        }
        grid.push(row);
    }
    return grid;
};

export type { StarGraph };
