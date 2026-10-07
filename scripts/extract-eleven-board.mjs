/**
 * Extract eleven board topology from src/boards/eleven/source.svg
 *
 * Usage: node scripts/extract-eleven-board.mjs [--gameslib path/to/gameslib]
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createSVGWindow } from "svgdom";
import { SVG, registerWindow } from "@svgdotjs/svg.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const SOURCE_SVG = path.join(REPO_ROOT, "src/boards/eleven/source.svg");
const OUT_JSON = path.join(REPO_ROOT, "src/boards/eleven/topology.json");
const OUT_ADJ_SVG = path.join(REPO_ROOT, "test/fixtures/eleven-adjacency.svg");
const OUT_MARKERS_SVG = path.join(REPO_ROOT, "test/fixtures/eleven-markers.svg");

const PADDING = 8;
/** Felder paths in source.svg (includes stacked inner goal dots and kick-off spot). */
const FELDER_COUNT = 68;
/** Play spaces after merging coincident Felder (inner/outer goals, kick-off spot). */
const PLAY_SPACE_COUNT = 65;
/** Expected counts from source.svg (update if art changes). */
const EXPECTED = {
    spaces: PLAY_SPACE_COUNT,
    shootEdgesMin: 6,
    shootEdgesMax: 6,
};
/** Max distance past 1.5× space radius for a Linien sample to claim a space (avoids grazing hops e.g. 53 on path3121). */
const MATCH_MARGIN = 15;
const BRIDGE_MAX_DIST = 20;
/** Sample along each Linien path (px). Coarse 10% sampling creates false chords on curves (e.g. 46–62 on path4058). */
const PATH_FINE_STEP_PX = 4;
/** Inkscape paths with multiple `m` subpaths stitch into one length(); break before cross-subpath chords (e.g. path4064). */
const PATH_DISCONTINUITY_PX = 48;

const round = (n) => Math.round(n * 1000) / 1000;

const parseArgs = () => {
    const gameslibIdx = process.argv.indexOf("--gameslib");
    if (gameslibIdx === -1) {
        return { gameslibOut: null };
    }
    const p = process.argv[gameslibIdx + 1];
    if (!p) {
        throw new Error("--gameslib requires a path");
    }
    return { gameslibOut: path.join(path.resolve(p), "src/common/eleven/topology.json") };
};

const isDashedStroke = (style) =>
    style.includes("stroke-dasharray") && !style.includes("stroke-dasharray:none");

const loadSvg = () => {
    const w = createSVGWindow();
    registerWindow(w, w.document);
    const draw = SVG(w.document.documentElement);
    draw.svg(fs.readFileSync(SOURCE_SVG, "utf8"));
    return draw;
};

const samplePathPoints = (pathNode, draw, stepPx = 4) => {
    const len = pathNode.length();
    const steps = Math.max(2, Math.ceil(len / stepPx));
    const pts = [];
    for (let i = 0; i <= steps; i++) {
        const pt = pathNode.pointAt((i / steps) * len);
        pts.push({ x: pt.x, y: pt.y });
    }
    return pts;
};

const bboxOfPoints = (pts) => {
    const xs = pts.map((p) => p.x);
    const ys = pts.map((p) => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    return { minX, minY, maxX, maxY, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2 };
};

/** Inner goal dots and the kick-off spot share a center with the play circle — keep the larger Felder only. */
const mergeCoincidentSpaces = (raw) => {
    const n = raw.length;
    const parent = raw.map((_, i) => i);
    const find = (i) => {
        let x = i;
        while (parent[x] !== x) {
            parent[x] = parent[parent[x]];
            x = parent[x];
        }
        return x;
    };
    const union = (a, b) => {
        const ra = find(a);
        const rb = find(b);
        if (ra !== rb) {
            parent[rb] = ra;
        }
    };
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            const dist = Math.hypot(raw[i].x - raw[j].x, raw[i].y - raw[j].y);
            if (dist <= BRIDGE_MAX_DIST) {
                union(i, j);
            }
        }
    }
    const byRoot = new Map();
    for (let i = 0; i < n; i++) {
        const root = find(i);
        if (!byRoot.has(root)) {
            byRoot.set(root, []);
        }
        byRoot.get(root).push(i);
    }
    const merged = [];
    for (const members of byRoot.values()) {
        let rep = members[0];
        for (const m of members) {
            if (raw[m].r > raw[rep].r) {
                rep = m;
            }
        }
        merged.push(raw[rep]);
    }
    merged.sort((a, b) => a.y - b.y || a.x - b.x);
    return merged.map((s, i) => ({ i, x: s.x, y: s.y, r: s.r, svgId: s.svgId }));
};

