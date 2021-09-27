import { G as SVGG, SVG, Svg } from "@svgdotjs/svg.js";
import { GridPoints } from "../GridGenerator";
import { hexOfCir, hexOfHex, hexOfTri, rectOfSquares, snubsquare } from "../grids";
import { IRendererOptionsIn, IRendererOptionsOut, RendererBase } from "../RendererBase";
import { APRenderRep, Glyph } from "../schema";

export class DefaultRenderer extends RendererBase {

    public render(json: APRenderRep, draw: Svg, options: IRendererOptionsIn): void {
        json = this.jsonPrechecks(json);
        const opts = this.optionsPrecheck(options);

        // BOARD
        // Delegate to style-specific renderer
        let gridPoints: GridPoints;
        if (! ("style" in json.board)) {
            throw new Error(`This 'board' schema cannot be handled by the '${ this.name }' renderer.`);
        }
        switch (json.board.style) {
            case "squares-checkered": {
                gridPoints = this.squares(json, draw, opts);
                break;
            }
            case "squares": {
                gridPoints = this.squares(json, draw, opts);
                break;
            }
            case "snubsquare": {
                gridPoints = this.snubSquare(json, draw, opts);
                break;
            }
            case "hex_of_hex": {
                gridPoints = this.hexOfHex(json, draw, opts);
                break;
            }
            case "hex_of_tri": {
                gridPoints = this.hexOfTri(json, draw, opts);
                break;
            }
            case "hex_of_cir": {
                gridPoints = this.hexOfCir(json, draw, opts);
                break;
            }
            default: {
                throw new Error(`The requested board style (${ json.board.style }) is not yet supported by the default renderer.`);
                break;
            }
        }

        // PIECES
        // Load all the pieces in the legend
        if ( ("legend" in json) && (json.legend !== undefined) ) {
            const glyphSet: Set<string> = new Set();
            // tslint:disable-next-line: forin
            for (const key in json.legend) {
                const node = json.legend[key];
                if (typeof(node) === "string") {
                    glyphSet.add(node);
                } else if (Array.isArray(node)) {
                    node.forEach((e) => {
                        glyphSet.add(e.name);
                    });
                } else {
                    glyphSet.add(node.name);
                }
            }
            for (const glyph of glyphSet) {
                this.loadGlyph(glyph, opts.sheetList, draw);
            }

            // Load any requested patterns
            if (opts.patterns) {
                const patterns: Array<number> = new Array();
                // tslint:disable-next-line: forin
                for (const key in json.legend) {
                    const node = json.legend[key];
                    if (typeof(node) !== "string") {
                        let glyphs: Array<Glyph>;
                        if (! Array.isArray(node)) {
                            glyphs = [node];
                        } else {
                            glyphs = node;
                        }
                        glyphs.forEach((e) => {
                            if (e.player !== undefined) {
                                if (! patterns.includes(e.player)) {
                                    patterns.push(e.player);
                                }
                            }
                        });
                    }
                }
                patterns.forEach((n) => {
                    if (n > opts.patternList.length) {
                        throw new Error("The system does not support the number of patterns you have requested.");
                    }
                    this.loadPattern(opts.patternList[n - 1], draw);
                });
            }

            // Now look for composite and coloured pieces and add those to the <defs> section for placement
            // tslint:disable-next-line: forin
            for (const key in json.legend) {
                const node = json.legend[key];
                if (typeof(node) !== "string") {
                    let glyphs: Array<Glyph>;
                    if (! Array.isArray(node)) {
                        glyphs = [node];
                    } else {
                        glyphs = node;
                    }

                    // Create a new SVG.Nested to represent the composite piece and add it to <defs>
                    const cellsize = 500;
                    const nested = draw.defs().group().id(key).size(cellsize, cellsize).attr("data-cellsize", cellsize);

                    // Layer the glyphs, manipulating as you go
                    glyphs.forEach((glyph) => {
                        // Get the glyph from <defs>
                        const got = SVG("#" + glyph.name) as SVGG;
                        const use = got.clone();
                        if ( (use === undefined) || (use === null) ) {
                            throw new Error("The glyph sheet is malformed. This should never happen. Please let the administrator know.");
                        }

                        // Scale it appropriately
                        // if (use.is(SVGG)) {
                        //     const sheetCellSize = use.attr("data-cellsize");
                        //     if ( (sheetCellSize === null) || (sheetCellSize === undefined) ) {
                        //         throw new Error(`The glyph you requested (${key}) does not contain the necessary information for scaling. Please use a different sheet or contact the administrator.`);
                        //     }
                        //     use.scale(cellsize / sheetCellSize);
                        // } else {
                        //     use.size(cellsize);
                        // }
                        use.size(cellsize);

                        // Colourize (`player` first, then `colour` if defined)
                        if (glyph.player !== undefined) {
                            if  (opts.patterns) {
                                if (glyph.player > opts.patternList.length) {
                                    throw new Error("The list of patterns provided is not long enough to support the number of players in this game.");
                                }
                                const fill = SVG("#" + opts.patternList[glyph.player - 1]);
                                // if (use.is(SVGG)) {
                                //     (use as SVGG).find("[data-playerfill=true]").each(function(this: Svg) { this.fill(fill); });
                                // } else {
                                //     use.fill(fill);
                                // }
                                use.find("[data-playerfill=true]").each(function(this: Svg) { this.fill(fill); });
                            } else {
                                if (glyph.player > opts.colours.length) {
                                    throw new Error("The list of colours provided is not long enough to support the number of players in this game.");
                                }
                                const fill = opts.colours[glyph.player - 1];
                                // if (use.is(SVGG)) {
                                //     (use as SVGG).find("[data-playerfill=true]").each(function(this: Svg) { this.fill(fill); });
                                // } else {
                                //     use.fill(fill);
                                // }
                                use.find("[data-playerfill=true]").each(function(this: Svg) { this.fill(fill); });
                            }
                        } else if (glyph.colour !== undefined) {
                            // if (use.is(SVGG)) {
                            //     (use as SVGG).find("[data-playerfill=true]").each(function(this: Svg) { this.fill({color: glyph.colour}); });
                            // } else {
                            //     use.fill(glyph.colour);
                            // }
                            use.find("[data-playerfill=true]").each(function(this: Svg) { this.fill({color: glyph.colour}); });
                        }

                        // Scale as requested
                        if (glyph.scale !== undefined) {
                            use.transform({scale: glyph.scale}, true);
                        }

                        // Rotate if requested
                        if (glyph.rotate !== undefined) {
                            use.rotate(glyph.rotate);
                        }

                        // Shift if requested
                        let dx = 0;
                        let dy = 0;
                        if (glyph.nudge !== undefined) {
                            if (glyph.nudge.dx !== undefined) {
                                dx = glyph.nudge.dx;
                            }
                            if (glyph.nudge.dy !== undefined) {
                                dy = glyph.nudge.dy;
                            }
                        }
                        use.dmove(dx, dy);

                        // Apply requested opacity
                        if (glyph.opacity !== undefined) {
                            use.fill({opacity: glyph.opacity});
                        }

                        // Add to the nested figure
                        nested.add(use);
                    });
                }
            }
        }

        // Now place the pieces
        const group = draw.group().id("pieces");
        if (json.pieces !== null) {
            // Generate pieces array
            let pieces: string[][][] = new Array();

            if (typeof json.pieces === "string") {
                // Does it contain commas
                if (json.pieces.indexOf(",") >= 0) {
                    for (const row of json.pieces.split("\n")) {
                        let node: string[][];
                        if (row === "_") {
                            node = new Array(json.board.width).fill([]);
                        } else {
                            let cells = row.split(",");
                            cells = cells.map((x) => { if (x === "") {return "-"; } else {return x; } });
                            node = cells.map((x) => [x]);
                        }
                        pieces.push(node);
                    }
                } else {
                    for (const row of json.pieces.split("\n")) {
                        let node: string[][];
                        if (row === "_") {
                            node = new Array(json.board.width).fill([]);
                        } else {
                            const cells = row.split("");
                            node = cells.map((x) => [x]);
                        }
                        pieces.push(node);
                    }
                }
            } else if ( (json.pieces instanceof Array) && (json.pieces[0] instanceof Array) && (json.pieces[0][0] instanceof Array) ) {
                pieces = json.pieces as string[][][];
            } else {
                throw new Error("Unrecognized `pieces` property.");
            }

            // Place the pieces according to the grid
            for (let row = 0; row < pieces.length; row++) {
                for (let col = 0; col < pieces[row].length; col++) {
                    for (const key of pieces[row][col]) {
                        if ( (key !== null) && (key !== "-") ) {
                            const point = gridPoints[row][col];
                            const piece = SVG("#" + key);
                            if ( (piece === null) || (piece === undefined) ) {
                                throw new Error(`Could not find the requested piece (${key}). Each piece in the \`pieces\` property *must* exist in the \`legend\`.`);
                            }
                            const use = group.use(piece) as SVGG;
                            use.center(point.x, point.y);
                            // if (piece.is(SVGG)) {
                            //     const sheetCellSize = piece.attr("data-cellsize");
                            //     if ( (sheetCellSize === null) || (sheetCellSize === undefined) ) {
                            //         throw new Error(`The glyph you requested (${key}) does not contain the necessary information for scaling. Please use a different sheet or contact the administrator.`);
                            //     }
                            //     use.scale(this.cellsize / sheetCellSize);
                            // } else {
                            //     use.size(this.cellsize);
                            // }
                            const sheetCellSize = piece.attr("data-cellsize");
                            if ( (sheetCellSize === null) || (sheetCellSize === undefined) ) {
                                throw new Error(`The glyph you requested (${key}) does not contain the necessary information for scaling. Please use a different sheet or contact the administrator.`);
                            }
                            use.scale((this.cellsize / sheetCellSize) * 0.85);
                        }
                    }
                }
            }
        }

        // Finally, annotations
        if ( ("annotations" in json) && (json.annotations !== undefined) ) {
            const notes = draw.group().id("annotations");
            // const markerArrow = notes.marker(5, 5, (add) => add.path("M 0 0 L 10 5 L 0 10 z"));
            const markerArrow = notes.marker(4, 4, (add) => add.path("M0,0 L4,2 0,4"));
            const markerCircle = notes.marker(2, 2, (add) => add.circle(2).fill("black"));
            for (const note of json.annotations) {
                if (note.type === "mvmtMain") {
                    if ( (! ("points" in note)) || (note.points === undefined) || (! (note.points instanceof Array)) || (note.points.length < 2) ) {
                        throw new Error("The annotation `mvmtMain` requries that at least two points be defined.");
                    }
                    const points: string[] = [];
                    for (const point of note.points) {
                        const [x, y] = point.split(",");
                        points.push(`${gridPoints[+y][+x].x},${gridPoints[+y][+x].y}`);
                    }
                    const line = notes.polyline(points.join(" ")).stroke({width: 1.5, color: "black"});
                    line.marker("end", markerArrow);
                    line.marker("start", markerCircle);
                } else {
                    throw new Error(`The requested annotation type (${note.type}) is not implemented.`);
                }
            }
        }
    }

