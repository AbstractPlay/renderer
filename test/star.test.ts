import { expect } from "chai";
import "mocha";
import { starBoard, starFrequencyFromWidth } from "../src/common/star";
import { star as starGrid } from "../src/grids";
import { Star } from "../src/graphs";

describe("star board", () => {
    it("maps space-style width 11 to frequency 10", () => {
        expect(starFrequencyFromWidth(11)).to.equal(10);
    });

    it("should produce the standard board counts at frequency 10", () => {
        const topo = starBoard(10);
        const grid = starGrid({ starGraph: topo });
        const graph = new Star(topo);

        expect(topo.vertices.length).to.equal(276);
        expect(topo.edges.length).to.equal(775);
        expect(topo.pericellIds.size).to.equal(50);
        expect(topo.quarkIds.size).to.equal(5);
        expect(topo.bridgeIds.size).to.equal(6);
        expect(graph.graph.order).to.equal(276);
        expect(graph.graph.size).to.equal(775);
        expect(grid.length).to.equal(11);
        expect(grid[0]!.length).to.equal(50);
        expect(grid[grid.length - 1]!.length).to.equal(1);
    });

    it("should order rings outside-in from the top quark clockwise", () => {
        const topo = starBoard(10);
        const grid = starGrid({ starGraph: topo });
        const topQuarkId = topo.layers[10]![0]![0]!.id;

        expect(topo.gridLayers[0]![0]!.id).to.equal(topQuarkId);
        expect(grid[0]![0]).to.deep.equal(topo.vertices[topQuarkId]!.pt);

        const outer = grid[0]!;
        const cy = outer.reduce((sum, p) => sum + p.y, 0) / outer.length;
        let winding = 0;
        for (let i = 0; i < outer.length; i++) {
            const a = outer[i]!;
            const b = outer[(i + 1) % outer.length]!;
            winding += (b.x - a.x) * (b.y + a.y - 2 * cy);
        }
        expect(winding).to.be.lessThan(0);

        expect(topo.gridLayers.length).to.equal(11);
        expect(topo.gridLayers[1]!.length).to.equal(45);
        expect(topo.gridLayers[10]!.length).to.equal(1);
    });

    it("should mark bridge, quark, and pericell vertices", () => {
        const topo = starBoard(10);
        const graph = new Star(topo);

        let bridgeCount = 0;
        let quarkCount = 0;
        let pericellCount = 0;
        let cornerDegree3 = 0;

        for (const node of graph.graph.nodes()) {
            const attrs = graph.graph.getNodeAttributes(node) as import("../src/graphs").StarNodeData;
            if (attrs.isBridge) {
                bridgeCount++;
            }
            if (attrs.isQuark) {
                quarkCount++;
                if (graph.graph.degree(node) === 3) {
                    cornerDegree3++;
                }
            }
            if (attrs.isPericell) {
                pericellCount++;
            }
            if (attrs.isQuark) {
                expect(attrs.isPericell).to.equal(true);
            }
            if (attrs.isBridge) {
                expect(attrs.isOuter).to.equal(false);
            }
        }

        expect(bridgeCount).to.equal(6);
        expect(quarkCount).to.equal(5);
        expect(pericellCount).to.equal(50);
        expect(cornerDegree3).to.equal(5);
    });

    it("should have six bridge vertices at frequency 3", () => {
        const topo = starBoard(3);
        expect(topo.bridgeIds.has(0)).to.equal(true);
        expect([...topo.bridgeIds].sort((a, b) => a - b)).to.deep.equal([0, 1, 2, 3, 4, 5]);
    });

    it("should place outer edge vertices on straight pentagon sides", () => {
        const topo = starBoard(10);
        const outer = topo.layers[10]!;

        for (let side = 0; side < 5; side++) {
            const curve = outer[side]!;
            const start = topo.vertices[curve[0]!.id]!.pt!;
            const end = topo.vertices[curve[curve.length - 1]!.id]!.pt!;
            const dx = end.x - start.x;
            const dy = end.y - start.y;
            const lenSq = dx * dx + dy * dy;

            for (let n = 1; n < curve.length - 1; n++) {
                const pt = topo.vertices[curve[n]!.id]!.pt!;
                const cross = Math.abs((pt.x - start.x) * dy - (pt.y - start.y) * dx);
                expect(cross * cross).to.be.lessThan(lenSq * 0.01);
            }
        }
    });
});
