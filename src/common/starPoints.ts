type Vertex = [number,number];

export const calcStarPoints = (size: number): Vertex[] => {
    const pts: Vertex[] = [];

    if (size <= 6 && size !== 5) {
        return [];
    } else if (size === 5) {
        return [[2,2]];
    }

    let d = 4;
    if (size <= 12) {
        d = 3;
    }

    // corners first
    const tl: Vertex = [d - 1, d - 1];
    const tr: Vertex = [size - d, d - 1];
    const br: Vertex = [size - d, size - d];
    const bl: Vertex = [d - 1, size - d];
    pts.push(tl, tr, br, bl);

    // if odd size
    if (size % 2 !== 0) {
        // always add centre, except for size 7
        if (size !== 7) {
            pts.push([Math.floor(size / 2), Math.floor(size / 2)])
        }

        const midpt = (p1: Vertex, p2: Vertex): Vertex => {
            return [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2]
        }
        // if 15+, add mids as well
        if (size >= 15) {
            pts.push(midpt(tl, tr));
            pts.push(midpt(tr, br));
            pts.push(midpt(br, bl));
            pts.push(midpt(bl, tl));
        }
    }

    return pts;
}
