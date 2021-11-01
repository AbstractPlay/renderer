import { hexOfTri } from ".";
import { GridPoints, IGeneratorArgs} from "./_base";

export function hexOfCir(args: IGeneratorArgs): GridPoints {
    return hexOfTri(args);
}
