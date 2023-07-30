import { projectPoint } from "../common/plotting";
import { GridPoints, IGeneratorArgs, IPoint } from "./_base";

export interface ICobwebArgs extends IGeneratorArgs {
    straight?: boolean;
    start?: number;
}

/**
 * Generates a circular cobweb field. This function returns the centroids of each space.
 *
 * @param args - Generator options
 * @returns Map of x,y coordinates to row/column locations
 */
export const cobweb = (args: ICobwebArgs): GridPoints => {
    const polys = cobwebPolys(args);
    const grid: GridPoints = [];
    for (let row = 0; row < polys.length - 1; row++) {
        const slice = polys[row];
        const node: IPoint[] = [];
        for (const poly of slice) {
            if (poly.type === "circle") {
                node.push({x: poly.cx, y: poly.cy});
            } else {
                // If it's an outer space, we need to bias the point further outward
                // Indices 1 and 2 are the "top" left and right points
                // Duplicate them to bias the average outwards
                const pts: IPoint[] = [...poly.points];
                if (row === 0) {
                    pts.push(poly.points[1]);
                    pts.push(poly.points[2]);
                    pts.push(poly.points[1]);
                    pts.push(poly.points[2]);
                    pts.push(poly.points[1]);
                    pts.push(poly.points[2]);
                }
                const cx = pts.reduce((prev, curr) => prev += curr.x, 0) / pts.length;
                const cy = pts.reduce((prev, curr) => prev += curr.y, 0) / pts.length;
                node.push({x: cx, y: cy});
            }
        }
        grid.push(node);
    }
    grid.push([{x: 0, y: 0}]);

    return grid;
}

interface ICobwebPath {
    type: "path";
    path: string;
    points: IPoint[];
}
interface ICobwebPolygon {
    type: "poly";
    points: IPoint[];
}
interface ICobwebCircle {
    type: "circle";
    cx: number;
    cy: number;
    r: number;
}
export type CobwebPoly = ICobwebCircle|ICobwebPolygon|ICobwebPath;

