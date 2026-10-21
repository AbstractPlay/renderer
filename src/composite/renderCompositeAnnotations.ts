import type { G } from "@svgdotjs/svg.js";
import type { StrokeData } from "@svgdotjs/svg.js";
import { x2uid } from "../common/glyph2uid.js";
import type { IRenderCompositeOptions } from "../renderOptions.js";
import type { APRenderComposite, CompositeAnnotation } from "../schemas/composite.js";
import type { SquareClickMeta } from "./captureSquareClickMeta.js";
import { cellCenterInComposite } from "./cellCenter.js";
import type { PanelBBox, PanelPlacement } from "./layout.js";
import { resolveAnnotationColour } from "./resolveAnnotationColour.js";

type MeasuredPanel = {
    panel: APRenderComposite["panels"][number];
    bbox: PanelBBox;
    clickMeta?: SquareClickMeta;
};

const resolvePoints = (
    note: CompositeAnnotation,
    measured: MeasuredPanel[],
    placements: PanelPlacement[],
): { x: number; y: number }[] => {
    const points: { x: number; y: number }[] = [];
    for (const target of note.targets) {
        const m = measured.find((entry) => entry.panel.id === target.panel);
        const placement = placements.find((p) => p.panel.id === target.panel);
        if (m === undefined || placement === undefined || m.clickMeta === undefined) {
            throw new Error(
                `Cannot resolve composite annotation target on panel "${target.panel}" (square board required).`,
            );
        }
        const pt = cellCenterInComposite(m.clickMeta, m.bbox, placement, target.row, target.col);
        if (pt === undefined) {
            throw new Error(
                `Composite annotation target (${target.panel} row ${target.row}, col ${target.col}) could not be resolved.`,
            );
        }
        points.push(pt);
    }
    return points;
};

const strokeFromNote = (
    note: CompositeAnnotation,
    colour: string,
    cellsize: number,
): StrokeData => {
    let style: "solid" | "dashed" = "solid";
    let dasharray: string | undefined;
    if (note.style !== undefined) {
        style = note.style;
    }
    if (note.dashed !== undefined && Array.isArray(note.dashed)) {
        style = "dashed";
        dasharray = note.dashed.map((n) => n.toString()).join(" ");
    }
    let opacity = 1;
    if (note.opacity !== undefined) {
        opacity = note.opacity;
    }
    let strokeWidth = 0.03;
    if (note.strokeWidth !== undefined) {
        strokeWidth = note.strokeWidth;
    }
    const stroke: StrokeData = {
        color: colour,
        opacity,
        width: cellsize * strokeWidth,
        linecap: "round",
        linejoin: "round",
    };
    if (style === "dashed") {
        stroke.dasharray = dasharray ?? (4 * Math.ceil(strokeWidth / 0.03)).toString();
    }
    return stroke;
};

const referenceCellsize = (measured: MeasuredPanel[]): number => {
    for (const m of measured) {
        if (m.clickMeta !== undefined) {
            return m.clickMeta.cellsize;
        }
    }
    return 50;
};

const drawMoveOrLine = (
    parent: G,
    note: CompositeAnnotation,
    points: { x: number; y: number }[],
    colour: string,
    cellsize: number,
    withArrow: boolean,
): void => {
    const cloned = { ...note };
    if ("targets" in cloned) {
        // @ts-expect-error strip for uid
        delete cloned.targets;
    }
    const strokeWidth = note.strokeWidth ?? 0.03;
    const unit = strokeWidth / 0.03;
    const s = cellsize * strokeWidth / 2;
    const markerArrow = parent.marker(4 * unit + 3 * s, 4 * unit + 2 * s, (add) => add.path(`M${s},${s} L${s + 4 * unit},${s + 2 * unit} ${s},${s + 4 * unit} Z`).fill(colour)).attr({ "pointer-events": "none" }).addClass(`aprender-annotation-${x2uid(cloned)}`);
    const markerCircle = parent.marker(2 * unit + 2 * s, 2 * unit + 2 * s, (add) => add.circle(2 * unit).center(unit + s, unit + s).fill(colour)).attr({ "pointer-events": "none" }).addClass(`aprender-annotation-${x2uid(cloned)}`);

    let arrow = withArrow;
    if (note.arrow !== undefined) {
        arrow = note.arrow;
    }
    let anchors = true;
    if (note.anchors !== undefined) {
        anchors = note.anchors;
    }

    const poly = points.map((pt) => `${pt.x},${pt.y}`).join(" ");
    const line = parent.polyline(poly).addClass(`aprender-annotation-${x2uid(cloned)}`).stroke(strokeFromNote(note, colour, cellsize)).fill("none").attr({ "pointer-events": "none" });
    if (anchors) {
        line.marker("start", markerCircle);
    }
    if (arrow) {
        line.marker("end", markerArrow);
    } else if (anchors) {
        line.marker("end", markerCircle);
    }
};

