import { BoardBasic } from "../schemas/schema";
import { GridPoints, IPoint, IPolyPolygon } from "../grids";
import { RendererBase } from "../renderers/_base";
import tinycolor from "tinycolor2";
import { centroid } from "../common/plotting";

export const dvgc = (ctx: RendererBase): [GridPoints, IPolyPolygon[][]] => {
    if ( ctx.json === undefined || ctx.json === null || ctx.rootSvg === undefined ) {
        throw new Error("Object in an invalid state!");
    }

    // Check required properties
    if (ctx.json.board === undefined || ctx.json.board === null) {
        throw new Error("Object in an invalid state!");
    }
    ctx.json.board = ctx.json.board as BoardBasic;
    // const cellsize = ctx.cellsize;

    let baseStroke = 1;
    let baseColour = ctx.options.colourContext.strokes;
    let baseOpacity = 1;
    if ( ("strokeWeight" in ctx.json.board) && (ctx.json.board.strokeWeight !== undefined) ) {
        baseStroke = ctx.json.board.strokeWeight;
    }
    if ( ("strokeColour" in ctx.json.board) && (ctx.json.board.strokeColour !== undefined) ) {
        baseColour = ctx.resolveColour(ctx.json.board.strokeColour) as string;
    }
    if ( ("strokeOpacity" in ctx.json.board) && (ctx.json.board.strokeOpacity !== undefined) ) {
        baseOpacity = ctx.json.board.strokeOpacity;
    }

    // build the list of polys
    // just do it manually; it's a fixed size
    const polys: IPolyPolygon[][] = [
        [
            {
                type: "poly",
                points: [
                    {x: 0, y: 0},
                    {x: 150, y: 0},
                    {x: 150, y: 50},
                    {x: 0, y: 50},
                ]
            },
            {
                type: "poly",
                points: [
                    {x: 150, y: 0},
                    {x: 300, y: 0},
                    {x: 300, y: 50},
                    {x: 150, y: 50},
                ]
            },
            {
                type: "poly",
                points: [
                    {x: 300, y: 0},
                    {x: 450, y: 0},
                    {x: 450, y: 50},
                    {x: 300, y: 50},
                ]
            },
            {
                type: "poly",
                points: [
                    {x: 400, y: 50},
                    {x: 450, y: 50},
                    {x: 450, y: 150},
                    {x: 400, y: 150},
                ]
            },
            {
                type: "poly",
                points: [
                    {x: 400, y: 150},
                    {x: 450, y: 150},
                    {x: 450, y: 250},
                    {x: 400, y: 250},
                ]
            },
            {
                type: "poly",
                points: [
                    {x: 300, y: 250},
                    {x: 450, y: 250},
                    {x: 450, y: 300},
                    {x: 300, y: 300},
                ]
            },
            {
                type: "poly",
                points: [
                    {x: 150, y: 250},
                    {x: 300, y: 250},
                    {x: 300, y: 300},
                    {x: 150, y: 300},
                ]
            },
            {
                type: "poly",
                points: [
                    {x: 0, y: 250},
                    {x: 150, y: 250},
                    {x: 150, y: 300},
                    {x: 0, y: 300},
                ]
            },
            {
                type: "poly",
                points: [
                    {x: 0, y: 150},
                    {x: 50, y: 150},
                    {x: 50, y: 250},
                    {x: 0, y: 250},
                ]
            },
            {
                type: "poly",
                points: [
                    {x: 0, y: 50},
                    {x: 50, y: 50},
                    {x: 50, y: 150},
                    {x: 0, y: 150},
                ]
            },
        ],
        [
            {
                type: "poly",
                points: [
                    {x: 50, y: 50},
                    {x: 125, y: 50},
                    {x: 125, y: 100},
                    {x: 50, y: 100},
                ]
            },
            {
                type: "poly",
                points: [
                    {x: 125, y: 50},
                    {x: 225, y: 50},
                    {x: 225, y: 100},
                    {x: 125, y: 100},
                ]
            },
            {
                type: "poly",
                points: [
                    {x: 225, y: 50},
                    {x: 325, y: 50},
                    {x: 325, y: 100},
                    {x: 225, y: 100},
                ]
            },
            {
                type: "poly",
                points: [
                    {x: 325, y: 50},
                    {x: 400, y: 50},
                    {x: 400, y: 100},
                    {x: 325, y: 100},
                ]
            },
            {
                type: "poly",
                points: [
                    {x: 350, y: 100},
                    {x: 400, y: 100},
                    {x: 400, y: 200},
                    {x: 350, y: 200},
                ]
            },
            {
                type: "poly",
                points: [
                    {x: 325, y: 200},
                    {x: 400, y: 200},
                    {x: 400, y: 250},
                    {x: 325, y: 250},
                ]
            },
            {
                type: "poly",
                points: [
                    {x: 225, y: 200},
                    {x: 325, y: 200},
                    {x: 325, y: 250},
                    {x: 225, y: 250},
                ]
            },
            {
                type: "poly",
                points: [
                    {x: 125, y: 200},
                    {x: 225, y: 200},
                    {x: 225, y: 250},
                    {x: 125, y: 250},
                ]
            },
            {
                type: "poly",
                points: [
                    {x: 50, y: 200},
                    {x: 125, y: 200},
                    {x: 125, y: 250},
                    {x: 50, y: 250},
                ]
            },
            {
                type: "poly",
                points: [
                    {x: 50, y: 100},
                    {x: 100, y: 100},
                    {x: 100, y: 200},
                    {x: 50, y: 200},
                ]
            },
        ],
        [
            {
                type: "poly",
                points: [
                    {x: 100, y: 100},
                    {x: 150, y: 100},
                    {x: 150, y: 150},
                    {x: 100, y: 150},
                ]
            },
            {
                type: "poly",
                points: [
                    {x: 150, y: 100},
                    {x: 200, y: 100},
                    {x: 200, y: 150},
                    {x: 150, y: 150},
                ]
            },
            {
                type: "poly",
                points: [
                    {x: 200, y: 100},
                    {x: 250, y: 100},
                    {x: 250, y: 150},
                    {x: 200, y: 150},
                ]
            },
            {
                type: "poly",
                points: [
                    {x: 250, y: 100},
                    {x: 300, y: 100},
                    {x: 300, y: 150},
                    {x: 250, y: 150},
                ]
            },
            {
                type: "poly",
                points: [
                    {x: 300, y: 100},
                    {x: 350, y: 100},
                    {x: 350, y: 150},
                    {x: 300, y: 150},
                ]
            },
            {
                type: "poly",
                points: [
                    {x: 300, y: 150},
                    {x: 350, y: 150},
                    {x: 350, y: 200},
                    {x: 300, y: 200},
                ]
            },
            {
                type: "poly",
                points: [
                    {x: 250, y: 150},
                    {x: 300, y: 150},
                    {x: 300, y: 200},
                    {x: 250, y: 200},
                ]
            },
            {
                type: "poly",
                points: [
                    {x: 200, y: 150},
                    {x: 250, y: 150},
                    {x: 250, y: 200},
                    {x: 200, y: 200},
                ]
            },
            {
                type: "poly",
                points: [
                    {x: 150, y: 150},
                    {x: 200, y: 150},
                    {x: 200, y: 200},
                    {x: 150, y: 200},
                ]
            },
            {
                type: "poly",
                points: [
                    {x: 100, y: 150},
                    {x: 150, y: 150},
                    {x: 150, y: 200},
                    {x: 100, y: 200},
                ]
            },
        ],
    ];

    // build the final grid of points from the centroids of the polys
    const grid: GridPoints = [];
    for (const row of polys) {
        const rowNode: IPoint[] = [];
        for (const poly of row) {
            rowNode.push(centroid(poly.points)!)
        }
        grid.push(rowNode);
    }

    // now render the board
    const board = ctx.rootSvg.group().id("board");
    const gridlines = board.group().id("cells");

    ctx.markBoard({svgGroup: gridlines, preGridLines: true, grid, polys});

    for (let iRow = 0; iRow < polys.length; iRow++) {
        for (let iCol = 0; iCol < polys[iRow].length; iCol++) {
            const c = gridlines.polygon(polys[iRow][iCol].points.map(pt => `${pt.x},${pt.y}`).join(" "))
                                .stroke({color: baseColour, opacity: baseOpacity, width: baseStroke, linecap: "round", linejoin: "round"});

            // fill cells appropriately
            // If the background colour is lighter than the fill colour, then light tiles are fully transparent, and dark tiles are 75% transparent.
            // If the background colour is darker than the fill colour (dark mode), then light tiles are 75% transparent and dark tiles are fully transparent.
            // darker cells
            const cBg = tinycolor(ctx.options.colourContext.background);
            const cFill = tinycolor(ctx.options.colourContext.fill);

            if ( (iRow === 0 && [0,2,6].includes(iCol)) || (iRow === 1 && [1,3,6,8].includes(iCol)) || (iRow === 2 && [0,2,4,6,8].includes(iCol)) ) {
                if (ctx.json.board.style === "dvgc-checkered") {
                    if (cBg.getLuminance() > cFill.getLuminance()) {
                        c.fill({color: ctx.options.colourContext.fill, opacity: baseOpacity * 0.25});
                    } else {
                        c.fill({color: ctx.options.colourContext.background, opacity: 0})
                    }
                } else {
                    c.fill({color: ctx.options.colourContext.background, opacity: 0})
                }
            }
            // forest
            else if ( (iRow === 0 && [3,4,8,9].includes(iCol)) || (iRow === 1 && [4,9].includes(iCol)) ) {
                c.fill({color: "#228b22", opacity: baseOpacity * 0.25});
            }
            // light cells
            else {
                if (ctx.json.board.style === "dvgc-checkered") {
                    if (cBg.getLuminance() > cFill.getLuminance()) {
                        c.fill({color: ctx.options.colourContext.background, opacity: 0})
                    } else {
                        c.fill({color: ctx.options.colourContext.fill, opacity: baseOpacity * 0.25});
                    }
                } else {
                    c.fill({color: ctx.options.colourContext.background, opacity: 0})
                }
            }

            if (ctx.options.boardClick !== undefined) {
                c.click(() => ctx.options.boardClick!(iRow, iCol, ""));
            }
        }
    }

    ctx.markBoard({svgGroup: gridlines, preGridLines: false, grid, polys});

    return [grid, polys];
}