    protected squares(json: APRenderRep, draw: Svg, opts: IRendererOptionsOut): GridPoints {
        // Check required properites
        if ( (! ("width" in json.board)) || (! ("height" in json.board)) || (json.board.width === undefined) || (json.board.height === undefined) ) {
            throw new Error("Both the `width` and `height` properties are required for this board type.");
        }
        const width: number = json.board.width;
        const height: number = json.board.height;
        const cellsize = this.cellsize;
        const style = json.board.style;

        let baseStroke: number = 1;
        let baseColour: string = "#000";
        let baseOpacity: number = 1;
        if ( ("strokeWeight" in json.board) && (json.board.strokeWeight !== undefined) ) {
            baseStroke = json.board.strokeWeight;
        }
        if ( ("strokeColour" in json.board) && (json.board.strokeColour !== undefined) ) {
            baseColour = json.board.strokeColour;
        }
        if ( ("strokeOpacity" in json.board) && (json.board.strokeOpacity !== undefined) ) {
            baseOpacity = json.board.strokeOpacity;
        }

        // Get a grid of points
        const grid = rectOfSquares({gridHeight: height, gridWidth: width, cellSize: cellsize});
        const board = draw.group().id("board");

        // Add board labels
        const labels = board.group().id("labels");
        // Columns (letters)
        for (let col = 0; col < width; col++) {
            const pointTop = {x: grid[0][col].x, y: grid[0][col].y - cellsize};
            const pointBottom = {x: grid[height - 1][col].x, y: grid[height - 1][col].y + cellsize};
            labels.text(this.columnLabels[col]).fill(baseColour).opacity(baseOpacity).center(pointTop.x, pointTop.y);
            labels.text(this.columnLabels[col]).fill(baseColour).opacity(baseOpacity).center(pointBottom.x, pointBottom.y);
        }

        // Rows (numbers)
        for (let row = 0; row < height; row++) {
            const pointL = {x: grid[row][0].x - cellsize, y: grid[row][0].y};
            const pointR = {x: grid[row][width - 1].x + cellsize, y: grid[row][width - 1].y};
            labels.text(`${height - row}`).fill(baseColour).opacity(baseOpacity).center(pointL.x, pointL.y);
            labels.text(`${height - row}`).fill(baseColour).opacity(baseOpacity).center(pointR.x, pointR.y);
        }

        // Now the tiles
        if (style === "squares-checkered") {
            // Load glyphs for light and dark squares
            const tileDark = draw.defs().rect(cellsize, cellsize)
                .fill(baseColour)
                .opacity(baseOpacity * 0.25)
                .stroke({width: 0})
                .id("tileDark");

            const tiles = board.group().id("tiles");
            // Determine whether the first row starts with a light or dark square
            let startLight: number = 1;
            if (height % 2 === 0) {
                startLight = 0;
            }

            // Place them
            for (let row = 0; row < height; row++) {
                let lightCol: number = 1;
                if (row % 2 === startLight) {
                    lightCol = 0;
                }
                for (let col = 0; col < width; col++) {
                    if (col % 2 !== lightCol) {
                        const {x, y} = grid[row][col];
                        tiles.use(tileDark).center(x, y);
                    }
                }
            }
        }

        // Draw grid lines
        const gridlines = draw.group().id("gridlines");
        // Horizontal, top of each row, then bottom line after loop
        for (let row = 0; row < height; row++) {
            const x1 = grid[row][0].x - (cellsize / 2);
            const y1 = grid[row][0].y - (cellsize / 2);
            const x2 = grid[row][width - 1].x + (cellsize / 2);
            const y2 = grid[row][width - 1].y - (cellsize / 2);
            gridlines.line(x1, y1, x2, y2).stroke({width: baseStroke, color: baseColour, opacity: baseOpacity});
        }
        let lastx1 = grid[height - 1][0].x - (cellsize / 2);
        let lasty1 = grid[height - 1][0].y + (cellsize / 2);
        let lastx2 = grid[height - 1][width - 1].x + (cellsize / 2);
        let lasty2 = grid[height - 1][width - 1].y + (cellsize / 2);
        gridlines.line(lastx1, lasty1, lastx2, lasty2).stroke({width: baseStroke, color: baseColour, opacity: baseOpacity});

        // Vertical, left of each column, then right line after loop
        for (let col = 0; col < width; col++) {
            const x1 = grid[0][col].x - (cellsize / 2);
            const y1 = grid[0][col].y - (cellsize / 2);
            const x2 = grid[height - 1][col].x - (cellsize / 2);
            const y2 = grid[height - 1][col].y + (cellsize / 2);
            gridlines.line(x1, y1, x2, y2).stroke({width: baseStroke, color: baseColour, opacity: baseOpacity});
        }
        lastx1 = grid[0][width - 1].x + (cellsize / 2);
        lasty1 = grid[0][width - 1].y - (cellsize / 2);
        lastx2 = grid[height - 1][width - 1].x + (cellsize / 2);
        lasty2 = grid[height - 1][width - 1].y + (cellsize / 2);
        gridlines.line(lastx1, lasty1, lastx2, lasty2).stroke({width: baseStroke, color: baseColour, opacity: baseOpacity});

        return grid;
    }

