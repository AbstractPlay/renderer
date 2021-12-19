import { hexOfTri } from ".";
import { GridPoints, IGeneratorArgs} from "./_base";

/**
 * Generates a hexagonal field of centre points that will accommodate circles.
 * Identical to `hexOfTri`, so offload to there.
 *
 * @param args - Generator options
 * @returns Map of x,y coordinates to row/column locations
 */
export const hexOfCir = (args: IGeneratorArgs): GridPoints => {
    return hexOfTri(args);
}
