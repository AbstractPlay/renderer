import svg from "@svgdotjs/svg.js";
import { APRenderRep } from "./schema";
import sheets from "./sheets";

export default class Renderer {
    public readonly name: string;

    constructor(name = "default") {
        this.name = name;
    }

    public render(json: APRenderRep, draw: svg.Doc, sheetList: string[]) {
        return;
    }
}