const extractSpaces = (draw) => {
    const felder = draw.findOne("#layer1");
    if (!felder) {
        throw new Error("Missing Felder layer #layer1");
    }
    const raw = [];
    felder.find("path").forEach((p) => {
        const cx = parseFloat(p.attr("sodipodi:cx"));
        if (Number.isNaN(cx)) {
            return;
        }
        const box = p.rbox(draw);
        raw.push({
            svgId: p.id(),
            x: box.cx,
            y: box.cy,
            r: Math.min(box.width, box.height) / 2,
        });
    });
    if (raw.length !== FELDER_COUNT) {
        throw new Error(`Expected ${FELDER_COUNT} Felder paths, got ${raw.length}`);
    }
    raw.sort((a, b) => a.y - b.y || a.x - b.x);
    const spaces = mergeCoincidentSpaces(raw);
    if (spaces.length !== PLAY_SPACE_COUNT) {
        throw new Error(
            `Expected ${PLAY_SPACE_COUNT} play spaces after merge, got ${spaces.length}`,
        );
    }
    return spaces;
};

const matchSpace = (spaces, x, y) => {
    let best = -1;
    let score = Infinity;
    for (const s of spaces) {
        const d = Math.hypot(s.x - x, s.y - y);
        const margin = d - s.r * 1.5;
        if (margin < score) {
            score = margin;
            best = s.i;
        }
    }
    return score < MATCH_MARGIN ? best : -1;
};

const edgeKey = (a, b) => (a < b ? `${a}|${b}` : `${b}|${a}`);

const appendSpaceSequence = (spaces, pts, seq) => {
    for (const pt of pts) {
        const idx = matchSpace(spaces, pt.x, pt.y);
        if (idx >= 0 && (seq.length === 0 || seq[seq.length - 1] !== idx)) {
            seq.push(idx);
        }
    }
};

const addSequenceEdges = (seq, target) => {
    for (let j = 1; j < seq.length; j++) {
        target.add(edgeKey(seq[j - 1], seq[j]));
    }
};

const samplePathFine = (p) => {
    const len = p.length();
    const steps = Math.max(2, Math.ceil(len / PATH_FINE_STEP_PX));
    const pts = [];
    for (let i = 0; i <= steps; i++) {
        pts.push(p.pointAt((i / steps) * len));
    }
    return pts;
};

const splitPathSamplesAtJumps = (pts) => {
    if (pts.length === 0) {
        return [];
    }
    const segments = [[pts[0]]];
    for (let i = 1; i < pts.length; i++) {
        const prev = pts[i - 1];
        const cur = pts[i];
        if (Math.hypot(cur.x - prev.x, cur.y - prev.y) > PATH_DISCONTINUITY_PX) {
            segments.push([cur]);
        } else {
            segments[segments.length - 1].push(cur);
        }
    }
    return segments;
};

const spaceSequencesFromPath = (spaces, pathNode) => {
    const segments = splitPathSamplesAtJumps(samplePathFine(pathNode));
    const sequences = [];
    for (const seg of segments) {
        const seq = [];
        appendSpaceSequence(spaces, seg, seq);
        if (seq.length > 0) {
            sequences.push(seq);
        }
    }
    return sequences;
};

const addEdgesFromPaths = (paths, spaces, target) => {
    paths.forEach((p) => {
        for (const seq of spaceSequencesFromPath(spaces, p)) {
            addSequenceEdges(seq, target);
        }
    });
};