const drawDots = (
    parent: G,
    note: CompositeAnnotation,
    points: { x: number; y: number }[],
    colour: string,
    cellsize: number,
): void => {
    const cloned = { ...note };
    // @ts-expect-error strip for uid
    delete cloned.targets;
    const opacity = note.opacity ?? 1;
    const diameter = note.size ?? 0.2;
    const dotShape = note.dotShape ?? "circle";

    for (const pt of points) {
        if (dotShape === "circle") {
            parent.circle(cellsize * diameter)
                .addClass(`aprender-annotation-${x2uid(cloned)}`)
                .fill(colour)
                .opacity(opacity)
                .stroke({ width: 0 })
                .center(pt.x, pt.y)
                .attr({ "pointer-events": "none" });
        } else if (dotShape === "ring" || dotShape === "ring-large") {
            const large = dotShape === "ring-large";
            const d = large ? diameter * 1.1 : diameter * 0.8;
            const strokeWidth = cellsize * d * 0.3;
            parent.circle(cellsize * d)
                .addClass(`aprender-annotation-${x2uid(cloned)}`)
                .fill("none")
                .opacity(opacity)
                .stroke({ color: colour, width: strokeWidth })
                .center(pt.x, pt.y)
                .attr({ "pointer-events": "none" });
        } else {
            parent.circle(cellsize * diameter)
                .addClass(`aprender-annotation-${x2uid(cloned)}`)
                .fill(colour)
                .opacity(opacity)
                .center(pt.x, pt.y)
                .attr({ "pointer-events": "none" });
        }
    }
};

export const renderCompositeAnnotations = (
    compositeGroup: G,
    json: APRenderComposite,
    measured: MeasuredPanel[],
    placements: PanelPlacement[],
    opts: IRenderCompositeOptions,
): void => {
    const annotations = json.annotations;
    if (annotations === undefined || annotations.length === 0) {
        return;
    }
    if (opts.showAnnotations !== true) {
        return;
    }

    const cellsize = referenceCellsize(measured);
    const layer = compositeGroup.group().id("ap-composite-annotations");

    for (const note of annotations) {
        const colour = resolveAnnotationColour(note.colour, opts);
        const points = resolvePoints(note, measured, placements);

        if (note.type === "move") {
            drawMoveOrLine(layer, note, points, colour, cellsize, true);
        } else if (note.type === "line") {
            drawMoveOrLine(layer, note, points, colour, cellsize, false);
        } else if (note.type === "dots") {
            drawDots(layer, note, points, colour, cellsize);
        } else if (note.type === "outline") {
            const cloned = { ...note };
            // @ts-expect-error strip for uid
            delete cloned.targets;
            let dasharray = "4";
            if (note.dashed !== undefined) {
                dasharray = note.dashed.join(" ");
            }
            layer.polygon(points.map((pt) => `${pt.x},${pt.y}`).join(" "))
                .addClass(`aprender-annotation-${x2uid(cloned)}`)
                .fill("none")
                .stroke({
                    color: colour,
                    width: cellsize * 0.05,
                    dasharray,
                    linecap: "round",
                    linejoin: "round",
                })
                .attr({ "pointer-events": "none" });
        }
    }
};