export const cobwebPolys = (args: ICobwebArgs): CobwebPoly[][] => {
    let cellSize = 50;
    if (args.cellSize !== undefined) {
        cellSize = args.cellSize;
    }

    let gridHeight = 4;
    let gridWidth = 8;
    if (args.gridHeight !== undefined) {
        gridHeight = args.gridHeight;
    }
    if (args.gridWidth !== undefined) {
        gridWidth = args.gridWidth;
    }
    let straight = true;
    if (args.straight !== undefined) {
        straight = args.straight;
    }
    let start = 0;
    if (args.start !== undefined) {
        start = args.start;
    }

    const innerR = cellSize / 2;
    const webR = gridHeight * cellSize;
    const outerR = innerR + webR;

    // First generate a list of intersection points for each line
    // Each line has the same distribution of points
    const dists: number[] = [innerR];
    for (let i = 1; i < gridHeight; i++) {
        dists.push(innerR + (cellSize * i));
        dists.push(innerR + (cellSize * (i + 0.5)));
    }
    dists.push(outerR);
    const pts: IPoint[][] = [];
    const phi = 360 / gridWidth;
    for (let i = 0; i < gridWidth; i++) {
        const line: IPoint[] = [];
        const angle = start + (phi * i);
        for (const dist of dists) {
            const [x,y] = projectPoint(0, 0, dist, angle);
            line.push({x,y})
        }
        pts.push(line);
    }
    // wrap the lines around
    pts.push(pts[0].map(pt => {return {...pt}}));

    // construct polys, section by section, from inside to outside
    const polys: CobwebPoly[][] = [];
    for (let slice = 0; slice < pts.length - 1; slice++) {
        const left = pts[slice];
        const right = pts[slice + 1];
        const slicePolys: CobwebPoly[] = [];
        for (let cell = 0; cell < gridHeight; cell++) {
            // for the inner cells, these are correct
            let bottom = cell * 2;
            let top = bottom + 2;
            // for even slices, cut off the final cell
            if ( (slice % 2 === 0) && (cell === gridHeight - 1) ) {
                top--;
            }
            // odd slices need a few adjustments
            else if (slice % 2 !== 0) {
                // first cell gets cut off
                if (cell === 0) {
                    top--;
                }
                // all other cells lose one across the board
                else {
                    top--;
                    bottom--;
                }
            }
            const bl = left[bottom];
            const tl = left[top];
            const tr = right[top];
            const br = right[bottom];
            // round off the tops
            if (cell === gridHeight - 1) {
                if (straight) {
                    slicePolys.push({
                        type: "path",
                        points: [bl, tl, tr, br],
                        path: `M${tl.x},${tl.y} A ${dists[top]} ${dists[top]} 0 0 1 ${tr.x},${tr.y} L${br.x},${br.y} L${bl.x},${bl.y} Z`
                    });
                } else {
                    slicePolys.push({
                        type: "path",
                        points: [bl, tl, tr, br],
                        path: `M${tl.x},${tl.y} A ${dists[top]} ${dists[top]} 0 0 1 ${tr.x},${tr.y} L${br.x},${br.y} A ${dists[bottom]} ${dists[bottom]} 0 0 0 ${bl.x},${bl.y} Z`
                    });
                }
            }
            // round off the bottoms
            else if (cell === 0) {
                if (straight) {
                    slicePolys.push({
                        type: "path",
                        points: [bl, tl, tr, br],
                        path: `M${tl.x},${tl.y} L${tr.x},${tr.y} L${br.x},${br.y} A ${dists[bottom]} ${dists[bottom]} 0 0 0 ${bl.x},${bl.y} Z`
                    });
                } else {
                    slicePolys.push({
                        type: "path",
                        points: [bl, tl, tr, br],
                        path: `M${tl.x},${tl.y} A ${dists[top]} ${dists[top]} 0 0 1 ${tr.x},${tr.y} L${br.x},${br.y} A ${dists[bottom]} ${dists[bottom]} 0 0 0 ${bl.x},${bl.y} Z`
                    });
                }
            }
            // round out the others if `straight` is false
            else {
                if (straight) {
                    slicePolys.push({type: "poly", points: [bl, tl, tr, br]});
                } else {
                    slicePolys.push({
                        type: "path",
                        points: [bl, tl, tr, br],
                        path: `M${tl.x},${tl.y} A ${dists[top]} ${dists[top]} 0 0 1 ${tr.x},${tr.y} L${br.x},${br.y} A ${dists[bottom]} ${dists[bottom]} 0 0 0 ${bl.x},${bl.y} Z`
                    });
                }
            }
        }
        polys.push(slicePolys);
    }
    // currently col/row, but we need row/col
    const rearranged: CobwebPoly[][] = [];
    for (let row = 0; row < gridHeight; row++) {
        rearranged.push([...polys.map(col => col[3 - row])]);
    }
    // finally, add the centre circle
    rearranged.push([{type: "circle", cx: 0, cy: 0, r: innerR}]);
    return rearranged;
}

export const cobwebLabels = (args: ICobwebArgs): IPoint[] => {
    let cellSize = 50;
    if (args.cellSize !== undefined) {
        cellSize = args.cellSize;
    }

    let gridHeight = 4;
    let gridWidth = 8;
    if (args.gridHeight !== undefined) {
        gridHeight = args.gridHeight;
    }
    if (args.gridWidth !== undefined) {
        gridWidth = args.gridWidth;
    }
    // let straight = true;
    // if (args.straight !== undefined) {
    //     straight = args.straight;
    // }
    let start = 0;
    if (args.start !== undefined) {
        start = args.start;
    }

    const innerR = cellSize / 2;
    const webR = gridHeight * cellSize;
    const outerR = innerR + webR;
    const phi = 360 / gridWidth;
    const pts: IPoint[] = [];
    for (let i = 0; i < gridWidth; i++) {
        const angle = start + (phi * (i + 0.5));
        const [x,y] = projectPoint(0, 0, outerR + (cellSize / 2), angle);
        pts.push({x,y})
    }
    return pts;
}