/** One hop along a segment: slice from entering `from` until first sample at `to`. */
const recordHopsFromSegment = (segPts, spaces, target) => {
    const seq = [];
    appendSpaceSequence(spaces, segPts, seq);
    if (seq.length < 2) {
        return;
    }
    let hopIndex = 0;
    let currentSpace = -1;
    let runStart = 0;
    for (let i = 0; i < segPts.length; i++) {
        const m = matchSpace(spaces, segPts[i].x, segPts[i].y);
        if (m < 0) {
            continue;
        }
        if (m !== currentSpace) {
            if (currentSpace >= 0 && hopIndex < seq.length - 1) {
                const expectedFrom = seq[hopIndex];
                const expectedTo = seq[hopIndex + 1];
                if (currentSpace === expectedFrom && m === expectedTo) {
                    let poly = segPts.slice(runStart, i + 1);
                    if (poly.length >= 2) {
                        const sa = spaces[expectedFrom];
                        const sb = spaces[expectedTo];
                        const dStartFrom = Math.hypot(poly[0].x - sa.x, poly[0].y - sa.y);
                        const dStartTo = Math.hypot(poly[0].x - sb.x, poly[0].y - sb.y);
                        if (dStartTo < dStartFrom) {
                            poly = poly.slice().reverse();
                        }
                        storePolyline(target, edgeKey(expectedFrom, expectedTo), poly);
                    }
                    hopIndex++;
                }
            }
            currentSpace = m;
            runStart = i;
        }
    }
};

const simplifyPolyline = (pts, minDist = 2) => {
    if (pts.length <= 2) {
        return pts;
    }
    const out = [pts[0]];
    for (let i = 1; i < pts.length - 1; i++) {
        const last = out[out.length - 1];
        if (Math.hypot(pts[i].x - last.x, pts[i].y - last.y) >= minDist) {
            out.push(pts[i]);
        }
    }
    out.push(pts[pts.length - 1]);
    return out;
};

const storePolyline = (map, key, pts) => {
    const simplified = simplifyPolyline(pts);
    const asPairs = simplified.map((p) => [round(p.x), round(p.y)]);
    const prev = map.get(key);
    if (prev === undefined || asPairs.length < prev.length) {
        map.set(key, asPairs);
    }
};

/** Sampled Linien subpaths per undirected edge (move vs shoot). */
const extractConnectionPolylines = (draw, spaces) => {
    const linien = draw.findOne("#layer3");
    if (!linien) {
        throw new Error("Missing Linien layer #layer3");
    }
    const move = new Map();
    const shoot = new Map();
    linien.find("path").forEach((p) => {
        const style = p.attr("style") || "";
        const target = isDashedStroke(style) ? shoot : move;
        const segments = splitPathSamplesAtJumps(samplePathFine(p));
        for (const seg of segments) {
            recordHopsFromSegment(seg, spaces, target);
        }
    });
    return {
        move: Object.fromEntries(move),
        shoot: Object.fromEntries(shoot),
    };
};

/** Every consecutive pair along fine-sampled solid paths must appear in move edges. */
const validateFinePathEdges = (draw, spaces, moveEdges) => {
    const move = new Set(moveEdges.map(([a, b]) => edgeKey(a, b)));
    const linien = draw.findOne("#layer3");
    const missing = [];
    linien.find("path").forEach((p) => {
        const style = p.attr("style") || "";
        if (isDashedStroke(style)) {
            return;
        }
        for (const seq of spaceSequencesFromPath(spaces, p)) {
            for (let j = 1; j < seq.length; j++) {
                const key = edgeKey(seq[j - 1], seq[j]);
                if (!move.has(key)) {
                    missing.push({ pathId: p.id(), edge: key });
                }
            }
        }
    });
    if (missing.length > 0) {
        const sample = missing
            .slice(0, 5)
            .map((m) => `${m.pathId}:${m.edge}`)
            .join(", ");
        throw new Error(
            `${missing.length} fine-sampled move edge(s) missing from graph (e.g. ${sample})`,
        );
    }
};

