import { expect } from "chai";
import "mocha";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
    ELEVEN_GRAPH,
    buildElevenGraphHelpers,
    parsePitchId,
} from "../src/common/eleven/index.js";
import { orientEdgePolyline } from "../src/boards/eleven/connections.js";
import type { ElevenTopology as CommittedElevenTopology } from "../src/common/eleven/types.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const topologyPath = path.join(repoRoot, "src/boards/eleven/topology.json");

type ElevenTopology = {
    version: number;
    spaces: { i: number; x: number; y: number; r: number }[];
    moveEdges: [number, number][];
    shootEdges: [number, number][];
    edgePaths?: {
        move: Record<string, [number, number][]>;
        shoot: Record<string, [number, number][]>;
    };
    markers: { kind: string; side?: string; corner?: string; points?: { x: number; y: number }[]; bump?: { x: number; y: number }[] }[];
    grassGrid: { cols: number; rows: number; cellW: number; cellH: number };
};

const loadTopology = (): ElevenTopology => {
    const raw = fs.readFileSync(topologyPath, "utf8");
    return JSON.parse(raw) as ElevenTopology;
};

const edgeKey = (a: number, b: number) => (a < b ? `${a}|${b}` : `${b}|${a}`);

/** Stable lookup after geographic re-index (merged coincident Felder). */
const spaceNear = (topo: ElevenTopology, x: number, y: number, tol = 2) => {
    const s = topo.spaces.find((sp) => Math.hypot(sp.x - x, sp.y - y) <= tol);
    if (s === undefined) {
        throw new Error(`no space near (${x}, ${y})`);
    }
    return s.i;
};

