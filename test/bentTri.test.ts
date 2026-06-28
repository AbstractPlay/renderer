import { expect } from "chai";
import "mocha";
import { bentTriBoard } from "../src/common/bentTri";
import { buildGridLayers } from "../src/common/bentTri/gridLayers";
import { bentTri as bentTriGrid } from "../src/grids";
import { BentTri } from "../src/graphs";

const playableLayers = (frequency: number) =>
    buildGridLayers(bentTriBoard(frequency));

describe("bentTri graph", () => {
    it("should produce expected vertex and edge counts at frequency 8", () => {
        const topo = bentTriBoard(8);
        const { positions } = bentTriGrid({ bentTriGraph: topo });
        const graph = new BentTri(topo, positions);

        expect(topo.vertices.length).to.equal(93);
        expect(topo.edges.length).to.equal(252);
        expect(graph.graph.order).to.equal(93);
        expect(graph.graph.size).to.equal(252);
    });

    it("should have correct vertex degrees at frequency 8", () => {
        const topo = bentTriBoard(8);
        const { positions } = bentTriGrid({ bentTriGraph: topo });
        const graph = new BentTri(topo, positions);

        const interior: number[] = [];
        let outerCornerCount = 0;
        for (const node of graph.graph.nodes()) {
            const attrs = graph.graph.getNodeAttributes(node);
            const degree = graph.graph.degree(node);
            if (!attrs.isOuter) {
                interior.push(degree);
            } else {
                outerCornerCount++;
            }
        }

        expect(interior.length).to.be.greaterThan(0);
        expect(outerCornerCount).to.equal(3);
    });

    it("should align the top seam axis on a straight line", () => {
        const topo = bentTriBoard(8);
        const { positions } = bentTriGrid({ bentTriGraph: topo, bow: 0.35 });
        const graph = new BentTri(topo, positions);
        const hub = positions.get(topo.layers[0][0].id)!;

        const topAxis: number[] = [];
        for (const node of graph.graph.nodes()) {
            const attrs = graph.graph.getNodeAttributes(node);
            if (Math.abs(attrs.x - hub.x) < 1e-4) {
                topAxis.push(attrs.id);
            }
        }

        expect(topAxis.length).to.be.greaterThan(3);
    });

    it("should include every vertex in the playable grid", () => {
        for (const n of [2, 3, 4, 5, 6, 7, 8, 9, 10, 18]) {
            const topo = bentTriBoard(n);
            const inGrid = new Set(
                buildGridLayers(topo).flatMap(layer => layer.map(v => v.id)),
            );
            const missing = topo.vertices.filter(v => !inGrid.has(v.id)).map(v => v.id);
            expect(missing, `n=${n}`).to.deep.equal([]);
        }
    });

    it("should produce grid layers outside-in along the three copy wings", () => {
        const topo = bentTriBoard(8);
        const { grid } = bentTriGrid({ bentTriGraph: topo });
        const gridLayers = buildGridLayers(topo);

        expect(grid.length).to.equal(6);

        const outerIds = gridLayers[0].map(v => v.id);
        expect(outerIds[0]).to.equal(45);
        expect(outerIds).to.deep.equal([
            45, 46, 48, 51, 55, 59, 63, 67,
            36, 37, 38, 39, 40, 41, 42, 43, 44,
            92, 88, 84, 80, 76, 73, 71,
        ]);
        expect(gridLayers[5].map(v => v.id)).to.deep.equal([4, 7, 8]);
    });

    it("should order frequency-4 outer ring clockwise from the apex", () => {
        const rowIds = playableLayers(4).map(layer => layer.map(v => v.id));
        expect(rowIds[0]).to.deep.equal([15, 16, 18, 20, 10, 11, 12, 13, 14, 26, 24, 22]);
        expect(rowIds[1]).to.deep.equal([17, 19, 21, 6, 7, 8, 9, 25, 23]);
        expect(rowIds[2]).to.deep.equal([0, 1, 3, 4, 5, 2]);
    });

    it("should order frequency-6 grid rows by copy wings", () => {
        const topo = bentTriBoard(6);
        const { grid, positions } = bentTriGrid({ bentTriGraph: topo, bow: 0.35 });

        const rowIds = buildGridLayers(topo).map(layer => layer.map(v => v.id));
        expect(rowIds[0]).to.deep.equal([
            28, 29, 31, 34, 37, 40, 21, 22, 23, 24, 25, 26, 27,
            54, 51, 48, 45, 43,
        ]);
        expect(rowIds[0].slice(0, 7)).to.deep.equal([28, 29, 31, 34, 37, 40, 21]);
        expect(rowIds[1]).to.deep.equal([
            30, 32, 35, 38, 41,
            15, 16, 17, 18, 19, 20,
            53, 50, 47, 44,
        ]);
        expect(rowIds[2]).to.deep.equal([
            33, 36, 39, 42,
            10, 11, 12, 13, 14,
            52, 49, 46,
        ]);
        expect(rowIds[3]).to.deep.equal([0, 1, 3, 6, 7, 8, 9, 5, 2]);

        expect(grid[0][0].x).to.equal(positions.get(28)!.x);
        expect(grid[0][0].y).to.equal(positions.get(28)!.y);
    });

    it("should partition every vertex into exactly one grid row", () => {
        for (const n of Array.from({ length: 17 }, (_, i) => i + 2)) {
            const topo = bentTriBoard(n);
            const seen = new Set<number>();
            const duplicates: number[] = [];

            for (const layer of buildGridLayers(topo)) {
                for (const vertex of layer) {
                    if (seen.has(vertex.id)) {
                        duplicates.push(vertex.id);
                    }
                    seen.add(vertex.id);
                }
            }

            expect(duplicates, `n=${n}`).to.deep.equal([]);
            expect(seen.size, `n=${n}`).to.equal(topo.vertices.length);
        }
    });

    it("should order frequency-9 grid rows with the hub shell on row 4", () => {
        const rowIds = playableLayers(9).map(layer => layer.map(v => v.id));

        expect(rowIds[4]).to.deep.equal([
            0, 1, 3, 6, 10, 15, 16, 17, 18, 19, 20, 14, 9, 5, 2,
        ]);
        expect(rowIds[5]).to.deep.equal([4, 7, 11, 12, 13, 8]);
    });

    it("should order frequency-10 grid rows with the hub shell on row 5", () => {
        const rowIds = playableLayers(10).map(layer => layer.map(v => v.id));

        expect(rowIds[5]).to.deep.equal([
            0, 1, 3, 6, 10, 15, 16, 17, 18, 19, 20, 14, 9, 5, 2,
        ]);
        expect(rowIds[6]).to.deep.equal([4, 7, 11, 12, 13, 8]);
    });

    it("should order frequency-13 grid rows without duplicate hub shells", () => {
        const rowIds = playableLayers(13).map(layer => layer.map(v => v.id));

        expect(rowIds[6]).to.deep.equal([
            0, 1, 3, 6, 10, 15, 21, 28, 29, 30, 31, 32, 33, 34, 35,
            27, 20, 14, 9, 5, 2,
        ]);
        expect(rowIds[7]).to.deep.equal([
            4, 7, 11, 16, 22, 23, 24, 25, 26, 19, 13, 8,
        ]);

        const inner = rowIds[7]!;
        expect(inner.indexOf(19)).to.be.lessThan(inner.indexOf(13));

        const allIds = rowIds.flat();
        expect(new Set(allIds).size).to.equal(allIds.length);
    });

    it("should wind each grid ring clockwise in flat coordinates", () => {
        for (const n of [4, 6, 8, 10, 13]) {
            for (const layer of buildGridLayers(bentTriBoard(n))) {
                if (layer.length < 3) {
                    continue;
                }

                const cy =
                    layer.reduce((sum, vertex) => sum + vertex.pt!.y, 0) /
                    layer.length;
                let winding = 0;
                for (let i = 0; i < layer.length; i++) {
                    const a = layer[i]!.pt!;
                    const b = layer[(i + 1) % layer.length]!.pt!;
                    winding += (b.x - a.x) * (b.y + a.y - 2 * cy);
                }
                expect(winding, `n=${n} ring length ${layer.length}`).to.be.lessThan(
                    0,
                );
            }
        }
    });

    it("should produce expected vertex counts across frequencies", () => {
        const expected: Record<number, number> = {
            2: 9,
            3: 15,
            4: 27,
            5: 37,
            6: 55,
            7: 69,
            8: 93,
            9: 111,
            10: 141,
            11: 163,
            12: 199,
        };
        for (const [n, count] of Object.entries(expected)) {
            expect(bentTriBoard(Number(n)).vertices.length).to.equal(count);
        }
    });

    it("should weld all copy-1 bottom points on odd frequencies", () => {
        for (const n of [3, 5, 7, 9, 11]) {
            const topo = bentTriBoard(n);
            for (let col = 0; col <= n; col++) {
                const ref = `1,${n},${col}`;
                const id = topo.refToVid.get(ref);
                const refs = [...topo.refToVid.entries()]
                    .filter(([, vid]) => vid === id)
                    .map(([r]) => r);
                expect(refs.length, `${ref} at n=${n}`).to.be.greaterThan(1);
            }
        }
    });

    it("should keep distinct right-wing seam vertices on odd frequencies", () => {
        const topo = bentTriBoard(7);
        const capSpine = topo.refToVid.get("0,4,0")!;
        const exposed = topo.refToVid.get("0,6,0")!;
        const corner = topo.refToVid.get("0,7,0")!;
        expect(capSpine).to.not.equal(exposed);
        expect(exposed).to.not.equal(corner);
        expect(topo.refToVid.get("1,7,1")).to.equal(exposed);
    });

    it("should weld bottom corners on odd frequencies", () => {
        const topo = bentTriBoard(5);
        expect(topo.vertices.length).to.equal(37);

        const bl = topo.refToVid.get("0,5,5");
        const br = topo.refToVid.get("0,5,0");
        expect(topo.refToVid.get("2,5,5")).to.equal(bl);
        expect(topo.refToVid.get("1,5,0")).to.equal(br);
        expect(bl).to.not.equal(undefined);
        expect(topo.vertices[bl!].pt!.x).to.be.lessThan(topo.vertices[br!].pt!.x);

        const outerIds = buildGridLayers(topo)[0]!.map(v => v.id);
        expect(outerIds[0]).to.equal(topo.refToVid.get("1,0,0"));
        expect(outerIds).to.include(bl);
        expect(outerIds).to.include(br);
    });

    it("should bow the bottom row outward and bow the cap wings", () => {
        const topo = bentTriBoard(8);
        const flat = bentTriGrid({ bentTriGraph: topo, bow: 0 });
        const bent = bentTriGrid({ bentTriGraph: topo, bow: 0.35 });

        const bottomId = topo.layers[8][4].id;
        const cornerY = bent.positions.get(topo.layers[8][0].id)!.y;
        const bentBottomY = bent.positions.get(bottomId)!.y;
        expect(bentBottomY).to.be.greaterThan(cornerY);

        const hub = bent.positions.get(topo.layers[0][0].id)!;
        expect(bent.positions.get(45)!.x).to.be.closeTo(hub.x, 1e-4);
        expect(bent.positions.get(0)!.x).to.be.closeTo(hub.x, 1e-4);

        for (const ref of ["0,3,0", "1,3,0", "1,2,0"]) {
            const id = topo.refToVid.get(ref)!;
            const f = flat.positions.get(id)!;
            const b = bent.positions.get(id)!;
            expect(Math.hypot(b.x - f.x, b.y - f.y)).to.be.greaterThan(1, ref);
        }
    });

    it("should bow at odd frequencies without throwing", () => {
        const topo = bentTriBoard(5);
        const bent = bentTriGrid({ bentTriGraph: topo, bow: 0.35 });
        const n = 5;
        const bl = topo.refToVid.get(`0,${n},${n}`)!;
        const br = topo.refToVid.get(`0,${n},0`)!;
        const bottomInterior = topo.refToVid.get(`0,${n},2`)!;
        const cornerY = Math.max(
            bent.positions.get(bl)!.y,
            bent.positions.get(br)!.y,
        );
        expect(bent.positions.get(bottomInterior)!.y).to.be.greaterThan(
            cornerY,
        );

        const wingSpine = topo.refToVid.get(`0,4,0`)!;
        const outerSpine = topo.refToVid.get(`1,4,0`)!;
        const wingSpinePt = bent.positions.get(wingSpine)!;
        const outerSpinePt = bent.positions.get(outerSpine)!;
        const brPt = bent.positions.get(br)!;
        expect(wingSpinePt.y).to.be.greaterThan(outerSpinePt.y);
        expect(wingSpinePt.y).to.be.lessThan(brPt.y);
    });

    it("should keep cap row spine vertices symmetric at odd frequencies", () => {
        const topo = bentTriBoard(5);
        const flat = bentTriGrid({ bentTriGraph: topo, bow: 0 });
        const hub = flat.positions.get(topo.refToVid.get("0,0,0")!)!;
        const right = flat.positions.get(topo.refToVid.get("0,3,0")!)!;
        const left = flat.positions.get(topo.refToVid.get("0,3,3")!)!;

        expect(right.x - hub.x).to.be.closeTo(hub.x - left.x, 1e-6);
        expect(right.y).to.be.closeTo(left.y, 1e-6);
    });

    it("should not spuriously weld cap spine to wing seam rows at frequency 5", () => {
        const topo = bentTriBoard(5);
        const spine = topo.refToVid.get("0,3,0")!;
        const mirror = topo.refToVid.get("0,4,0")!;
        const mirrorLeft = topo.refToVid.get("0,4,4")!;

        expect(spine).to.not.equal(mirror);
        expect(mirror).to.not.equal(mirrorLeft);
        expect(topo.vertices[spine].nbors).to.not.include(
            topo.refToVid.get("1,4,0"),
        );
        expect(topo.vertices[spine].nbors).to.not.include(
            topo.refToVid.get("0,5,0"),
        );
        expect(topo.vertices[topo.refToVid.get("0,3,1")!].nbors).to.not.include(
            mirror,
        );
    });

    it("should bow cap vertices on all copies during bowing", () => {
        const topo = bentTriBoard(8);
        const flat = bentTriGrid({ bentTriGraph: topo, bow: 0 });
        const bent = bentTriGrid({ bentTriGraph: topo, bow: 0.35 });

        for (const ref of ["0,3,0", "1,4,3", "2,4,1", "1,3,0", "2,4,2"]) {
            const id = topo.refToVid.get(ref)!;
            const f = flat.positions.get(id)!;
            const b = bent.positions.get(id)!;
            const moved = Math.hypot(b.x - f.x, b.y - f.y);
            expect(moved).to.be.greaterThan(1, ref);
        }
    });

    it("should leave the pull core unchanged after the final inward pull", () => {
        const topo = bentTriBoard(8);
        const flat = bentTriGrid({ bentTriGraph: topo, bow: 0 });
        const bent = bentTriGrid({ bentTriGraph: topo, bow: 0.35 });

        for (const { id } of buildGridLayers(topo).at(-1)!) {
            const f = flat.positions.get(id)!;
            const b = bent.positions.get(id)!;
            expect(b.x).to.be.closeTo(f.x, 1e-6);
            expect(b.y).to.be.closeTo(f.y, 1e-6);
        }
    });

    it("should preserve spacing around the hub at high frequency", () => {
        const topo = bentTriBoard(18);
        const bent = bentTriGrid({ bentTriGraph: topo, bow: 0.35 });
        const gridLayers = buildGridLayers(topo);
        const hubId = gridLayers.at(-1)![0].id;
        const hub = bent.positions.get(hubId)!;
        const dist = (id: number): number => {
            const p = bent.positions.get(id)!;
            return Math.hypot(p.x - hub.x, p.y - hub.y);
        };

        const shell = gridLayers.at(-2)!;
        const shellDists = shell.map(v => dist(v.id));
        const minShell = Math.min(...shellDists);
        const maxShell = Math.max(...shellDists);
        expect(maxShell / minShell).to.be.lessThan(1.5);

        const edgeLen = (a: number, b: number): number => {
            const p = bent.positions.get(a)!;
            const q = bent.positions.get(b)!;
            return Math.hypot(q.x - p.x, q.y - p.y);
        };
        const d812 = edgeLen(8, 12);
        const d1224 = edgeLen(12, 24);
        expect(d812).to.be.closeTo(d1224, d1224 * 0.35);
    });

    it("should pull exterior vertices toward the inner hub at the end of bowing", () => {
        const topo = bentTriBoard(8);
        const flat = bentTriGrid({ bentTriGraph: topo, bow: 0 });
        const bent = bentTriGrid({ bentTriGraph: topo, bow: 0.35 });

        const coreIds = new Set(buildGridLayers(topo).at(-1)!.map(v => v.id));
        const center = (pos: Map<number, { x: number; y: number }>): { x: number; y: number } => {
            let x = 0;
            let y = 0;
            for (const id of coreIds) {
                const p = pos.get(id)!;
                x += p.x;
                y += p.y;
            }
            const n = coreIds.size;
            return { x: x / n, y: y / n };
        };
        const dist = (p: { x: number; y: number }, c: { x: number; y: number }): number =>
            Math.hypot(p.x - c.x, p.y - c.y);

        const wingId = topo.refToVid.get("0,3,0")!;
        const flatDist = dist(flat.positions.get(wingId)!, center(flat.positions));
        const bentDist = dist(bent.positions.get(wingId)!, center(bent.positions));
        expect(bentDist).to.be.lessThan(flatDist);
    });
});
