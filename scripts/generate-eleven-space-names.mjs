/**
 * Derive three human-facing naming schemes per space index from topology.json.
 *
 * Usage: node scripts/generate-eleven-space-names.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const TOPOLOGY = path.join(REPO_ROOT, "src/boards/eleven/topology.json");
const OUT_JSON = path.join(REPO_ROOT, "src/boards/eleven/space-names.json");
const OUT_MD = path.join(REPO_ROOT, "src/boards/eleven/names.md");

const pointInPoly = (x, y, points) => {
    let inside = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
        const xi = points[i].x;
        const yi = points[i].y;
        const xj = points[j].x;
        const yj = points[j].y;
        const intersect =
            yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
        if (intersect) {
            inside = !inside;
        }
    }
    return inside;
};

const point = (p) => ({ x: p.x ?? p.cx, y: p.y ?? p.cy });
const dist = (a, b) => {
    const pa = point(a);
    const pb = point(b);
    return Math.hypot(pa.x - pb.x, pa.y - pb.y);
};

const bearing = (cx, cy, x, y) => {
    const rad = Math.atan2(x - cx, -(y - cy));
    let deg = (rad * 180) / Math.PI;
    if (deg < 0) {
        deg += 360;
    }
    return deg;
};

const pad2 = (n) => String(n).padStart(2, "0");
const pad3 = (n) => String(n).padStart(3, "0");

const classifyRegions = (topology) => {
    const { spaces, markers } = topology;
    const midX = markers.find((m) => m.kind === "midline").x1;
    const centerCircle = markers.find((m) => m.kind === "centerCircle");
    const centerSpot = markers.find((m) => m.kind === "centerSpot");
    const goalW = markers.find((m) => m.kind === "goalArea" && m.side === "w");
    const goalE = markers.find((m) => m.kind === "goalArea" && m.side === "e");
    const penW = markers.find((m) => m.kind === "penaltyArea" && m.side === "w");
    const penE = markers.find((m) => m.kind === "penaltyArea" && m.side === "e");

    const kickoff = spaces.reduce((best, s) =>
        dist(s, centerSpot) < dist(best, centerSpot) ? s : best,
    );

    const region = spaces.map((s) => {
        const half = s.x < midX ? "w" : s.x > midX ? "e" : s.i === kickoff.i ? "c" : s.x < midX ? "w" : "e";
        const inGoalW = pointInPoly(s.x, s.y, goalW.points);
        const inGoalE = pointInPoly(s.x, s.y, goalE.points);
        const inPenW = pointInPoly(s.x, s.y, penW.points);
        const inPenE = pointInPoly(s.x, s.y, penE.points);
        const inCenterCircle =
            dist(s, centerCircle) <= centerCircle.r + s.r * 0.5;
        const isKickoff = s.i === kickoff.i;

        let zone = "field";
        if (isKickoff) {
            zone = "kickoff";
        } else if (inGoalW || inGoalE) {
            zone = "goal";
        } else if (inPenW || inPenE) {
            zone = "penalty";
        } else if (inCenterCircle) {
            zone = "center";
        }

        return {
            i: s.i,
            x: s.x,
            y: s.y,
            half,
            zone,
            inGoalW,
            inGoalE,
            inPenW,
            inPenE,
            inCenterCircle,
            isKickoff,
        };
    });

    const scoreSpaces = (side) => {
        const goal = side === "w" ? goalW : goalE;
        const pen = side === "w" ? penW : penE;
        const gx = goal.points.reduce((s, p) => s + p.x, 0) / goal.points.length;
        const candidates = region.filter(
            (r) =>
                pointInPoly(r.x, r.y, pen.points) &&
                !pointInPoly(r.x, r.y, goal.points) &&
                r.zone === "penalty",
        );
        candidates.sort((a, b) =>
            side === "w" ? a.x - b.x : b.x - a.x,
        );
        return new Set(candidates.slice(0, 3).map((c) => c.i));
    };

    const scoreW = scoreSpaces("w");
    const scoreE = scoreSpaces("e");

    return { region, midX, centerCircle, centerSpot, kickoff, scoreW, scoreE, goalW, goalE, penW, penE };
};

const stableId = (i) => `e${pad2(i + 1)}`;

const pitchIds = (topology, ctx) => {
    const { region, centerCircle } = ctx;
    const bands = { w: {}, e: {}, c: {} };
    const bandKey = (r) => {
        if (r.isKickoff) {
            return "c-K";
        }
        if (r.zone === "goal") {
            return `${r.inGoalW ? "w" : "e"}-G`;
        }
        if (r.zone === "penalty") {
            return `${r.inPenW ? "w" : "e"}-P`;
        }
        if (r.zone === "center") {
            return "c-C";
        }
        return `${r.half}-F`;
    };

    const sorted = [...region].sort((a, b) => a.i - b.i);
    const groups = new Map();
    for (const r of sorted) {
        const key = bandKey(r);
        if (!groups.has(key)) {
            groups.set(key, []);
        }
        groups.get(key).push(r);
    }

    const pitch = new Map();
    for (const [key, list] of groups) {
        const anchor =
            key === "c-K"
                ? ctx.centerSpot
                : key.endsWith("-G")
                  ? {
                        x: key.startsWith("w") ? ctx.goalW.points[1].x : ctx.goalE.points[0].x,
                        y: (ctx.goalW.points[0].y + ctx.goalW.points[2].y) / 2,
                    }
                  : centerCircle;
        list.sort(
            (a, b) =>
                bearing(anchor.x, anchor.y, a.x, a.y) -
                bearing(anchor.x, anchor.y, b.x, b.y),
        );
        list.forEach((r, idx) => {
            if (key === "c-K") {
                pitch.set(r.i, "K");
            } else {
                const label = key.replace(/^w-/, "W-").replace(/^e-/, "E-");
                pitch.set(r.i, `${label}-${pad2(idx + 1)}`);
            }
        });
    }
    return pitch;
};

const rulesIds = (topology, ctx) => {
    const { region, kickoff, scoreW, scoreE, centerCircle, goalW, goalE, penW, penE } = ctx;
    const rules = new Map();
    rules.set(kickoff.i, "kickoff");

    const goalList = (side) =>
        region
            .filter((r) => (side === "w" ? r.inGoalW : r.inGoalE))
            .sort((a, b) => a.x - b.x || a.y - b.y);

    const gw = goalList("w");
    gw.forEach((r, idx) => rules.set(r.i, `goal-W-${idx + 1}`));
    const ge = goalList("e");
    ge.forEach((r, idx) => rules.set(r.i, `goal-E-${idx + 1}`));

    const centerList = region
        .filter((r) => r.inCenterCircle && !r.isKickoff)
        .sort(
            (a, b) =>
                bearing(centerCircle.cx, centerCircle.cy, a.x, a.y) -
                bearing(centerCircle.cx, centerCircle.cy, b.x, b.y),
        );
    centerList.forEach((r, idx) => rules.set(r.i, `center-${idx + 1}`));

    const penList = (side) => {
        const pen = side === "w" ? penW : penE;
        const goal = side === "w" ? goalW : goalE;
        return region
            .filter(
                (r) =>
                    pointInPoly(r.x, r.y, pen.points) &&
                    !pointInPoly(r.x, r.y, goal.points) &&
                    !scoreW.has(r.i) &&
                    !scoreE.has(r.i) &&
                    r.zone === "penalty",
            )
            .sort((a, b) => b.y - a.y || a.x - b.x);
    };
    penList("w").forEach((r, idx) => rules.set(r.i, `penalty-W-${idx + 1}`));
    penList("e").forEach((r, idx) => rules.set(r.i, `penalty-E-${idx + 1}`));

    Array.from(scoreW)
        .sort((a, b) => a - b)
        .forEach((spaceIndex, idx) => rules.set(spaceIndex, `score-W-${idx + 1}`));
    Array.from(scoreE)
        .sort((a, b) => a - b)
        .forEach((spaceIndex, idx) => rules.set(spaceIndex, `score-E-${idx + 1}`));

    const fieldList = (side) =>
        region
            .filter(
                (r) =>
                    !rules.has(r.i) &&
                    (side === "w" ? r.x < ctx.midX : r.x > ctx.midX),
            )
            .sort((a, b) => a.y - b.y || a.x - b.x);

    fieldList("w").forEach((r, idx) => rules.set(r.i, `field-W-${pad2(idx + 1)}`));
    fieldList("e").forEach((r, idx) => rules.set(r.i, `field-E-${pad2(idx + 1)}`));

    for (const r of region) {
        if (!rules.has(r.i)) {
            rules.set(r.i, `field-mid-${pad2(r.i + 1)}`);
        }
    }
    return rules;
};

const buildMarkdown = (rows) => {
    const lines = [
        "# Eleven board — space naming (preview)",
        "",
        "Three **derived** schemes for the same 68 spaces (`topology.json` indices `0`–`67`).",
        "None of these are canonical yet; pick one (or a subset) for gameslib / move notation.",
        "",
        "Regenerate: `node scripts/generate-eleven-space-names.mjs`",
        "",
        "## A — Stable (`e01`…`e68`)",
        "",
        "- Sort order: geography `(y, x)` — same as topology index.",
        "- `e` + two-digit **1-based** index (`e01` = index `0`).",
        "- Best for: logs, tests, compact storage, no board orientation.",
        "",
        "## B — Pitch-oriented",
        "",
        "- **Half:** `W` / `E` from midfield line (`midline` marker); center-band uses `c-` prefix.",
        "- **Band:** `G` goal, `P` penalty, `C` center circle, `F` open field, `K` kick-off (alone).",
        "- **Index:** clockwise sweep within each band from a band anchor (goal mouth, center, etc.).",
        "- Examples: `W-F-03`, `E-P-2`, `c-C-04`, `K`.",
        "",
        "## C — Rules-inspired (not official notation)",
        "",
        "- Labels derived from rule **concepts** on the [Spielstein 11 rules](https://spielstein.com/games/11/rules) page",
        "  (e.g. “kick-off space”, “goal space”, “penalty area”, “7 dark spaces”) — that page has **no** coordinate or space IDs.",
        "- Scheme C maps those ideas to ids: `kickoff`, `goal-W|E-n`, `center-1`…`7`, `penalty-W|E-n`,",
        "  `score-W|E-n` (three shoot-from spaces per end — nearest to goal line inside penalty),",
        "  `field-W|E-nn` elsewhere on that half.",
        "- Orientation: **W** = left goal on the board art, **E** = right (defending ends).",
        "",
        "## Comparison",
        "",
        "| Index | Stable | Pitch | Rules-inspired |",
        "|------:|--------|-------|----------|",
    ];
    for (const row of rows) {
        lines.push(`| ${row.i} | ${row.stable} | ${row.pitch} | ${row.rules} |`);
    }
    lines.push("");
    lines.push("Machine-readable: [`space-names.json`](space-names.json).");
    return lines.join("\n");
};

const main = () => {
    const topology = JSON.parse(fs.readFileSync(TOPOLOGY, "utf8"));
    const ctx = classifyRegions(topology);
    const pitch = pitchIds(topology, ctx);
    const rules = rulesIds(topology, ctx);

    const rows = topology.spaces.map((s) => ({
        i: s.i,
        x: s.x,
        y: s.y,
        stable: stableId(s.i),
        pitch: pitch.get(s.i),
        rules: rules.get(s.i),
        zone: ctx.region[s.i].zone,
        half: ctx.region[s.i].half,
    }));

    const out = {
        version: 1,
        source: "src/boards/eleven/topology.json",
        schemes: {
            stable: {
                description: "e01–e68 by geographic sort (y, then x); eNN = index NN-1",
            },
            pitch: {
                description: "Half-band-index (W|E + G|P|C|F or c-*); K = kickoff",
            },
            rules: {
                description: "Spielstein rule terms; W/E = board left/right goals",
            },
        },
        spaces: rows,
    };

    fs.writeFileSync(OUT_JSON, JSON.stringify(out, null, 2) + "\n");
    fs.writeFileSync(OUT_MD, buildMarkdown(rows) + "\n");
    console.log("Wrote", OUT_JSON);
    console.log("Wrote", OUT_MD);
};

main();
