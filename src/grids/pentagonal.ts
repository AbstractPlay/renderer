import { GridPoints, IGeneratorArgs, IPoint} from "./_base";

/**
 * Generates a square field of points separated by a fixed width and height.
 * It's the renderers that choose to interpret these points as centre points or vertices.
 *
 * @param args - Generator options
 * @returns Map of x,y coordinates to row/column locations
 */
export const pentagonal = (args: IGeneratorArgs): GridPoints => {
    if (args.pentagonalGraph === undefined) {
        throw new Error(`The pentagonal grid generator requires the "pentagonalGraph" parameter.`);
    }

    const grid: GridPoints = [];
    for (const layer of args.pentagonalGraph.layers) {
        const row: IPoint[] = [];
        const seen = new Set<number>();
        for (const side of layer) {
            for (const vertex of side) {
                if (seen.has(vertex.id)) {
                    continue;
                }
                const real = args.pentagonalGraph.vertices[vertex.id];
                if (real === undefined || real.pt === undefined) {
                    throw new Error(`Could not find the canonical vertex id ${vertex.id}`);
                }
                row.push(real.pt!);
                seen.add(vertex.id);
            }
        }
        grid.push(row);
    }
    return grid;
}
