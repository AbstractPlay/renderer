import { Box, Svg, Use } from "@svgdotjs/svg.js";
import { rectOfRects } from "../grids";
import type { IPoint } from "../grids/_base";
import { APRenderRep } from "../schemas/schema";
import { IRendererOptionsIn, RendererBase } from "./_base";
import { usePieceAt } from "../common/plotting";

type Seat = "N" | "E" | "S" | "W";

const clockwise: Map<Seat, Seat> = new Map([
    ["N", "E"],
    ["E", "S"],
    ["S", "W"],
    ["W", "N"],
]);

interface ISystem {
    name: string;
    seat?: Seat;
    stars: string[];
    ships: string[];
    highlight?: number;
}

/**
 * This is the Homeworlds-specific renderer that generates the wholly unique images needed for the game.
 *
 */
export class HomeworldsRenderer extends RendererBase {

    public static readonly rendererName: string = "homeworlds";
    private backColour = "#000";
    private contrastColour = "#fff";

    constructor() {
        super();
    }

    public render(json: APRenderRep, draw: Svg, options: IRendererOptionsIn): void {
        this.jsonPrechecks(json);
        if (this.json === undefined) {
            throw new Error("JSON prechecks fatally failed.");
        }
        this.optionsPrecheck(options);
        this.rootSvg = draw;

        // BOARD
        if ( (! Array.isArray(this.json.board)) || ( (this.json.board.length > 0) && (! this.json.board[0].hasOwnProperty("stars")) ) ) {
            throw new Error(`This 'board' schema cannot be handled by the '${ HomeworldsRenderer.rendererName }' renderer.`);
        }

        // `board` and `pieces` array have to be the same length
        if (! Array.isArray(this.json.pieces)) {
            throw new Error("The `pieces` element must be an array.");
        }
        if (this.json.board.length !== this.json.pieces.length) {
            throw new Error("The `board` and `pieces` arrays must be the same length.");
        }

        if ( (this.json.options) && (this.json.options.includes("hw-light")) ) {
            const scratch = this.backColour;
            this.backColour = this.contrastColour;
            this.contrastColour = scratch;
        }

        // Base render should have north at the bottom facing up
        if (this.options.rotate === undefined) {
            this.options.rotate = 180;
        } else {
            this.options.rotate += 180;
        }

        // PIECES
        // Load all the pieces in the legend
        this.loadLegend();

        // Extract the systems and ships and compose them into two groups: home and peripheral
        const sysHome: ISystem[] = [];
        const sysPeriph: ISystem[] = [];
        for (let i = 0; i < this.json.board.length; i++) {
            const sys = this.json.board[i];
            const shps = this.json.pieces[i] as string[];
            const node: ISystem = {
                name: sys.name,
                seat: sys.seat,
                stars: [...sys.stars],
                // tslint:disable-next-line: object-literal-sort-keys
                ships: [...shps],
            };
            if ( ("annotations" in this.json) && (this.json.annotations !== undefined) ) {
                const note = this.json.annotations.find((n) => ("system" in n) && (n.system === node.name));
                if (note !== undefined) {
                    if ( (! ("action" in note)) || (note.action === undefined) ) {
                        throw new Error("Invalid annotation found");
                    }
                    node.highlight = note.action as number;
                }
            }
            if (node.seat !== undefined) {
                sysHome.push(node);
            } else {
                sysPeriph.push(node);
            }
        }

        if (sysHome.length > 4) {
            throw new Error("Too many home systems found. The Homeworlds renderer can only support four players.");
        }

        // Generate each system and add to svg (no more defs because Firefox)
        // Take this opportunity to calculate min/max dimensions for plotting
        // Home systems first
        let minHomeHeight = 0;
        let maxHomeWidth = 0;
        sysHome.forEach((sys) => {
            let bordercolour: string | undefined;
            if (sys.highlight !== undefined) {
                bordercolour = this.options.colours[sys.highlight - 1];
            }
            let orientation: "H"|"V" = "H";
            const seat = HomeworldsRenderer.effectiveSeat(sys.seat!, this.options.rotate);
            if ( (seat === "E") || (seat === "W") ) {
                orientation = "V";
            }

            const svg = this.genSystem(`_sysHome_${sys.seat}`, sys, orientation, bordercolour);
            if (orientation === "V") {
                minHomeHeight = Math.max(minHomeHeight, svg.height() as number);
            } else {
                maxHomeWidth = Math.max(maxHomeWidth, svg.width() as number);
            }
        });

        // Peripheral systems
        const maxPeriphWidths: [number,number,number] = [0,0,0];
        sysPeriph.forEach((sys) => {
            const size = parseInt(sys.stars[0][1], 10);
            let bordercolour: string | undefined;
            if (sys.highlight !== undefined) {
                bordercolour = this.options.colours[sys.highlight - 1];
            }

            const svg = this.genSystem(`_sysPeriph_${sys.name}`, sys, "H", bordercolour);
            maxPeriphWidths[size-1] = Math.max(maxPeriphWidths[size-1], svg.width() as number);
        });

        // Now plot those systems on the game board
        // Place peripheral systems first
        const sysSort = (a: ISystem, b: ISystem): number => {
            const aSize = parseInt(a.stars[0][1], 10);
            const bSize = parseInt(b.stars[0][1], 10);
            return aSize - bSize;
            // if (aSize === bSize) {
            //     return a.name.localeCompare(b.name);
            // } else {
            //     if (aSize < bSize) {
            //         return -1;
            //     } else {
            //         return 1;
            //     }
            // }
        }
        // plot into three columns, one for each size
        const vbuffer = 12.5;
        const hbuffer = 12.5;
        let yPlace = 0;
        let xPlace = 0;
        let maxColumnHeight = 0;
        for (const starSize of [1,2,3]) {
            yPlace = 0;
            const maxWidth = maxPeriphWidths[starSize - 1];
            const systems = [...sysPeriph.filter(s => parseInt(s.stars[0][1], 10) === starSize)].sort(sysSort);
            for (const sys of systems) {
                const id = `#_sysPeriph_${sys.name}`;
                const system = this.rootSvg.findOne(id) as Svg;
                if ( (system === null) || (system === undefined) ) {
                    throw new Error(`Could not find the requested system (${id}). This should never happen`);
                }
                const width = system.width() as number;
                system.dmove(xPlace + ((maxWidth - width) / 2), yPlace);
                yPlace += system.height() as number + vbuffer;
            }
            maxColumnHeight = Math.max(maxColumnHeight, yPlace);
            if (systems.length > 0) {
                xPlace += maxPeriphWidths[starSize - 1] + hbuffer;
            }
        }
        yPlace = maxColumnHeight;

        // Place home systems
        let minx = 0;
        let maxx = Math.max(maxHomeWidth, xPlace);
        const periphWidth = maxx;
        let miny = 0;
        let maxy = Math.max(minHomeHeight, yPlace);
        const periphHeight = maxy;
        sysHome.forEach((sys) => {
            const id = `#_sysHome_${sys.seat}`;
            const system = this.rootSvg!.findOne(id) as Svg;
            if ( (system === null) || (system === undefined) ) {
                throw new Error(`Could not find the requested system (${id}). This should never happen`);
            }
            const width = system.width() as number;
            const height = system.height() as number;

            let x: number;
            let y: number;
            const seat = HomeworldsRenderer.effectiveSeat(sys.seat!, this.options.rotate);
            switch (seat) {
                case "N":
                    x = (periphWidth / 2) - (width / 2);
                    y = miny - (vbuffer + height);
                    miny = y;
                    break;
                case "E":
                    x = periphWidth + hbuffer;
                    maxx = x + width;
                    y = (periphHeight / 2) - (height / 2);
                    break;
                case "S":
                    x = (periphWidth / 2) - (width / 2);
                    y = periphHeight + vbuffer;
                    maxy = y + height;
                    break;
                case "W":
                    x = minx - (width + vbuffer);
                    minx = x;
                    y = (periphHeight / 2) - (height / 2);
                    break;
                default:
                    throw new Error(`Unrecognized seat (${sys.seat}). This should never happen.`);
            }

            system.dmove(x, y);
        });

        // place background click handler
        const backWidth = maxx - minx + (vbuffer * 2);
        const backHeight = maxy - miny + (vbuffer * 2);
        const backX = minx - vbuffer;
        const backY = miny - vbuffer;
        const handler = draw.rect(backWidth, backHeight).id("_void").fill(this.backColour).opacity(0).move(backX, backY).back();
        if (this.options.boardClick !== undefined) {
            handler.click((e : Event) => {this.options.boardClick!(-1, -1, `_void`); e.stopPropagation();});
        }
        draw.rect(backWidth, backHeight).id("_backfill").fill(this.backColour).move(backX, backY).back();

        // Place the stash
        if ( (this.json.areas === undefined) || (! Array.isArray(this.json.areas)) || (this.json.areas.length !== 1) ) {
            throw new Error("One `area` must be defined.");
        }
        if (Array.isArray(this.json.areas[0])) {
            throw new Error("Malformed `areas` definition");
        }
        const stash = this.json.areas[0];
        if ("stack" in stash) {
            throw new Error("Malformed stash. The properties 'R', 'B', 'G', and 'Y' are required.");
        }
        if ( (! stash.hasOwnProperty("R")) || (! stash.hasOwnProperty("B")) || (! stash.hasOwnProperty("G")) || (! stash.hasOwnProperty("Y"))) {
            throw new Error("Malformed stash. The properties 'R', 'B', 'G', and 'Y' are required.");
        }
        const stashCellSize = 35;
        const sgrid = rectOfRects({gridWidth: 3, gridHeight: 5, cellHeight: stashCellSize * 2, cellWidth: stashCellSize});

        const sgroup = this.rootSvg.group().id("stash"); // .size(stashCellSize * 3, stashCellSize * 8);
        let realcx = 0;
        const pcgroup = sgroup.group();
        const colours = ["R", "B", "G", "Y"];
        for (let i = 0; i < colours.length; i++) {
            const colour = colours[i];
            let count = 0;
            let last;
            // @ts-expect-error
            for (const size of stash[colour] as string) {
                if (size !== last) {
                    last = size;
                    count = 0;
                } else {
                    count++;
                }
                const ship = colour + size + "S";
                const point = sgrid[i][parseInt(size, 10) - 1];
                const piece = this.rootSvg.findOne("#p" + ship) as Svg;
                if ( (piece === null) || (piece === undefined) ) {
                    throw new Error(`Could not find the requested piece (${ship}). Each piece in the \`pieces\` property *must* exist in the \`legend\`.`);
                }

                // Shift pieces up 20% to simulate stacking
                const stackingOffset = count * (stashCellSize * 0.2);

                // Shift small and medium pieces down to align the bottoms of the stacks
                // Also account for the width difference to create more even column spacing
                let evenSpacing = 0;
                if (size === "1") {
                    evenSpacing = ((stashCellSize / 2) * 2.1);
                } else if (size === "2") {
                    evenSpacing = (stashCellSize / 2);
                    realcx = point.x + evenSpacing + (stashCellSize * 0.9);
                }

                const newx = point.x + evenSpacing + 0.3 * stashCellSize;
                const newy = point.y - stackingOffset + 0.3 * stashCellSize;
                const use = usePieceAt(pcgroup, piece, stashCellSize, newx, newy, 1);
                if (this.options.boardClick !== undefined) {
                    use.click((e : Event) => {this.options.boardClick!(-1, -1, `${colour}${size}`); e.stopPropagation();});
                }
            }
        }
        const cxBox = realcx;
        const boxWidth = stashCellSize * 2.5;
        const dxBox = cxBox - (boxWidth / 2);

        sgroup.text("Global Stash").fill(this.options.colourContext.strokes).center(cxBox, stashCellSize * -1.25);
        // Add button bar unless told not to
        if ( (! this.json.options) || (! this.json.options.includes("hw-no-buttons")) ) {
            const top = stashCellSize * 7.5;
            const height = stashCellSize * 0.7;
            // Add "sacrifice" box
            sgroup.text("Sacrifice").fill(this.options.colourContext.strokes).center(cxBox, top + (height / 2));
            const sacrect = sgroup.rect(boxWidth, height).id("_sacrificeclick").fill({opacity: 0}).stroke({color: this.options.colourContext.strokes, width: 1});
            if (this.options.boardClick !== undefined) {
                sacrect.click(() => this.options.boardClick!(-1, -1, "_sacrifice"));
            }
            sacrect.dmove(dxBox, top);
            // Add "pass" box
            sgroup.text("Pass").fill(this.options.colourContext.strokes).center(cxBox, top + (height * 1.5));
            const passrect = sgroup.rect(boxWidth, height).id("_passclick").fill({opacity: 0}).stroke({color: this.options.colourContext.strokes, width: 1});
            if (this.options.boardClick !== undefined) {
                passrect.click(() => this.options.boardClick!(-1, -1, "_pass"));
            }
            passrect.dmove(dxBox, top + height);
            // Add "catastrophe" box
            sgroup.text("Catastrophe").fill(this.options.colourContext.strokes).center(cxBox, top + (height * 2.5));
            const catrect = sgroup.rect(boxWidth, height).id("_catastropheclick").fill({opacity: 0}).stroke({color: this.options.colourContext.strokes, width: 1});
            if (this.options.boardClick !== undefined) {
                catrect.click(() => this.options.boardClick!(-1, -1, "_catastrophe"));
            }
            catrect.dmove(dxBox, top + (height * 2));
        }

        sgroup.move(minx - (sgroup.width() as number) - (stashCellSize * 1), miny - (((sgroup.height() as number) - (maxy - miny)) / 2));
        const box = draw.bbox();
        const padding = 2;
        draw.viewbox(box.x - padding, box.y - padding, box.width + (padding * 2), box.height + (padding * 2));
    }