    protected snubSquare(json: APRenderRep, draw: Svg, opts: IRendererOptionsOut): GridPoints {
        // Check required properites
        if ( (! ("width" in json.board)) || (! ("height" in json.board)) || (json.board.width === undefined) || (json.board.height === undefined) ) {
            throw new Error("Both the `width` and `height` properties are required for this board type.");
        }
        const width: number = json.board.width;
        const height: number = json.board.height;
        const cellsize = this.cellsize;

        let baseStroke: number = 1;
        let baseColour: string = "#000";
        let baseOpacity: number = 1;
        if ( ("strokeWeight" in json.board) && (json.board.strokeWeight !== undefined) ) {
            baseStroke = json.board.strokeWeight;
        }
        if ( ("strokeColour" in json.board) && (json.board.strokeColour !== undefined) ) {
            baseColour = json.board.strokeColour;
        }
        if ( ("strokeOpacity" in json.board) && (json.board.strokeOpacity !== undefined) ) {
            baseOpacity = json.board.strokeOpacity;
        }

        // Get a grid of points
        const grid = snubsquare({gridHeight: height, gridWidth: width, cellSize: cellsize});
        const board = draw.group().id("board");

        // Add board labels
        const labels = board.group().id("labels");
        // Columns (letters)
        for (let col = 0; col < width; col++) {
            const pointTop = {x: grid[0][col].x, y: grid[0][col].y - cellsize};
            const pointBottom = {x: grid[height - 1][col].x, y: grid[height - 1][col].y + cellsize};
            labels.text(this.columnLabels[col]).fill(baseColour).opacity(baseOpacity).center(pointTop.x, pointTop.y);
            labels.text(this.columnLabels[col]).fill(baseColour).opacity(baseOpacity).center(pointBottom.x, pointBottom.y);
        }

        // Rows (numbers)
        for (let row = 0; row < height; row++) {
            const pointL = {x: grid[row][0].x - cellsize, y: grid[row][0].y};
            const pointR = {x: grid[row][width - 1].x + cellsize, y: grid[row][width - 1].y};
            labels.text(`${height - row}`).fill(baseColour).opacity(baseOpacity).center(pointL.x, pointL.y);
            labels.text(`${height - row}`).fill(baseColour).opacity(baseOpacity).center(pointR.x, pointR.y);
        }

        // Draw grid lines
        const gridlines = draw.group().id("gridlines");
        for (let row = 0; row < height; row++) {
            for (let col = 0; col < width; col++) {
                const curr = grid[row][col];

                // always connect to previous cell
                if (col > 0) {
                    const prev = grid[row][col - 1];
                    const x1 = curr.x;
                    const y1 = curr.y;
                    const x2 = prev.x;
                    const y2 = prev.y;
                    gridlines.line(x1, y1, x2, y2).stroke({width: baseStroke, color: baseColour, opacity: baseOpacity});
                }

                if (row > 0) {
                    // always connect to cell directly above
                    let prev = grid[row - 1][col];
                    let x1 = curr.x;
                    let y1 = curr.y;
                    let x2 = prev.x;
                    let y2 = prev.y;
                    gridlines.line(x1, y1, x2, y2).stroke({width: baseStroke, color: baseColour, opacity: baseOpacity});
                    // even row, odd columns connect as well to previous-above cell
                    if ( ( (row % 2) === 0) && ( (col % 2) !== 0) ) {
                        prev = grid[row - 1][col - 1];
                        x1 = curr.x;
                        y1 = curr.y;
                        x2 = prev.x;
                        y2 = prev.y;
                        gridlines.line(x1, y1, x2, y2).stroke({width: baseStroke, color: baseColour, opacity: baseOpacity});
                    // odd row, odd columns connect as well to previous-next cell
                    } else if (( (col % 2) !== 0) && (col < (width - 1)) ) {
                        prev = grid[row - 1][col + 1];
                        x1 = curr.x;
                        y1 = curr.y;
                        x2 = prev.x;
                        y2 = prev.y;
                        gridlines.line(x1, y1, x2, y2).stroke({width: baseStroke, color: baseColour, opacity: baseOpacity});
                    }
                }
            }
        }

        return grid;
    }

