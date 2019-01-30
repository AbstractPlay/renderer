import svg, { Nested } from "@svgdotjs/svg.js";
import { APRenderRep } from "./schema";
import { sheets } from "./sheets";

export class Renderer {
    public readonly name: string;
    public readonly coloursBasic = ["#e41a1c", "#377eb8", "#4daf4a", "#ffff33", "#984ea3", "#ff7f00", "#a65628", "#f781bf", "#999999"];
    public readonly coloursBlind = ["#a6611a", "#018571", "#dfc27d", "#80cdc1"];
    public readonly patternsBW = [];

    constructor(name = "default") {
        this.name = name;
    }

    public render(json: APRenderRep, draw: svg.Doc, sheetList: string[]): void {
        json = this.prechecks(json);

        // Board first
        const board = draw.group().id("board");
        board.circle(100).fill("#999").stroke({width: 2, color: "black"});
    }

    protected prechecks(json: APRenderRep): APRenderRep {
        // Check for missing renderer
        if ("renderer" ! in json) {
            json.renderer = "default";
        }

        // Make sure the JSON is intended for you
        if (json.renderer !== this.name) {
            throw Error(`Renderer mismatch. The JSON data you provided is intended for the "${json.renderer}" renderer, but the "${this.name}" renderer received it.`);
        }

        return json;
    }
}
