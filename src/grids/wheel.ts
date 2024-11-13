import { projectPoint } from "../common/plotting";
import { GridPoints, IGeneratorArgs, IPoint, IPolyPath, IPolyPolygon } from "./_base";

export interface IWheelArgs extends IGeneratorArgs {
    straight?: boolean;
    start?: number;
}

/**
 * Generates a circular web & spoke field. This function returns the centroids of each space.
 * Vertices and spaces are interlaced. The first row is the outermost row of vertices.
 * The second row is the outermost row of spaces. The next row is vertices, then spaces, etc.
 * The last row is always the singular centre point. And yes, the centre point gets repeated
 * in each row of vertices.
 *
 * @param args - Generator options
 * @returns Map of x,y coordinates to row/column locations
 */
export const wheel = (args: IWheelArgs): GridPoints => {
    const polys = wheelPolys(args);
    const grid: GridPoints = [];
    for (let row = 0; row < polys.length; row++) {
        const slice = polys[row];
        const verts: IPoint[] = [];
        const spaces: IPoint[] = [];
        for (const poly of slice) {
            // The vertex is always the "top left" corner of the poly
            verts.push(poly.points[1]);
            // If it's an outer space, we need to bias the centroid further outward
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
            spaces.push({x: cx, y: cy});
        }
        grid.push(verts);
        grid.push(spaces);
    }
    grid.push([{x: 0, y: 0}]);

    return grid;
}

export const wheelPolys = (args: IWheelArgs): (IPolyPolygon|IPolyPath)[][] => {
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
    let straight = false;
    if (args.straight !== undefined) {
        straight = args.straight;
    }
    let start = 0;
    if (args.start !== undefined) {
        start = args.start;
    }

    // First generate a list of intersection points for each line
    // Each line has the same distribution of points
    const pts: IPoint[][] = [];
    const phi = 360 / gridWidth;
    for (let i = 0; i < gridWidth; i++) {
        const line: IPoint[] = [];
        const angle = start + (phi * i);
        for (let j = 0; j <= gridHeight; j++) {
            const [x,y] = projectPoint(0, 0, cellSize * j, angle);
            line.push({x,y})
        }
        pts.push(line);
    }
    // wrap the lines around
    pts.push(pts[0].map(pt => {return {...pt}}));

    // construct polys, section by section, from inside to outside
    const polys: (IPolyPolygon|IPolyPath)[][] = [];
    for (let slice = 0; slice < pts.length - 1; slice++) {
        const left = pts[slice];
        const right = pts[slice + 1];
        const slicePolys: (IPolyPolygon|IPolyPath)[] = [];
        for (let cell = 0; cell < gridHeight; cell++) {
            const bottom = cell;
            const top = bottom + 1;

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
                        path: `M${tl.x},${tl.y} A ${cellSize * top} ${cellSize * top} 0 0 1 ${tr.x},${tr.y} L${br.x},${br.y} L${bl.x},${bl.y} Z`
                    });
                } else {
                    slicePolys.push({
                        type: "path",
                        points: [bl, tl, tr, br],
                        path: `M${tl.x},${tl.y} A ${cellSize * top} ${cellSize * top} 0 0 1 ${tr.x},${tr.y} L${br.x},${br.y} A ${cellSize * bottom} ${cellSize * bottom} 0 0 0 ${bl.x},${bl.y} Z`
                    });
                }
            }
            // innermost cells only have three points
            else if (cell === 0) {
                if (straight) {
                    slicePolys.push({
                        type: "poly",
                        points: [bl, tl, tr],
                    });
                } else {
                    slicePolys.push({
                        type: "path",
                        points: [bl, tl, tr],
                        path: `M${tl.x},${tl.y} A ${cellSize * top} ${cellSize * top} 0 0 1 ${tr.x},${tr.y} L${bl.x},${bl.y} Z`
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
                        path: `M${tl.x},${tl.y} A ${cellSize * top} ${cellSize * top} 0 0 1 ${tr.x},${tr.y} L${br.x},${br.y} A ${cellSize * bottom} ${cellSize * bottom} 0 0 0 ${bl.x},${bl.y} Z`
                    });
                }
            }
        }
        polys.push(slicePolys);
    }
    // currently col/row, but we need row/col
    const rearranged: (IPolyPolygon|IPolyPath)[][] = [];
    for (let row = 0; row < gridHeight; row++) {
        rearranged.push([...polys.map(col => col[gridHeight - 1 - row])]);
    }
    // finally, add the centre circle
    return rearranged;
}

export const wheelLabels = (args: IWheelArgs): IPoint[] => {
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

    const innerR = 0;
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
