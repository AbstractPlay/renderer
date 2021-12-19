import { hexOfTri } from ".";
import { GridPoints, IGeneratorArgs} from "./_base";

/**
 * Generates a hexagonal field of centre points that will accommodate circles.
 * Identical to `hexOfTri`, so offload to there.
 *
 * @export
 * @param {IGeneratorArgs} args
 * @returns {GridPoints}
 */
export function hexOfCir(args: IGeneratorArgs): GridPoints {
    return hexOfTri(args);
}
