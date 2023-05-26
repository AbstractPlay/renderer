import { Svg } from "@svgdotjs/svg.js";
import { rectOfRects } from "../grids";
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
                if (node.ships.length > 16) {
                    throw new Error("Too many ships. This renderer can only accommodate 16 ships per home system.");
                }
                sysHome.push(node);
            } else {
                if (node.ships.length > 24) {
                    throw new Error("Too many ships. This renderer can only accommodate 24 ships per peripheral system.");
                }
                sysPeriph.push(node);
            }
        }

        if (sysHome.length > 4) {
            throw new Error("Too many home systems found. The Homeworlds renderer can only support four players.");
        }

        // Generate each system and add to defs
        const portsHome: Map<string, [number, number][]> = new Map([
            ["N", [[ 4, 0 ], [ 3, 0 ], [ 2, 0 ], [ 1, 0 ], [ 0, 0 ], [ 4, 1 ], [ 0, 1 ], [ 4, 2 ], [ 0, 2 ], [ 4, 3 ], [ 0, 3 ], [ 4, 4 ], [ 3, 4 ], [ 2, 4 ], [ 1, 4 ], [ 0, 4 ]]],
            ["S", [[ 0, 4 ], [ 1, 4 ], [ 2, 4 ], [ 3, 4 ], [ 4, 4 ], [ 0, 3 ], [ 4, 3 ], [ 0, 2 ], [ 4, 2 ], [ 0, 1 ], [ 4, 1 ], [ 0, 0 ], [ 1, 0 ], [ 2, 0 ], [ 3, 0 ], [ 4, 0 ]]],
            ["E", [[ 4, 4 ], [ 4, 3 ], [ 4, 2 ], [ 4, 1 ], [ 4, 0 ], [ 3, 4 ], [ 3, 0 ], [ 2, 4 ], [ 2, 0 ], [ 1, 4 ], [ 1, 0 ], [ 0, 4 ], [ 0, 3 ], [ 0, 2 ], [ 0, 1 ], [ 0, 0 ]]],
            ["W", [[ 0, 0 ], [ 0, 1 ], [ 0, 2 ], [ 0, 3 ], [ 0, 4 ], [ 1, 0 ], [ 1, 4 ], [ 2, 0 ], [ 2, 4 ], [ 3, 0 ], [ 3, 4 ], [ 4, 0 ], [ 4, 1 ], [ 4, 2 ], [ 4, 3 ], [ 4, 4 ]]],
        ]);
        const portsPeriph: Map<string, [number, number][]> = new Map([
            ["N", [[ 4, 0 ], [ 3, 0 ], [ 2, 0 ], [ 1, 0 ], [ 0, 0 ], [ 4, 1 ], [ 3, 1 ], [ 2, 1 ], [ 1, 1 ], [ 0, 1 ], [ 4, 2 ], [ 3, 2 ], [ 1, 2 ], [ 0, 2 ], [ 4, 3 ], [ 3, 3 ], [ 2, 3 ], [ 1, 3 ], [ 0, 3 ], [ 4, 4 ], [ 3, 4 ], [ 2, 4 ], [ 1, 4 ], [ 0, 4 ]]],
            ["S", [[ 0, 4 ], [ 1, 4 ], [ 2, 4 ], [ 3, 4 ], [ 4, 4 ], [ 0, 3 ], [ 1, 3 ], [ 2, 3 ], [ 3, 3 ], [ 4, 3 ], [ 0, 2 ], [ 1, 2 ], [ 3, 2 ], [ 4, 2 ], [ 0, 1 ], [ 1, 1 ], [ 2, 1 ], [ 3, 1 ], [ 4, 1 ], [ 0, 0 ], [ 1, 0 ], [ 2, 0 ], [ 3, 0 ], [ 4, 0 ]]],
            ["E", [[ 4, 4 ], [ 4, 3 ], [ 4, 2 ], [ 4, 1 ], [ 4, 0 ], [ 3, 4 ], [ 3, 3 ], [ 3, 2 ], [ 3, 1 ], [ 3, 0 ], [ 2, 4 ], [ 2, 3 ], [ 2, 1 ], [ 2, 0 ], [ 1, 4 ], [ 1, 3 ], [ 1, 2 ], [ 1, 1 ], [ 1, 0 ], [ 0, 4 ], [ 0, 3 ], [ 0, 2 ], [ 0, 1 ], [ 0, 0 ]]],
            ["W", [[ 0, 0 ], [ 0, 1 ], [ 0, 2 ], [ 0, 3 ], [ 0, 4 ], [ 1, 0 ], [ 1, 1 ], [ 1, 2 ], [ 1, 3 ], [ 1, 4 ], [ 2, 0 ], [ 2, 1 ], [ 2, 3 ], [ 2, 4 ], [ 3, 0 ], [ 3, 1 ], [ 3, 2 ], [ 3, 3 ], [ 3, 4 ], [ 4, 0 ], [ 4, 1 ], [ 4, 2 ], [ 4, 3 ], [ 4, 4 ]]],
        ]);
        const orbits: Array<[[number, number], [number, number]]> = [
            [[1, 1], [3, 3]], [[2, 1], [2, 3]], [[3, 1], [1, 3]], [[1, 2], [3, 2]],
            [[3, 3], [1, 1]], [[2, 3], [2, 1]], [[1, 3], [3, 1]], [[3, 2], [1, 2]],
        ];

        // Home systems first
        sysHome.forEach((sys) => {
            // Distribute stars and ships to valid ports
            const ports: (string|undefined)[][] = [
                [undefined, undefined, undefined, undefined, undefined],
                [undefined, undefined, undefined, undefined, undefined],
                [undefined, undefined, undefined, undefined, undefined],
                [undefined, undefined, undefined, undefined, undefined],
                [undefined, undefined, undefined, undefined, undefined],
            ];
            const orbit = orbits[Math.floor(Math.random() * orbits.length)];
            for (let i = 0; i < sys.stars.length; i++) {
                ports[orbit[i][1]][orbit[i][0]] = sys.stars[i];
            }
            sys.ships.forEach((s) => {
                const seat = s[s.length - 1];
                // Adjust seat based on rotation
                const effSeat = this.effectiveSeat(seat as Seat, this.options.rotate);
                const ps = portsHome.get(effSeat);
                if (ps === undefined) {
                    throw new Error(`Could not find port list for seat '${effSeat}'. This should never happen.`);
                }
                for (const p of ps) {
                    if (ports[p[1]][p[0]] === undefined) {
                        ports[p[1]][p[0]] = s;
                        break;
                    }
                }
            });
            let bordercolour: string | undefined;
            if (sys.highlight !== undefined) {
                bordercolour = this.options.colours[sys.highlight - 1];
            }

            this.genSystem(`_sysHome_${sys.seat}`, `${sys.name} (${sys.seat})`, ports, bordercolour);
        });

        // Peripheral systems
        sysPeriph.forEach((sys) => {
            // Distribute stars and ships to valid ports
            const ports: (string|undefined)[][] = [
                [undefined, undefined, undefined, undefined, undefined],
                [undefined, undefined, undefined, undefined, undefined],
                [undefined, undefined, sys.stars[0], undefined, undefined],
                [undefined, undefined, undefined, undefined, undefined],
                [undefined, undefined, undefined, undefined, undefined],
            ];
            sys.ships.forEach((s) => {
                const seat = s[s.length - 1];
                // Adjust seat based on rotation
                const effSeat = this.effectiveSeat(seat as Seat, this.options.rotate);
                const ps = portsPeriph.get(effSeat);
                if (ps === undefined) {
                    throw new Error(`Could not find port list for seat '${effSeat}'. This should never happen.`);
                }
                for (const p of ps) {
                    if (ports[p[1]][p[0]] === undefined) {
                        ports[p[1]][p[0]] = s;
                        break;
                    }
                }
            });
            let bordercolour: string | undefined;
            if (sys.highlight !== undefined) {
                bordercolour = this.options.colours[sys.highlight - 1];
            }

            this.genSystem(`_sysPeriph_${sys.name}`, sys.name, ports, bordercolour);
        });

        // Now plot those systems on the game board
        // Calc number of peripheral rows and columns
        let pcols: number;
        let prows: number;
        const numPeriph = sysPeriph.length; // + 1;
        if (numPeriph === 0) {
            pcols = 1;
            prows = 1;
        // If the number is a perfect square...
        } else if (Math.sqrt(numPeriph) / Math.floor(Math.sqrt(numPeriph)) === 1) {
            pcols = Math.floor(Math.sqrt(numPeriph));
            prows = pcols;
        } else {
            pcols = 2;
            prows = 1;
            while (prows * pcols < numPeriph) {
                if (Math.abs(prows - pcols) === 1) {
                    prows++;
                } else {
                    pcols++;
                }
            }
        }
        const grid = rectOfRects({cellSize: 250, gridHeight: prows, gridWidth: pcols});

        // Place peripheral systems first
        // const group = this.rootSvg.group().id("systems");
        for (let row = 0; row < prows; row++) {
            for (let col = 0; col < pcols; col++) {
                const idx = (pcols * row) + col;
                if (idx >= sysPeriph.length) {
                    continue;
                }
                const sys = sysPeriph[idx];
                const point = grid[row][col];
                const id = `#_sysPeriph_${sys.name}`;
                const system = this.rootSvg.findOne(id) as Svg;
                if ( (system === null) || (system === undefined) ) {
                    throw new Error(`Could not find the requested system (${id}). This should never happen`);
                }
                // const use = group.use(system) as SVGG;
                system.dmove(point.x, point.y);
            }
        }

        // Place home systems
        sysHome.forEach((sys) => {
            let x: number;
            let y: number;
            const seat = this.effectiveSeat(sys.seat!, this.options.rotate);
            switch (seat) {
                case "N":
                    x = ((pcols * 250) / 2) - 125;
                    y = -250;
                    break;
                case "E":
                    x = pcols * 250;
                    y = ((prows * 250) / 2) - 125;
                    break;
                case "S":
                    x = ((pcols * 250) / 2) - 125;
                    y = prows * 250;
                    break;
                case "W":
                    x = -250;
                    y = ((prows * 250) / 2) - 125;
                    break;
                default:
                    throw new Error(`Unrecognized seat (${sys.seat}). This should never happen.`);
            }
            const id = `#_sysHome_${sys.seat}`;
            const system = this.rootSvg!.findOne(id) as Svg;
            if ( (system === null) || (system === undefined) ) {
                throw new Error(`Could not find the requested system (${id}). This should never happen`);
            }
            // const use = group.use(system);
            system.dmove(x, y);
        });

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
        const stashCellSize = 75;
        const sgrid = rectOfRects({gridWidth: 3, gridHeight: 5, cellHeight: stashCellSize * 2, cellWidth: stashCellSize});
        const sgroup = this.rootSvg.group().id("stash"); // .size(stashCellSize * 3, stashCellSize * 8);
        sgroup.text("Global Stash").fill("black").move(0, stashCellSize * -1);

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
            sgroup.text("SACRIFICE").fill("black").center(stashCellSize * 1.25, stashCellSize * 8.35);
            const sacrect = sgroup.rect(stashCellSize * 2.5, stashCellSize * 0.7).id("_sacrificeclick").fill({opacity: 0}).stroke({color: "black", width: 1});
            if (this.options.boardClick !== undefined) {
                sacrect.click(() => this.options.boardClick!(-1, -1, "_sacrifice"));
            }
            sacrect.dy(stashCellSize * 8);
            // Add "pass" box
            sgroup.text("PASS").fill("black").center(stashCellSize * 1.25, stashCellSize * 9.05);
            const passrect = sgroup.rect(stashCellSize * 2.5, stashCellSize * 0.7).id("_passclick").fill({opacity: 0}).stroke({color: "black", width: 1});
            if (this.options.boardClick !== undefined) {
                passrect.click(() => this.options.boardClick!(-1, -1, "_pass"));
            }
            passrect.dy(stashCellSize * 8.7);
            // Add "catastrophe" box
            sgroup.text("CATASTROPHE").fill("black").center(stashCellSize * 1.25, stashCellSize * 9.75);
            const catrect = sgroup.rect(stashCellSize * 2.5, stashCellSize * 0.7).id("_catastropheclick").fill({opacity: 0}).stroke({color: "black", width: 1});
            if (this.options.boardClick !== undefined) {
                catrect.click(() => this.options.boardClick!(-1, -1, "_catastrophe"));
            }
            catrect.dy(stashCellSize * 9.4);
        }
        sgroup.move((250 + (sgroup.width() as number) + 10) * -1, -250);
        const box = draw.bbox();
        draw.viewbox(box.x - 2, box.y - 2, 250 * (pcols + 1) - box.x + 4, box.height + 4);
    }

    /**
     * Helper function for determining the new orientation of pieces if the board is rotated.
     *
     * @param seat - Original seat designation
     * @param deg - The amount of rotation in degrees, only in increments of 90
     * @returns The new seat designation given the new perspective
     */
    private effectiveSeat(seat: Seat, deg?: number): Seat {
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
        if (effSeat === undefined) {
            throw new Error(`Effective seat is undefined. This should never happen.\nSeat: ${seat}, Rotation: ${deg}`);
        }
        return effSeat;
    }

    /**
     * Helper function that generates the individual systems
     *
     * @param id - The DOM ID that will be inserted into the SVG
     * @param name - The name that will be rendered onto the system.
     * @param ports - The x/y coordinates of the various ports in the system.
     * @param highlight - An optional colour to highlight the border with. This is used for the custom annotations.
     * @returns The resulting SVG.js Svg object
     */
    private genSystem(id: string, name: string, ports: (string|undefined)[][], highlight?: string): Svg {
        const grid = rectOfRects({cellSize: 50, gridHeight: 5, gridWidth: 5});
        const nested = this.rootSvg!.nested().id(id).size(250, 250).viewbox(0, 0, 250, 250);

        // Add fill and border
        // This does increase the size of the generated SVG because of the unique star patterns (150+ KB depending on number of systems).
        // If size is a problem, this could be deleted and just fill the nested `rect` with `black` instead of `pattern`.
        const pattern = this.rootSvg!.pattern(250, 250, (add) => {
            add.rect(250, 250).fill("black");
            // Add 250 stars
            const n = Math.floor(Math.random() * 100) + 150;
            for (let i = 0; i < n; i++) {
                const r = Math.floor(Math.random() * (250 * 250));
                const y = Math.floor(r / 250);
                const x = r % 250;
                add.circle(Math.random() + 1).center(x, y).fill("white");
            }
        });
        let stroke: any = {width: 2, color: "#fff"};
        if (highlight !== undefined) {
            stroke = {width: 5, color: highlight, dasharray: "4"};
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        nested.rect(250, 250).fill(pattern).stroke(stroke);
        if (this.options.boardClick !== undefined) {
            nested.rect(250, 250).fill("#fff").opacity(0).click(() => this.options.boardClick!(0, 0, name));
        }

        let rotation: number | undefined;
        if ( ("rotate" in this.options) && (this.options.rotate !== undefined) ) {
            rotation = this.options.rotate;
        }

        // Add the stars and ships
        for (let row = 0; row < 5; row++) {
            for (let col = 0; col < 5; col++) {
                if (ports[row][col] !== undefined) {
                    const cell = ports[row][col]!;
                    let ship = cell;
                    // If a ship, adjust owner based on rotation
                    if (cell.length === 4) {
                        const owner = cell[3];
                        const newowner: Seat = this.effectiveSeat(owner as Seat, rotation);
                        ship = cell.slice(0, 3) + newowner;
                    }
                    const point = grid[row][col];
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
                        use.click(() => this.options.boardClick!(0, 0, `${name}|${cell}`));
                    }
                }
            }
        }

        // Add name
        // nested.text(name).move(grid[0][0].x, grid[0][0].y).fill("#fff");
        const fontsize = 12;
        nested.text(name)
            .font({
                anchor: "start",
                fill: "#fff",
                size: fontsize,
            })
            .attr("alignment-baseline", "hanging")
            .attr("dominant-baseline", "hanging")
            .move(5, 5);

        return nested;
    }
}