const extractEdges = (draw, spaces) => {
    const linien = draw.findOne("#layer3");
    if (!linien) {
        throw new Error("Missing Linien layer #layer3");
    }
    const move = new Set();
    const shoot = new Set();

    const solid = [];
    const dashed = [];
    linien.find("path").forEach((p) => {
        const style = p.attr("style") || "";
        if (isDashedStroke(style)) {
            dashed.push(p);
        } else {
            solid.push(p);
        }
    });

    addEdgesFromPaths(solid, spaces, move);
    addEdgesFromPaths(dashed, spaces, shoot);

    for (const key of move) {
        shoot.delete(key);
    }

    const toPairs = (set) =>
        [...set]
            .map((k) => k.split("|").map((n) => parseInt(n, 10)))
            .sort((a, b) => a[0] - b[0] || a[1] - b[1]);

    return { moveEdges: toPairs(move), shootEdges: toPairs(shoot) };
};

const pathById = (draw, id) => {
    const p = draw.findOne(`#${id}`);
    if (!p) {
        throw new Error(`Missing path #${id}`);
    }
    return p;
};

const lineFromPath = (pathNode, draw) => {
    const a = pathNode.pointAt(0);
    const b = pathNode.pointAt(pathNode.length());
    return { x1: a.x, y1: a.y, x2: b.x, y2: b.y };
};

const circleFromPath = (pathNode, draw) => {
    const b = pathNode.rbox(draw);
    return { cx: b.cx, cy: b.cy, r: Math.min(b.width, b.height) / 2 };
};

const polyFromPaths = (draw, ids) => {
    const pts = [];
    for (const id of ids) {
        pts.push(...samplePathPoints(pathById(draw, id), draw, 8));
    }
    const box = bboxOfPoints(pts);
    return [
        { x: box.minX, y: box.minY },
        { x: box.maxX, y: box.minY },
        { x: box.maxX, y: box.maxY },
        { x: box.minX, y: box.maxY },
    ];
};

/** Field-facing semicircle between penalty-line joins (one x per y on the bump path). */
const penaltyBumpArc = (bumpPath, lineX, yJoinTop, yJoinBottom, fieldSide) => {
    const len = bumpPath.length();
    const yStep = 4;
    const yBand = 1.75;
    const arcPts = [];
    for (let y = yJoinTop; y <= yJoinBottom; y += yStep) {
        let best = null;
        let bestX = fieldSide === "left" ? Infinity : -Infinity;
        for (let i = 0; i <= 400; i++) {
            const p = bumpPath.pointAt((i / 400) * len);
            if (Math.abs(p.y - y) > yBand) {
                continue;
            }
            if (fieldSide === "left" && p.x < bestX) {
                bestX = p.x;
                best = p;
            }
            if (fieldSide === "right" && p.x > bestX) {
                bestX = p.x;
                best = p;
            }
        }
        if (best) {
            arcPts.push(best);
        }
    }
    arcPts.sort((a, b) => b.y - a.y);
    return arcPts;
};

/**
 * Penalty area outline with midfield bump (path3936 / path3942), not the bbox rectangle.
 * @param {"left" | "right"} fieldSide — direction from the straight penalty line toward the field
 */
const penaltyAreaOutline = (draw, { lineId, topId, bottomId, bumpId, fieldSide }) => {
    const line = pathById(draw, lineId);
    const lineStart = line.pointAt(0);
    const lineEnd = line.pointAt(line.length());
    const lineX = lineStart.x;
    const top = pathById(draw, topId);
    const bottom = pathById(draw, bottomId);
    const goalTop = top.pointAt(0);
    const goalBottom = bottom.pointAt(0);
    const bumpPath = pathById(draw, bumpId);
    const bumpPts = samplePathPoints(bumpPath, draw, 4);
    const joinEps = 2.5;
    const joinYs = bumpPts
        .filter((p) => Math.abs(p.x - lineX) < joinEps)
        .map((p) => p.y)
        .sort((a, b) => a - b);
    if (joinYs.length < 2) {
        throw new Error(`Penalty bump ${bumpId} does not meet line ${lineId}`);
    }
    const yJoinTop = joinYs[0];
    const yJoinBottom = joinYs[joinYs.length - 1];
    const arcPts = penaltyBumpArc(bumpPath, lineX, yJoinTop, yJoinBottom, fieldSide);
    const pt = (x, y) => ({ x: round(x), y: round(y) });
    return {
        /** Full penalty box (straight line runs entire height; bump is drawn on top). */
        points: [
            pt(lineStart.x, lineStart.y),
            pt(goalTop.x, goalTop.y),
            pt(goalBottom.x, goalBottom.y),
            pt(lineEnd.x, lineEnd.y),
        ],
        bump: [
            pt(lineX, yJoinBottom),
            ...arcPts.map((p) => pt(p.x, p.y)),
            pt(lineX, yJoinTop),
        ],
    };
};

