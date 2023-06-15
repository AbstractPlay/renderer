import { Svg, Use } from "@svgdotjs/svg.js";
import { rectOfRects } from "../grids";
import type { IPoint } from "../grids/_base";
import { APRenderRep } from "../schemas/schema";
import { IRendererOptionsIn, RendererBase } from "./_base";

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
                const note = this.json.annotations.find((n) => n.system === node.name);
                if (note !== undefined) {
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
        let minHeight = 0;
        let maxWidth = 0;
        // Home systems first
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
                minHeight = Math.max(minHeight, svg.height() as number);
            } else {
                maxWidth = Math.max(maxWidth, svg.width() as number);
            }
        });

        // Peripheral systems
        sysPeriph.forEach((sys) => {
            let bordercolour: string | undefined;
            if (sys.highlight !== undefined) {
                bordercolour = this.options.colours[sys.highlight - 1];
            }

            const svg = this.genSystem(`_sysPeriph_${sys.name}`, sys, "H", bordercolour);
            maxWidth = Math.max(maxWidth, svg.width() as number);
        });

        // Now plot those systems on the game board
        // Place peripheral systems first
        const sysSort = (a: ISystem, b: ISystem): number => {
            const aSize = parseInt(a.stars[0][1], 10);
            const bSize = parseInt(b.stars[0][1], 10);
            if (aSize === bSize) {
                return a.name.localeCompare(b.name);
            } else {
                if (aSize < bSize) {
                    return -1;
                } else {
                    return 1;
                }
            }
        }
        const vbuffer = 12.5;
        let yPlace = 0;
        for (const sys of [...sysPeriph].sort(sysSort)) {
            const id = `#_sysPeriph_${sys.name}`;
            const system = this.rootSvg.findOne(id) as Svg;
            if ( (system === null) || (system === undefined) ) {
                throw new Error(`Could not find the requested system (${id}). This should never happen`);
            }
            const width = system.width() as number;
            system.dmove((maxWidth - width) / 2, yPlace);
            yPlace += system.height() as number + vbuffer;
        }

        // shift yPlace if one of the E/W home systems is taller
        if (minHeight > yPlace) {
            yPlace = minHeight;
        }

        // Place home systems
        let minx = 0;
        let maxx = maxWidth;
        let miny = 0;
        let maxy = yPlace;
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
                    x = (maxWidth - width) / 2;
                    y = (vbuffer + height) * -1;
                    miny = y;
                    break;
                case "E":
                    x = maxWidth + vbuffer;
                    maxx = x + width;
                    y = (yPlace - height) / 2;
                    break;
                case "S":
                    x = (maxWidth - width) / 2;
                    y = yPlace + vbuffer;
                    maxy = y + height;
                    break;
                case "W":
                    x = (width + vbuffer) * -1;
                    minx = x;
                    y = (yPlace - height) / 2;
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
        const handler = draw.rect(backWidth, backHeight).id("_void").fill("black").opacity(0).move(backX, backY).back();
        if (this.options.boardClick !== undefined) {
            handler.click((e : Event) => {this.options.boardClick!(-1, -1, `_void`); e.stopPropagation();});
        }
        draw.rect(backWidth, backHeight).id("_backfill").fill("black").move(backX, backY).back();

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
        const stashCellSize = 50;
        const sgrid = rectOfRects({gridWidth: 3, gridHeight: 5, cellHeight: stashCellSize * 2, cellWidth: stashCellSize});
        const cxBox = stashCellSize * 1.75;
        const boxWidth = stashCellSize * 2.5;
        const dxBox = cxBox - (boxWidth / 2);

        const sgroup = this.rootSvg.group().id("stash"); // .size(stashCellSize * 3, stashCellSize * 8);
        sgroup.text("Global Stash").fill("black").center(cxBox, stashCellSize * -1);

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
                let sheetCellSize = piece.viewbox().h;
                if ( (sheetCellSize === null) || (sheetCellSize === undefined) ) {
                    sheetCellSize = piece.attr("data-cellsize") as number;
                    if ( (sheetCellSize === null) || (sheetCellSize === undefined) ) {
                        throw new Error(`The glyph you requested (${ship}) does not contain the necessary information for scaling. Please use a different sheet or contact the administrator.`);
                    }
                }
                const use = sgroup.use(piece);
                if (this.options.boardClick !== undefined) {
                    use.click((e : Event) => {this.options.boardClick!(-1, -1, `${colour}${size}`); e.stopPropagation();});
                }
                const factor = (stashCellSize / sheetCellSize);

                // Shift pieces up 20% to simulate stacking
                const stackingOffset = count * (stashCellSize * 0.2);

                // Shift small and medium pieces down to align the bottoms of the stacks
                // Also account for the width difference to create more even column spacing
                let evenSpacing = 0;
                if (size === "1") {
                    // evenSpacing = 10.9375 * (500 / 180) * factor;
                } else if (size === "2") {
                    evenSpacing = 10.9375 * (500 / 180) * factor;
                }

                const newx = point.x - evenSpacing;
                const newy = point.y - stackingOffset;
                use.dmove(newx, newy);
                use.scale(factor, newx, newy);
            }
            // Add "sacrifice" box
            sgroup.text("SACRIFICE").fill("black").center(cxBox, stashCellSize * 8.35);
            const sacrect = sgroup.rect(boxWidth, stashCellSize * 0.7).id("_sacrificeclick").fill({opacity: 0}).stroke({color: "black", width: 1});
            if (this.options.boardClick !== undefined) {
                sacrect.click(() => this.options.boardClick!(-1, -1, "_sacrifice"));
            }
            sacrect.dmove(dxBox, stashCellSize * 8);
            // Add "pass" box
            sgroup.text("PASS").fill("black").center(cxBox, stashCellSize * 9.05);
            const passrect = sgroup.rect(boxWidth, stashCellSize * 0.7).id("_passclick").fill({opacity: 0}).stroke({color: "black", width: 1});
            if (this.options.boardClick !== undefined) {
                passrect.click(() => this.options.boardClick!(-1, -1, "_pass"));
            }
            passrect.dmove(dxBox, stashCellSize * 8.7);
            // Add "catastrophe" box
            sgroup.text("CATASTROPHE").fill("black").center(cxBox, stashCellSize * 9.75);
            const catrect = sgroup.rect(boxWidth, stashCellSize * 0.7).id("_catastropheclick").fill({opacity: 0}).stroke({color: "black", width: 1});
            if (this.options.boardClick !== undefined) {
                catrect.click(() => this.options.boardClick!(-1, -1, "_catastrophe"));
            }
            catrect.dmove(dxBox, stashCellSize * 9.4);
        }

        sgroup.move(minx - (sgroup.width() as number) - stashCellSize, miny - (((sgroup.height() as number) - (maxy - miny)) / 2));
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
        let realWidth = shipWidth + 1;
        let realHeight = Math.max(shipHeight, sys.stars.length);
        if (orientation === "V") {
            const x = realWidth;
            realWidth = realHeight;
            realHeight = x;
        }
        const cellSize = 50;
        const padding = cellSize / 10;
        const grid = rectOfRects({cellSize, gridHeight: realHeight, gridWidth: realWidth});
        const labelHeight = cellSize / 3;
        const pxWidth = (realWidth * cellSize) + (padding * 2);
        const pxHeight = (realHeight * cellSize) + labelHeight + (padding * 2);
        const realx = 0 - padding;
        const realy = 0 - labelHeight - padding;
        const nested = this.rootSvg!.nested().id(id).size(pxWidth, pxHeight).viewbox(realx, realy, pxWidth, pxHeight);

        // Add fill and border
        let stroke: any = {width: 2, color: "#fff"};
        if (highlight !== undefined) {
            stroke = {width: 5, color: highlight, dasharray: "4"};
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        nested.rect(pxWidth, pxHeight).fill("black").stroke(stroke).dmove(realx, realy);
        if (this.options.boardClick !== undefined) {
            nested.rect(pxWidth, pxHeight).fill("#fff").opacity(0).dmove(realx, realy).click(() => this.options.boardClick!(0, 0, sys.name));
        }

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

        if (orientation === "H") {
            // stars first
            this.placePiece(nested, sys.stars[0], grid[0][0], `${sys.name}|${sys.stars[0]}`);
            if (sys.stars.length > 1) {
                this.placePiece(nested, sys.stars[1], grid[1][0], `${sys.name}|${sys.stars[1]}`);
            }
            // now ships
            for (let y = 0; y < seats.length; y++) {
                const ships = seatMap.filter(e => e[1] === seats[y]).map(e => e[0]);
                for (let x = 0; x < ships.length; x++) {
                    const ship = ships[x];
                    const designation = ship.substring(0, 3);
                    this.placePiece(nested, `${designation}${seats[y]}`, grid[y][x + 1], `${sys.name}|${ship}`)
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
                    const ships = seatMap.filter(e => e[1] === seats[y]).map(e => e[0]);
                    for (let x = 0; x < sys.ships.length; x++) {
                        const ship = ships[x];
                        const designation = ship.substring(0, 3);
                        this.placePiece(nested, `${designation}${seats[y]}`, grid[x + 1][grid[0].length - 1 - y], `${sys.name}|${ship}`)
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
                    const ships = seatMap.filter(e => e[1] === seats[y]).map(e => e[0]);
                    for (let x = 0; x < sys.ships.length; x++) {
                        const ship = ships[x];
                        const designation = ship.substring(0, 3);
                        this.placePiece(nested, `${designation}${seats[y]}`, grid[x + 1][y], `${sys.name}|${ship}`)
                    }
                }
            }
        }

        // Add name
        // nested.text(name).move(grid[0][0].x, grid[0][0].y).fill("#fff");
        let sysLabel = sys.name;
        if (sys.stars.length > 1) {
            sysLabel += ` (${sys.seat!})`;
        }
        const fontsize = labelHeight;
        nested.text(sysLabel)
            .font({
                anchor: "start",
                fill: "#fff",
                size: fontsize,
            })
            .attr("alignment-baseline", "hanging")
            .attr("dominant-baseline", "hanging")
            .move(realx + 5, realy + 2);

        return nested;
    }

    private placePiece(nested: Svg, ship: string, point: IPoint, clickName: string): Use {
        const piece = this.rootSvg!.findOne("#" + ship) as Svg;
        if ( (piece === null) || (piece === undefined) ) {
            throw new Error(`Could not find the requested piece (${ship}). Each piece in the \`pieces\` property *must* exist in the \`legend\`.`);
        }
        let sheetCellSize = piece.viewbox().h;
        if ( (sheetCellSize === null) || (sheetCellSize === undefined) ) {
            sheetCellSize = piece.attr("data-cellsize") as number;
            if ( (sheetCellSize === null) || (sheetCellSize === undefined) ) {
                throw new Error(`The glyph you requested (${ship}) does not contain the necessary information for scaling. Please use a different sheet or contact the administrator.`);
            }
        }
        const use = nested.use(piece);
        const factor = (50 / sheetCellSize);
        use.dmove(point.x, point.y);
        use.scale(factor, point.x, point.y);
        if (this.options.boardClick !== undefined) {
            use.click(() => this.options.boardClick!(0, 0, clickName));
        }
        return use;
    }
}