    /**
     * Helper function to determine the width and height of a system based on number of ships.
     *
     * @param sys - The system in question
     */
    private static dimensions(sys: ISystem): [number, number] {
        const seatMap = new Map<string, number>();
        for (const ship of sys.ships) {
            const seat = ship[ship.length - 1];
            if (seatMap.has(seat)) {
                const num = seatMap.get(seat)!;
                seatMap.set(seat, num + 1);
            } else {
                seatMap.set(seat, 1);
            }
        }
        // width, height
        return [Math.max(...seatMap.values()), [...seatMap.keys()].length];
    }

    /**
     * Helper function for determining the new orientation of pieces if the board is rotated.
     *
     * @param seat - Original seat designation
     * @param deg - The amount of rotation in degrees, only in increments of 90
     * @returns The new seat designation given the new perspective
     */
    private static effectiveSeat(seat: Seat, deg?: number): Seat {
        if ( (deg === undefined) || (deg === 0) ) {
            return seat;
        }
        if (deg % 90 !== 0) {
            throw new Error("We can only rotate in 90 degree increments. This error should never happen.");
        }
        const moves = deg / 90;
        let effSeat = seat;
        for (let i = 0; i < moves; i++) {
            effSeat = clockwise.get(effSeat)!;
        }
        return effSeat;
    }

