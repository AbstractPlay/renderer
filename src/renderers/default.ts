import svg from "svg.js";
import { rectOfSquares } from "../grids";
import { IRendererOptions, RendererBase } from "../RendererBase";
import { APRenderRep } from "../schema";

export class DefaultRenderer extends RendererBase {

    public render(json: APRenderRep, draw: svg.Doc, opts: IRendererOptions): void {
        json = this.jsonPrechecks(json);
        opts = this.optionsPrecheck(opts);

        // If patterns were requested, load them into the canvas
        if (opts.patterns) {
            this.loadPatterns(draw);
        }

        // Delegate to style-specific renderer
        if (! ("style" in json.board)) {
            throw new Error(`This 'board' schema cannot be handled by the '${ this.name }' renderer.`);
        }
        switch (json.board.style) {
            case "squares-checkered": {
                this.squaresCheckered(json, draw, opts);
                break;
            }
            default: {
                throw new Error(`The requested board style (${ json.board.style })is not yet supported by the default renderer.`);
                break;
            }
        }
    }

    private squaresCheckered(json: APRenderRep, draw: svg.Doc, opts: IRendererOptions): void {
        // Check required properites
        if ( (! ("width" in json.board)) || (! ("height" in json.board)) || (json.board.width === undefined) || (json.board.height === undefined) ) {
            throw new Error("Both the `width` and `height` properties are required for this board type.");
        }
        const width: number = json.board.width;
        const height: number = json.board.height;

        // Get a grid of points
        const grid = rectOfSquares({gridHeight: json.board.height, gridWidth: json.board.width});

        // Determine whether the first row starts with a light or dark square
        let startLight: number = 1;
        if (height % 2 === 0) {
            startLight = 0;
        }

        const board = draw.group().id("board");
    }
}
