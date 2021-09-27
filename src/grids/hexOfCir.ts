import { hexOfTri } from ".";
import { GridPoints, IGeneratorArgs} from "../GridGenerator";

export function hexOfCir(args: IGeneratorArgs): GridPoints {
    return hexOfTri(args);
}