const cornerFromArcPath = (pathNode, draw) => {
    const b = pathNode.rbox(draw);
    let corner = "nw";
    if (b.cx > 500 && b.cy < 360) {
        corner = "ne";
    } else if (b.cx < 500 && b.cy > 360) {
        corner = "sw";
    } else if (b.cx > 500 && b.cy > 360) {
        corner = "se";
    }
    const c = circleFromPath(pathNode, draw);
    return { corner, ...c };
};

/** Classify Graslinien paths by stable source ids (fixed art). */
const extractMarkers = (draw) => {
    const markers = [];

    markers.push({
        kind: "centerCircle",
        ...circleFromPath(pathById(draw, "path3906"), draw),
    });

    markers.push({
        kind: "midline",
        ...lineFromPath(pathById(draw, "path3908"), draw),
    });

    markers.push({
        kind: "centerSpot",
        ...circleFromPath(pathById(draw, "path3914"), draw),
    });

    markers.push({
        kind: "penaltyMark",
        side: "w",
        ...circleFromPath(pathById(draw, "path3912"), draw),
    });
    markers.push({
        kind: "penaltyMark",
        side: "e",
        ...circleFromPath(pathById(draw, "path3916"), draw),
    });

    markers.push({
        kind: "penaltyArea",
        side: "w",
        ...penaltyAreaOutline(draw, {
            lineId: "path3926",
            topId: "path3928",
            bottomId: "path3930",
            bumpId: "path3936",
            fieldSide: "right",
        }),
    });
    markers.push({
        kind: "penaltyArea",
        side: "e",
        ...penaltyAreaOutline(draw, {
            lineId: "path3918",
            topId: "path3922",
            bottomId: "path3924",
            bumpId: "path3942",
            fieldSide: "left",
        }),
    });

    markers.push({
        kind: "goalArea",
        side: "w",
        points: polyFromPaths(draw, ["path3944", "path3946", "path3948"]),
    });
    markers.push({
        kind: "goalArea",
        side: "e",
        points: polyFromPaths(draw, ["path3950", "path3952", "path3954"]),
    });

    for (const id of ["path3956", "path3958", "path3960", "path3962"]) {
        const arc = cornerFromArcPath(pathById(draw, id), draw);
        markers.push({
            kind: "cornerArc",
            corner: arc.corner,
            cx: arc.cx,
            cy: arc.cy,
            r: arc.r,
        });
    }

    return markers;
};

const extractGrassGrid = (draw) => {
    const gras = draw.findOne("#layer2");
    if (!gras) {
        throw new Error("Missing Gras layer #layer2");
    }
    const rects = gras.find("rect");
    if (rects.length === 0) {
        throw new Error("No grass rects found");
    }
    const boxes = rects.map((r) => r.rbox(draw));
    const minX = Math.min(...boxes.map((b) => b.x));
    const minY = Math.min(...boxes.map((b) => b.y));
    const maxX = Math.max(...boxes.map((b) => b.x + b.width));
    const maxY = Math.max(...boxes.map((b) => b.y + b.height));
    const cellW = boxes[0].width;
    const cellH = boxes[0].height;
    const cols = Math.round((maxX - minX) / cellW);
    const rows = Math.round((maxY - minY) / cellH);
    return { originX: minX, originY: minY, cellW, cellH, cols, rows };
};