    /**
     * Helper function that generates the individual systems
     *
     * @param id - The DOM ID that will be inserted into the SVG
     * @param name - The name that will be rendered onto the system.
     * @param orientation - Whether the system should be rendered horizontally or vertically.
     * @param highlight - An optional colour to highlight the border with. This is used for the custom annotations.
     * @returns The resulting SVG.js Svg object
     */
    private genSystem(id: string, sys: ISystem, orientation: "H"|"V" = "H", highlight?: string): Svg {
        const [shipWidth, shipHeight] = HomeworldsRenderer.dimensions(sys);
        let gridWidth = Math.max(2, shipWidth + 1);
        let gridHeight = Math.max(shipHeight, sys.stars.length);
        if (orientation === "V") {
            const x = gridWidth;
            gridWidth = gridHeight;
            gridHeight = x;
        }
        const cellSize = 50;
        const grid = rectOfRects({cellSize, gridHeight, gridWidth});
        const nested = this.rootSvg!.nested().id(id);

        let rotation: number | undefined;
        if ( ("rotate" in this.options) && (this.options.rotate !== undefined) ) {
            rotation = this.options.rotate;
        }

        // Add the stars and ships
        // map real ships to their effective seat
        const seatMap: [string,Seat][] = []
        for (const ship of sys.ships) {
            const realSeat = ship[ship.length - 1] as Seat;
            const effSeat = HomeworldsRenderer.effectiveSeat(realSeat, rotation);
            seatMap.push([ship, effSeat]);
        }
        // get list of seats with ships in this system
        const sortSeats = (a: Seat, b: Seat): number => {
            const order: Seat[] = ["S", "N", "W", "E"];
            return order.indexOf(a) - order.indexOf(b);
        }
        const seats = [...new Set<Seat>(seatMap.map(s => s[1]))].sort(sortSeats);

        const pieceSpacing = cellSize / 4;
        if (orientation === "H") {
            // stars first
            this.placePiece(nested, sys.stars[0], grid[0][0], `${sys.name}|${sys.stars[0]}`);
            if (sys.stars.length > 1) {
                this.placePiece(nested, sys.stars[1], grid[1][0], `${sys.name}|${sys.stars[1]}`);
            }
            // now ships
            for (let y = 0; y < seats.length; y++) {
                const ships = seatMap.filter(e => e[1] === seats[y]).map(e => e[0]).sort((a, b) => a.localeCompare(b));
                const used: Box[] = [];
                for (let x = 0; x < ships.length; x++) {
                    const ship = ships[x];
                    const designation = ship.substring(0, 3);
                    const [use, factor] = this.placePiece(nested, `${designation}${seats[y]}`, grid[y][x + 1], `${sys.name}|${ship}`);
                    // pack it
                    if (used.length > 0) {
                        const prev = used[used.length - 1];
                        const curr = use.rbox();
                        let dist = 0;
                        if (curr.w < cellSize) {
                            dist = prev.x2 - curr.x + pieceSpacing;
                            use.dx(dist / factor);
                        }
                    }
                    used.push(use.rbox());
                }
            }
        } else {
            const effSeat = HomeworldsRenderer.effectiveSeat(sys.seat!, rotation);
            if (effSeat === "W") {
                // stars first
                this.placePiece(nested, sys.stars[0], grid[0][grid[0].length - 1], `${sys.name}|${sys.stars[0]}`);
                if (sys.stars.length > 1) {
                    this.placePiece(nested, sys.stars[1], grid[0][grid[0].length - 2], `${sys.name}|${sys.stars[1]}`);
                }
                // now ships
                for (let y = 0; y < seats.length; y++) {
                    const ships = seatMap.filter(e => e[1] === seats[y]).map(e => e[0]).sort((a, b) => a.localeCompare(b));
                    const used: Box[] = [];
                    for (let x = 0; x < sys.ships.length; x++) {
                        const ship = ships[x];
                        const designation = ship.substring(0, 3);
                        const [use, factor] = this.placePiece(nested, `${designation}${seats[y]}`, grid[x + 1][grid[0].length - 1 - y], `${sys.name}|${ship}`)
                        // pack it
                        if (used.length > 0) {
                            const prev = used[used.length - 1];
                            const curr = use.rbox();
                            let dist = 0;
                            if (curr.w < cellSize) {
                                dist = prev.y2 - curr.y + pieceSpacing;
                                use.dy(dist / factor);
                            }
                        }
                        used.push(use.rbox());
                    }
                }
            } else {
                // stars first
                this.placePiece(nested, sys.stars[0], grid[0][0], `${sys.name}|${sys.stars[0]}`);
                if (sys.stars.length > 1) {
                    this.placePiece(nested, sys.stars[1], grid[0][1], `${sys.name}|${sys.stars[1]}`);
                }
                // now ships
                for (let y = 0; y < seats.length; y++) {
                    const ships = seatMap.filter(e => e[1] === seats[y]).map(e => e[0]).sort((a, b) => a.localeCompare(b));
                    const used: Box[] = [];
                    for (let x = 0; x < sys.ships.length; x++) {
                        const ship = ships[x];
                        const designation = ship.substring(0, 3);
                        const [use, factor] = this.placePiece(nested, `${designation}${seats[y]}`, grid[x + 1][y], `${sys.name}|${ship}`)
                        // pack it
                        if (used.length > 0) {
                            const prev = used[used.length - 1];
                            const curr = use.rbox();
                            let dist = 0;
                            if (curr.w < cellSize) {
                                dist = prev.y2 - curr.y + pieceSpacing;
                                use.dy(dist / factor);
                            }
                        }
                        used.push(use.rbox());
                    }
                }
            }
        }

        // now calculate the true size and vbox
        const bbox = nested.bbox();
        const labelHeight = cellSize / 3;
        const padding = cellSize / 9;
        const realX = bbox.x - padding;
        const realY = bbox.y - padding - labelHeight;
        const realWidth = bbox.w + (padding * 2);
        const realHeight = bbox.h + (padding * 2) + labelHeight;
        nested.size(realWidth, realHeight).viewbox(realX - 2, realY - 2, realWidth + 4, realHeight + 4);

        // Add fill and border
        let stroke: any = {width: 2, color: this.contrastColour};
        if (highlight !== undefined) {
            stroke = {width: 5, color: highlight, dasharray: "4"};
        }
        if (this.options.boardClick !== undefined) {
            nested.rect(realWidth, realHeight).fill(this.contrastColour).opacity(0).dmove(realX, realY).back().click(() => this.options.boardClick!(0, 0, sys.name));
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        nested.rect(realWidth, realHeight).fill(this.backColour).stroke(stroke).dmove(realX, realY).back();

        // Add name
        // nested.text(name).move(grid[0][0].x, grid[0][0].y).fill("#fff");
        let sysLabel = sys.name;
        if ( (sys.stars.length > 1) && ("seat" in sys) && (sys.seat !== undefined) ) {
            sysLabel += ` (${sys.seat})`;
        }
        const fontsize = labelHeight;
        nested.text(sysLabel)
            .font({
                anchor: "start",
                fill: this.contrastColour,
                size: fontsize,
            })
            .attr("alignment-baseline", "hanging")
            .attr("dominant-baseline", "hanging")
            .move(realX + 5, realY + 2);

        return nested;
    }

    private placePiece(nested: Svg, ship: string, point: IPoint, clickName: string): [Use, number] {
        const piece = this.rootSvg!.findOne("#" + ship) as Svg;
        if ( (piece === null) || (piece === undefined) ) {
            throw new Error(`Could not find the requested piece (${ship}). Each piece in the \`pieces\` property *must* exist in the \`legend\`.`);
        }
        const cellsize = 50;
        const use = usePieceAt(nested, piece, cellsize, point.x + cellsize / 2, point.y + cellsize / 2, 1);
        if (this.options.boardClick !== undefined) {
            use.click(() => this.options.boardClick!(0, 0, clickName));
        }
        return [use, cellsize / 500];
    }
}