    protected hexOfTri(json: APRenderRep, draw: Svg, opts: IRendererOptionsOut): GridPoints {
        // Check required properites
        if ( (! ("minWidth" in json.board)) || (! ("maxWidth" in json.board)) || (json.board.minWidth === undefined) || (json.board.maxWidth === undefined) ) {
            throw new Error("Both the `minWidth` and `maxWidth` properties are required for this board type.");
        }
        const minWidth: number = json.board.minWidth;
        const maxWidth: number = json.board.maxWidth;
        const cellsize = this.cellsize;
        const height = ((maxWidth - minWidth) * 2) + 1;

        let baseStroke: number = 1;
        let baseColour: string = "#000";
        let baseOpacity: number = 1;
        if ( ("strokeWeight" in json.board) && (json.board.strokeWeight !== undefined) ) {
            baseStroke = json.board.strokeWeight;
        }
        if ( ("strokeColour" in json.board) && (json.board.strokeColour !== undefined) ) {
            baseColour = json.board.strokeColour;
        }
        if ( ("strokeOpacity" in json.board) && (json.board.strokeOpacity !== undefined) ) {
            baseOpacity = json.board.strokeOpacity;
        }

        // Get a grid of points
        const grid = hexOfTri({gridWidthMin: minWidth, gridWidthMax: maxWidth, cellSize: cellsize});
        const board = draw.group().id("board");

        // Add board labels
        const labels = board.group().id("labels");

        // Rows (numbers)
        for (let row = 0; row < height; row++) {
            const pointL = {x: grid[row][0].x - cellsize, y: grid[row][0].y};
            const pointR = {x: grid[row][grid[row].length - 1].x + cellsize, y: grid[row][grid[row].length - 1].y};
            labels.text(this.columnLabels[height - row - 1] + "1").fill(baseColour).opacity(baseOpacity).center(pointL.x, pointL.y);
            labels.text(this.columnLabels[height - row - 1] + `${grid[row].length}`).fill(baseColour).opacity(baseOpacity).center(pointR.x, pointR.y);
        }

        // Draw grid lines
        const gridlines = draw.group().id("gridlines");
        const midrow = maxWidth - minWidth;

        for (let row = 0; row < grid.length; row++) {
            const currRow = grid[row];
            for (let col = 0; col < grid[row].length; col++) {
                const curr = currRow[col];

                // always connect to cell to the left
                if (col > 0) {
                    const prev = currRow[col - 1];
                    const x1 = curr.x;
                    const y1 = curr.y;
                    const x2 = prev.x;
                    const y2 = prev.y;
                    gridlines.line(x1, y1, x2, y2).stroke({width: baseStroke, color: baseColour, opacity: baseOpacity});
                }

                // connections are build upward, so only continue with rows after the first
                if (row > 0) {
                    // always connect to the cell directly above, if one exists
                    if (col <= grid[row - 1].length - 1) {
                        const prev = grid[row - 1][col];
                        const x1 = curr.x;
                        const y1 = curr.y;
                        const x2 = prev.x;
                        const y2 = prev.y;
                        gridlines.line(x1, y1, x2, y2).stroke({width: baseStroke, color: baseColour, opacity: baseOpacity});
                    }
                    // up to and including the midline, connect to the above-previous cell if there is one
                    if ( (row <= midrow) && (col > 0) ) {
                        const prev = grid[row - 1][col - 1];
                        const x1 = curr.x;
                        const y1 = curr.y;
                        const x2 = prev.x;
                        const y2 = prev.y;
                        gridlines.line(x1, y1, x2, y2).stroke({width: baseStroke, color: baseColour, opacity: baseOpacity});
                    }
                    // after the midline, connect to the above-next cell instead
                    if (row > midrow) {
                        const prev = grid[row - 1][col + 1];
                        const x1 = curr.x;
                        const y1 = curr.y;
                        const x2 = prev.x;
                        const y2 = prev.y;
                        gridlines.line(x1, y1, x2, y2).stroke({width: baseStroke, color: baseColour, opacity: baseOpacity});
                    }
                }
            }
        }
        return grid;
    }