describe("eleven board topology", () => {
    it("loads committed topology with expected counts", () => {
        const topo = loadTopology();
        expect(topo.version).to.equal(1);
        expect(topo.spaces).to.have.length(65);
        expect(topo.moveEdges.length).to.be.at.least(140).and.at.most(150);
        expect(topo.shootEdges.length).to.equal(6);
        expect(topo.grassGrid.cols).to.equal(8);
        expect(topo.grassGrid.rows).to.equal(6);
    });

    it("indexes spaces contiguously after geographic sort", () => {
        const topo = loadTopology();
        for (let i = 0; i < topo.spaces.length; i++) {
            expect(topo.spaces[i].i).to.equal(i);
        }
        for (let i = 1; i < topo.spaces.length; i++) {
            const prev = topo.spaces[i - 1];
            const cur = topo.spaces[i];
            expect(cur.y > prev.y || (cur.y === prev.y && cur.x >= prev.x)).to.equal(true);
        }
    });

    it("does not chord across moveto gaps in path4064 (7–13)", () => {
        const topo = loadTopology();
        const moveSet = new Set(topo.moveEdges.map(([a, b]) => edgeKey(a, b)));
        expect(moveSet.has(edgeKey(7, 13))).to.equal(false);
    });

    it("uses move edge on path3121 (51–60, not grazing via 53)", () => {
        const topo = loadTopology();
        const moveSet = new Set(topo.moveEdges.map(([a, b]) => edgeKey(a, b)));
        const s51 = spaceNear(topo, 786.495, 548.681);
        const s53 = spaceNear(topo, 716.502, 576.178);
        const s60 = spaceNear(topo, 804.386, 651.968);
        expect(moveSet.has(edgeKey(s51, s60))).to.equal(true);
        expect(moveSet.has(edgeKey(s53, s60))).to.equal(false);
    });

    it("includes move edge from path4018 fine sampling (44–54)", () => {
        const topo = loadTopology();
        const moveSet = new Set(topo.moveEdges.map(([a, b]) => edgeKey(a, b)));
        expect(moveSet.has(edgeKey(44, 54))).to.equal(true);
    });

    it("stores extracted Linien polylines for every move and shoot edge", () => {
        const topo = loadTopology();
        const paths = topo.edgePaths;
        expect(paths).to.not.equal(undefined);
        for (const [a, b] of topo.moveEdges) {
            const lo = a < b ? a : b;
            const hi = a < b ? b : a;
            expect(paths!.move[`${lo}|${hi}`]).to.not.equal(undefined);
        }
        for (const [a, b] of topo.shootEdges) {
            const lo = a < b ? a : b;
            const hi = a < b ? b : a;
            expect(paths!.shoot[`${lo}|${hi}`]).to.not.equal(undefined);
        }
    });

    it("keeps extracted Linien samples as single hops (no pitch-spanning chords)", () => {
        const topo = loadTopology();
        const paths = topo.edgePaths!;
        const maxSampleStep = 64;
        const all = [...Object.values(paths.move), ...Object.values(paths.shoot)];
        for (const poly of all) {
            for (let i = 1; i < poly.length; i++) {
                const dx = poly[i][0] - poly[i - 1][0];
                const dy = poly[i][1] - poly[i - 1][1];
                expect(Math.hypot(dx, dy)).to.be.at.most(maxSampleStep);
            }
        }
    });

    it("orients committed Linien polylines lo → hi toward endpoint Felder", () => {
        const topo = loadTopology();
        const paths = topo.edgePaths!;
        const check = (lo: number, hi: number, poly: [number, number][]) => {
            const oriented = orientEdgePolyline(topo as CommittedElevenTopology, lo, hi, poly);
            const sa = topo.spaces[lo];
            const sb = topo.spaces[hi];
            const p0 = oriented[0];
            const pn = oriented[oriented.length - 1];
            expect(Math.hypot(p0[0] - sa.x, p0[1] - sa.y)).to.be.lessThan(
                Math.hypot(p0[0] - sb.x, p0[1] - sb.y),
            );
            expect(Math.hypot(pn[0] - sb.x, pn[1] - sb.y)).to.be.lessThan(
                Math.hypot(pn[0] - sa.x, pn[1] - sa.y),
            );
        };
        for (const [a, b] of topo.moveEdges) {
            const lo = a < b ? a : b;
            const hi = a < b ? b : a;
            check(lo, hi, paths.move[`${lo}|${hi}`]!);
        }
        for (const [a, b] of topo.shootEdges) {
            const lo = a < b ? a : b;
            const hi = a < b ? b : a;
            check(lo, hi, paths.shoot[`${lo}|${hi}`]!);
        }
    });

    it("connects the field via move; goal mouths via shoot (dashed Linien)", () => {
        const topo = loadTopology();
        const n = topo.spaces.length;
        const moveSet = new Set(topo.moveEdges.map(([a, b]) => edgeKey(a, b)));
        const shootSet = new Set(topo.shootEdges.map(([a, b]) => edgeKey(a, b)));

        const westGoal = spaceNear(topo, 35.688, 393.696);
        const eastGoal = spaceNear(topo, 994.855, 393.696);
        const westPen = spaceNear(topo, 155.738, 393.82);
        const eastPen = spaceNear(topo, 875.746, 393.813);

        const moveAdj = new Map<number, number[]>();
        for (let i = 0; i < n; i++) {
            moveAdj.set(i, []);
        }
        for (const [a, b] of topo.moveEdges) {
            moveAdj.get(a)!.push(b);
            moveAdj.get(b)!.push(a);
        }
        const seen = new Set<number>();
        const stack = [0];
        while (stack.length > 0) {
            const v = stack.pop()!;
            if (seen.has(v)) {
                continue;
            }
            seen.add(v);
            for (const w of moveAdj.get(v)!) {
                if (!seen.has(w)) {
                    stack.push(w);
                }
            }
        }
        expect(seen.size).to.equal(n - 2);
        expect(seen.has(westGoal)).to.equal(false);
        expect(seen.has(eastGoal)).to.equal(false);

        expect(shootSet.has(edgeKey(eastGoal, eastPen))).to.equal(true);
        expect(shootSet.has(edgeKey(westGoal, westPen))).to.equal(true);
        expect(moveSet.has(edgeKey(eastGoal, eastPen))).to.equal(false);
        expect(moveSet.has(edgeKey(westGoal, westPen))).to.equal(false);

        for (const [a, b] of topo.shootEdges) {
            expect(moveSet.has(edgeKey(a, b))).to.equal(
                false,
                `shoot edge ${a}-${b} duplicates move`,
            );
        }
    });

    it("includes required pitch markers", () => {
        const topo = loadTopology();
        const kinds: Record<string, number> = {};
        for (const m of topo.markers) {
            kinds[m.kind] = (kinds[m.kind] ?? 0) + 1;
        }
        expect(kinds.centerCircle).to.equal(1);
        expect(kinds.midline).to.equal(1);
        expect(kinds.centerSpot).to.equal(1);
        expect(kinds.penaltyMark).to.equal(2);
        expect(kinds.penaltyArea).to.equal(2);
        for (const side of ["w", "e"] as const) {
            const pen = topo.markers.find((m) => m.kind === "penaltyArea" && m.side === side);
            expect(pen?.points).to.have.length(4);
            expect(pen?.bump?.length).to.be.at.least(3);
        }
        expect(kinds.goalArea).to.equal(2);
        expect(kinds.cornerArc).to.equal(4);
    });

    it("assigns unique pitch ids (side + G|P|F|C + number)", () => {
        const topo = loadTopology();
        const helpers = buildElevenGraphHelpers(topo);
        expect(helpers.spaces).to.have.length(65);
        const ids = helpers.spaces.map((s) => s.pitchId);
        expect(new Set(ids).size).to.equal(65);
        for (const s of helpers.spaces) {
            if (s.pitchId === "WG" || s.pitchId === "EG" || s.pitchId === "C") {
                expect(s.number).to.equal(null);
                expect(helpers.indexByPitchId.get(s.pitchId)).to.equal(s.index);
                continue;
            }
            expect(s.pitchId).to.match(/^W[GPFC]\d{2}$|^E[GPFC]\d{2}$/);
            const parsed = parsePitchId(s.pitchId);
            expect(parsed.kind).to.equal("numbered");
            if (parsed.kind === "numbered") {
                expect(parsed.side).to.equal(s.side);
                expect(parsed.band).to.equal(s.band);
                expect(parsed.number).to.equal(s.number);
            }
            expect(helpers.indexByPitchId.get(s.pitchId)).to.equal(s.index);
        }
    });

    it("maps goal mouths to outer grass columns (WG, EG)", () => {
        const topo = loadTopology();
        const westGoal = spaceNear(topo, 35.688, 393.696);
        const eastGoal = spaceNear(topo, 994.855, 393.696);
        const center = spaceNear(topo, 515.456, 393.896);
        expect(ELEVEN_GRAPH.pitchIdByIndex.get(westGoal)).to.equal("WG");
        expect(ELEVEN_GRAPH.pitchIdByIndex.get(eastGoal)).to.equal("EG");
        expect(ELEVEN_GRAPH.pitchIdByIndex.get(center)).to.equal("C");
        expect(ELEVEN_GRAPH.spaces[westGoal].column).to.equal(0);
        expect(ELEVEN_GRAPH.spaces[eastGoal].column).to.equal(7);
    });
});