const computeNormalize = (spaces, markers, grassGrid) => {
    const pts = [
        ...spaces.flatMap((s) => [
            { x: s.x - s.r, y: s.y - s.r },
            { x: s.x + s.r, y: s.y + s.r },
        ]),
    ];
    for (const m of markers) {
        if (m.kind === "midline") {
            pts.push({ x: m.x1, y: m.y1 }, { x: m.x2, y: m.y2 });
        } else if (m.points) {
            pts.push(...m.points);
            if (m.bump) {
                pts.push(...m.bump);
            }
        } else if (m.cx !== undefined) {
            pts.push({ x: m.cx - m.r, y: m.cy - m.r }, { x: m.cx + m.r, y: m.cy + m.r });
        }
    }
    pts.push(
        { x: grassGrid.originX, y: grassGrid.originY },
        {
            x: grassGrid.originX + grassGrid.cols * grassGrid.cellW,
            y: grassGrid.originY + grassGrid.rows * grassGrid.cellH,
        },
    );
    const minX = Math.min(...pts.map((p) => p.x));
    const minY = Math.min(...pts.map((p) => p.y));
    return { dx: minX - PADDING, dy: minY - PADDING };
};

const normPt = (p, dx, dy) => ({ x: round(p.x - dx), y: round(p.y - dy) });

const normalizeEdgePaths = (edgePaths, dx, dy) => {
    const normMap = (map) => {
        const out = {};
        for (const [key, pairs] of Object.entries(map)) {
            out[key] = pairs.map(([x, y]) => [round(x - dx), round(y - dy)]);
        }
        return out;
    };
    return {
        move: normMap(edgePaths.move),
        shoot: normMap(edgePaths.shoot),
    };
};

const normalizeTopology = (spaces, edges, markers, grassGrid, norm, edgePaths) => {
    const { dx, dy } = norm;
    const spacesOut = spaces.map((s) => ({
        i: s.i,
        x: round(s.x - dx),
        y: round(s.y - dy),
        r: round(s.r),
    }));

    const normMarker = (m) => {
        const out = { kind: m.kind };
        if (m.side) {
            out.side = m.side;
        }
        if (m.corner) {
            out.corner = m.corner;
        }
        if (m.kind === "midline") {
            out.x1 = round(m.x1 - dx);
            out.y1 = round(m.y1 - dy);
            out.x2 = round(m.x2 - dx);
            out.y2 = round(m.y2 - dy);
        } else if (m.points) {
            out.points = m.points.map((p) => normPt(p, dx, dy));
            if (m.bump) {
                out.bump = m.bump.map((p) => normPt(p, dx, dy));
            }
        } else {
            out.cx = round(m.cx - dx);
            out.cy = round(m.cy - dy);
            out.r = round(m.r);
        }
        return out;
    };

    return {
        version: 1,
        padding: PADDING,
        source: "src/boards/eleven/source.svg",
        extractionNotes:
            "Move edges from solid Linien (fine ~4px sampling); shoot from dashed. Coincident Felder (inner goals, kick-off spot) merged into one play space each.",
        spaces: spacesOut,
        moveEdges: edges.moveEdges,
        shootEdges: edges.shootEdges,
        edgePaths: normalizeEdgePaths(edgePaths, dx, dy),
        markers: markers.map(normMarker),
        grassGrid: {
            originX: round(grassGrid.originX - dx),
            originY: round(grassGrid.originY - dy),
            cellW: round(grassGrid.cellW),
            cellH: round(grassGrid.cellH),
            cols: grassGrid.cols,
            rows: grassGrid.rows,
        },
    };
};