    protected hexOfCir(json: APRenderRep, draw: Svg, opts: IRendererOptionsOut): GridPoints {
        // Check required properites
        if ( (! ("minWidth" in json.board)) || (! ("maxWidth" in json.board)) || (json.board.minWidth === undefined) || (json.board.maxWidth === undefined) ) {
            throw new Error("Both the `minWidth` and `maxWidth` properties are required for this board type.");
        }
        const minWidth: number = json.board.minWidth;
        const maxWidth: number = json.board.maxWidth;
        const cellsize = this.cellsize;
        const height = ((maxWidth - minWidth) * 2) + 1;

        let baseStroke: number = 1;
        let baseColour: string = "#000";
        let baseOpacity: number = 1;
        if ( ("strokeWeight" in json.board) && (json.board.strokeWeight !== undefined) ) {
            baseStroke = json.board.strokeWeight;
        }
        if ( ("strokeColour" in json.board) && (json.board.strokeColour !== undefined) ) {
            baseColour = json.board.strokeColour;
        }
        if ( ("strokeOpacity" in json.board) && (json.board.strokeOpacity !== undefined) ) {
            baseOpacity = json.board.strokeOpacity;
        }

        // Get a grid of points
        const grid = hexOfCir({gridWidthMin: minWidth, gridWidthMax: maxWidth, cellSize: cellsize});
        const board = draw.group().id("board");

        // Add board labels
        const labels = board.group().id("labels");

        // Rows (numbers)
        for (let row = 0; row < height; row++) {
            const pointL = {x: grid[row][0].x - cellsize, y: grid[row][0].y};
            const pointR = {x: grid[row][grid[row].length - 1].x + cellsize, y: grid[row][grid[row].length - 1].y};
            labels.text(this.columnLabels[height - row - 1] + "1").fill(baseColour).opacity(baseOpacity).center(pointL.x, pointL.y);
            labels.text(this.columnLabels[height - row - 1] + `${grid[row].length}`).fill(baseColour).opacity(baseOpacity).center(pointR.x, pointR.y);
        }

        // Draw circles
        const gridlines = draw.group().id("circles");
        const circle = draw.defs().circle(cellsize)
            .id("_circle")
            .fill("none")
            .stroke({color: baseColour, opacity: baseOpacity, width: baseStroke});
        for (const row of grid) {
            for (const p of row) {
                gridlines.use(circle).center(p.x, p.y);
            }
        }

        return grid;
    }