const validateGraph = (topology, draw, spacesRaw) => {
    const n = topology.spaces.length;
    const deg = new Array(n).fill(0);
    const add = (pairs) => {
        for (const [a, b] of pairs) {
            if (a === b) {
                throw new Error(`Self-edge at ${a}`);
            }
            deg[a]++;
            deg[b]++;
        }
    };
    add(topology.moveEdges);
    const shootDeg = new Array(n).fill(0);
    for (const [a, b] of topology.shootEdges) {
        shootDeg[a]++;
        shootDeg[b]++;
    }
    const goalIds = new Set();
    for (let i = 0; i < n; i++) {
        if (deg[i] === 0) {
            if (shootDeg[i] === 0) {
                throw new Error(`Space ${i} has no move or shoot edges`);
            }
            goalIds.add(i);
        }
    }
    if (goalIds.size !== 2) {
        throw new Error(`Expected 2 shoot-only goal mouths, got ${goalIds.size}`);
    }
    const adj = new Map();
    for (let i = 0; i < n; i++) {
        adj.set(i, []);
    }
    for (const [a, b] of topology.moveEdges) {
        adj.get(a).push(b);
        adj.get(b).push(a);
    }
    const seen = new Set();
    const stack = [0];
    while (stack.length > 0) {
        const v = stack.pop();
        if (seen.has(v)) {
            continue;
        }
        seen.add(v);
        for (const w of adj.get(v)) {
            if (!seen.has(w)) {
                stack.push(w);
            }
        }
    }
    const fieldNodes = n - goalIds.size;
    if (seen.size !== fieldNodes) {
        throw new Error(`Move graph has ${seen.size}/${fieldNodes} field nodes in main component`);
    }
    for (const g of goalIds) {
        if (seen.has(g)) {
            throw new Error(`Goal mouth ${g} should not be on solid move component from space 0`);
        }
    }
    validateFinePathEdges(draw, spacesRaw, topology.moveEdges);
    if (
        topology.shootEdges.length < EXPECTED.shootEdgesMin ||
        topology.shootEdges.length > EXPECTED.shootEdgesMax
    ) {
        throw new Error(
            `Expected ${EXPECTED.shootEdgesMin}–${EXPECTED.shootEdgesMax} shoot edges, got ${topology.shootEdges.length}`,
        );
    }

    const kinds = {};
    for (const m of topology.markers) {
        kinds[m.kind] = (kinds[m.kind] || 0) + 1;
    }
    const required = {
        centerCircle: 1,
        midline: 1,
        centerSpot: 1,
        penaltyMark: 2,
        penaltyArea: 2,
        goalArea: 2,
        cornerArc: 4,
    };
    for (const [k, c] of Object.entries(required)) {
        if (kinds[k] !== c) {
            throw new Error(`Expected ${c} markers of kind ${k}, got ${kinds[k] ?? 0}`);
        }
    }

    if (topology.edgePaths === undefined) {
        throw new Error("topology missing edgePaths");
    }
    const missingPaths = [];
    for (const [a, b] of topology.moveEdges) {
        const k = edgeKey(a, b);
        if (topology.edgePaths.move[k] === undefined) {
            missingPaths.push(`move:${k}`);
        }
    }
    for (const [a, b] of topology.shootEdges) {
        const k = edgeKey(a, b);
        if (topology.edgePaths.shoot[k] === undefined) {
            missingPaths.push(`shoot:${k}`);
        }
    }
    if (missingPaths.length > 0) {
        throw new Error(
            `${missingPaths.length} edge(s) missing Linien polyline (e.g. ${missingPaths.slice(0, 5).join(", ")})`,
        );
    }
};