    protected hexOfHex(json: APRenderRep, draw: Svg, opts: IRendererOptionsOut): GridPoints {
        // Check required properites
        if ( (! ("minWidth" in json.board)) || (! ("maxWidth" in json.board)) || (json.board.minWidth === undefined) || (json.board.maxWidth === undefined) ) {
            throw new Error("Both the `minWidth` and `maxWidth` properties are required for this board type.");
        }
        const minWidth: number = json.board.minWidth;
        const maxWidth: number = json.board.maxWidth;
        const cellsize = this.cellsize;
        const height = ((maxWidth - minWidth) * 2) + 1;

        let baseStroke: number = 1;
        let baseColour: string = "#000";
        let baseOpacity: number = 1;
        if ( ("strokeWeight" in json.board) && (json.board.strokeWeight !== undefined) ) {
            baseStroke = json.board.strokeWeight;
        }
        if ( ("strokeColour" in json.board) && (json.board.strokeColour !== undefined) ) {
            baseColour = json.board.strokeColour;
        }
        if ( ("strokeOpacity" in json.board) && (json.board.strokeOpacity !== undefined) ) {
            baseOpacity = json.board.strokeOpacity;
        }

        // Get a grid of points
        const grid = hexOfHex({gridWidthMin: minWidth, gridWidthMax: maxWidth, cellSize: cellsize});
        const board = draw.group().id("board");

        // Add board labels
        const labels = board.group().id("labels");

        // Rows (numbers)
        for (let row = 0; row < height; row++) {
            const pointL = {x: grid[row][0].x - cellsize, y: grid[row][0].y};
            const pointR = {x: grid[row][grid[row].length - 1].x + cellsize, y: grid[row][grid[row].length - 1].y};
            labels.text(this.columnLabels[height - row - 1] + "1").fill(baseColour).opacity(baseOpacity).center(pointL.x, pointL.y);
            labels.text(this.columnLabels[height - row - 1] + `${grid[row].length}`).fill(baseColour).opacity(baseOpacity).center(pointR.x, pointR.y);
        }

        /*
        Flat-topped hexes:
            half, 0
            (half+width), 0
            (width*2), height
            (half+width), (height*2)
            half, (height*2)
            0, height
        Pointy-topped hexes:
            height, 0
            (height*2), half
            (height*2), (half+width)
            height, (width*2)
            0, (half+width)
            0 half
        */

        // Draw hexes
        const triWidth = cellsize / 2;
        const half = triWidth / 2;
        const triHeight = (triWidth * Math.sqrt(3)) / 2;

        const gridlines = draw.group().id("hexes");
        const hex = draw.defs().polygon(`${triHeight},0 ${triHeight * 2},${half} ${triHeight * 2},${half + triWidth} ${triHeight},${triWidth * 2} 0,${half + triWidth} 0,${half}`)
            .id("_hex")
            .fill("none")
            .stroke({color: baseColour, opacity: baseOpacity, width: baseStroke});
        for (const row of grid) {
            for (const p of row) {
                gridlines.use(hex).center(p.x, p.y);
            }
        }

        return grid;
    }
}