const writeAdjacencySvg = (topology, outPath) => {
    const maxX = Math.max(...topology.spaces.map((s) => s.x + s.r)) + PADDING;
    const maxY = Math.max(...topology.spaces.map((s) => s.y + s.r)) + PADDING;
    const lines = [];
    for (const [a, b] of topology.moveEdges) {
        const sa = topology.spaces[a];
        const sb = topology.spaces[b];
        lines.push(
            `<line x1="${sa.x}" y1="${sa.y}" x2="${sb.x}" y2="${sb.y}" stroke="#c00" stroke-width="1" opacity="0.5"/>`,
        );
    }
    for (const [a, b] of topology.shootEdges) {
        const sa = topology.spaces[a];
        const sb = topology.spaces[b];
        lines.push(
            `<line x1="${sa.x}" y1="${sa.y}" x2="${sb.x}" y2="${sb.y}" stroke="#06c" stroke-width="1.5" opacity="0.8"/>`,
        );
    }
    const circles = topology.spaces.map(
        (s) =>
            `<circle id="eleven-space-${s.i}" cx="${s.x}" cy="${s.y}" r="${s.r}" fill="#eee" stroke="#333" stroke-width="1"/><text x="${s.x}" y="${s.y}" font-size="8" text-anchor="middle" dominant-baseline="central">${s.i}</text>`,
    );
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${maxX}" height="${maxY}" viewBox="0 0 ${maxX} ${maxY}">
  <rect width="100%" height="100%" fill="#fff"/>
  ${lines.join("\n  ")}
  ${circles.join("\n  ")}
</svg>`;
    fs.writeFileSync(outPath, svg);
};

const writeMarkersSvg = (topology, outPath) => {
    const maxX =
        topology.grassGrid.originX + topology.grassGrid.cols * topology.grassGrid.cellW + PADDING;
    const maxY =
        topology.grassGrid.originY + topology.grassGrid.rows * topology.grassGrid.cellH + PADDING;
    const parts = [];
    const { originX, originY, cellW, cellH, cols, rows } = topology.grassGrid;
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const x = originX + col * cellW;
            const y = originY + row * cellH;
            const fill = (row + col) % 2 === 0 ? "#d8f0a0" : "#b8e070";
            parts.push(`<rect x="${x}" y="${y}" width="${cellW}" height="${cellH}" fill="${fill}"/>`);
        }
    }
    for (const m of topology.markers) {
        if (m.kind === "midline") {
            parts.push(
                `<line x1="${m.x1}" y1="${m.y1}" x2="${m.x2}" y2="${m.y2}" stroke="#fff" stroke-width="3"/>`,
            );
        } else if (m.points) {
            const d = m.points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x} ${p.y}`).join(" ") + " Z";
            parts.push(`<path d="${d}" fill="none" stroke="#fff" stroke-width="2"/>`);
            if (m.bump && m.bump.length >= 2) {
                const bumpD = m.bump.map((p, i) => `${i === 0 ? "M" : "L"}${p.x} ${p.y}`).join(" ");
                parts.push(`<path d="${bumpD}" fill="none" stroke="#fff" stroke-width="2"/>`);
            }
        } else if (m.r) {
            parts.push(
                `<circle cx="${m.cx}" cy="${m.cy}" r="${m.r}" fill="none" stroke="#fff" stroke-width="2"/>`,
            );
        }
    }
    for (const s of topology.spaces) {
        parts.push(
            `<circle cx="${s.x}" cy="${s.y}" r="${s.r}" fill="none" stroke="#559f00" stroke-width="1.5"/>`,
        );
    }
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${maxX}" height="${maxY}" viewBox="0 0 ${maxX} ${maxY}">
  ${parts.join("\n  ")}
</svg>`;
    fs.writeFileSync(outPath, svg);
};

const main = () => {
    const { gameslibOut } = parseArgs();
    const draw = loadSvg();
    const spacesRaw = extractSpaces(draw);
    const edges = extractEdges(draw, spacesRaw);
    const edgePathsRaw = extractConnectionPolylines(draw, spacesRaw);
    const markers = extractMarkers(draw);
    const grassGrid = extractGrassGrid(draw);
    const norm = computeNormalize(spacesRaw, markers, grassGrid);
    const topology = normalizeTopology(spacesRaw, edges, markers, grassGrid, norm, edgePathsRaw);
    validateGraph(topology, draw, spacesRaw);

    fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
    fs.writeFileSync(OUT_JSON, JSON.stringify(topology, null, 2) + "\n");
    fs.mkdirSync(path.dirname(OUT_ADJ_SVG), { recursive: true });
    writeAdjacencySvg(topology, OUT_ADJ_SVG);
    writeMarkersSvg(topology, OUT_MARKERS_SVG);

    if (gameslibOut) {
        fs.mkdirSync(path.dirname(gameslibOut), { recursive: true });
        fs.writeFileSync(gameslibOut, JSON.stringify(topology, null, 2) + "\n");
        console.log("Wrote", gameslibOut);
    }

    console.log("Wrote", OUT_JSON);
    console.log("Wrote", OUT_ADJ_SVG);
    console.log("Wrote", OUT_MARKERS_SVG);
    console.log(
        `spaces=${topology.spaces.length} move=${topology.moveEdges.length} shoot=${topology.shootEdges.length}`,
    );
};

main();
