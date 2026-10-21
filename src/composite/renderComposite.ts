import { NumberAlias, SVG, Svg } from "@svgdotjs/svg.js";
import {
    AREA_TITLE_PAD_EM,
    areaTitleBand,
    measureAreaTitle,
    placeTextInkTop,
} from "../common/areaLabelText.js";
import { labelDisplayText } from "../common/renderLabel.js";
import { formatAJVErrors, renderRep, unionLayoutBBox } from "../renderRep.js";
import type { IRenderCompositeOptions } from "../renderOptions.js";
import type { APRenderComposite } from "../schemas/composite.js";
import schema from "../schemas/schema.json" with { type: "json" };
import AjvImport from "ajv";
import type { ValidateFunction } from "ajv";
import { clearPanelScratch, composePanelLive } from "./composePanelLive.js";
import { captureSquareClickMeta, type SquareClickMeta } from "./captureSquareClickMeta.js";
import { boardRotateFromRender } from "./compositePanelRotation.js";
import {
    COMPOSITE_LABEL_FONT_SIZE,
    compositeExtent,
    gapPixels,
    layoutCompositePanels,
    type PanelBBox,
} from "./layout.js";
import { renderCompositeAnnotations } from "./renderCompositeAnnotations.js";
import { validateComposite } from "./validateComposite.js";
import { validateCompositeAnnotationTargets } from "./validateCompositeAnnotations.js";

type AjvInstance = {
    compile(jsonSchema: object): ValidateFunction;
};
const ajvCtor = AjvImport as unknown as new () => AjvInstance;
const validateRep = new ajvCtor().compile(schema);

const MOZILLA_VIEWBOX_PAD = 2;

const createRootDraw = (opts: IRenderCompositeOptions): Svg => {
    if (("target" in opts) && (opts.target != null)) {
        return opts.target;
    }
    if (("divelem" in opts) && (opts.divelem != null)) {
        let height: NumberAlias = "100%";
        let width: NumberAlias = "100%";
        if (("height" in opts) && (opts.height !== null) && (opts.height !== undefined)) {
            height = opts.height;
        }
        if (("width" in opts) && (opts.width !== null) && (opts.width !== undefined)) {
            width = opts.width;
        }
        let svgid = "_apstatic";
        if (("svgid" in opts) && (opts.svgid !== undefined) && (opts.svgid.length > 0)) {
            svgid = opts.svgid;
        }
        return SVG().addTo(opts.divelem).size(width, height).id(svgid);
    }

    let height: NumberAlias = "100%";
    let width: NumberAlias = "100%";
    if (("height" in opts) && (opts.height !== null) && (opts.height !== undefined)) {
        height = opts.height;
    }
    if (("width" in opts) && (opts.width !== null) && (opts.width !== undefined)) {
        width = opts.width;
    }
    let svgid = "_aprender";
    if (("svgid" in opts) && (opts.svgid !== undefined) && (opts.svgid.length > 0)) {
        svgid = opts.svgid;
    }
    if (opts.divid === undefined) {
        throw new Error("No target for the rendered SVG was given.");
    }
    return SVG().addTo("#" + opts.divid).size(width, height).id(svgid);
};

const clearSvg = (draw: Svg): void => {
    clearPanelScratch(draw);
};

const panelMeasureOpts = (
    opts: IRenderCompositeOptions,
): Omit<IRenderCompositeOptions, "target" | "divid" | "divelem" | "boardClick" | "boardHover"> => {
    const copy = { ...opts };
    delete copy.target;
    delete copy.divid;
    delete copy.divelem;
    delete copy.boardClick;
    delete copy.boardHover;
    return copy;
};

/** Layout-only render (no click/hover handlers). */
const measurePanel = (
    draw: Svg,
    json: APRenderComposite,
    opts: IRenderCompositeOptions,
    panelIndex: number,
): { bbox: PanelBBox; clickMeta?: SquareClickMeta } => {
    const panel = json.panels[panelIndex]!;

    clearSvg(draw);
    renderRep(panel.render, {
        ...panelMeasureOpts(opts),
        target: draw,
        rotate: panel.rotate ?? 0,
        showAnnotations: opts.showAnnotations,
    }, validateRep);

    const layoutBox = unionLayoutBBox(draw);
    const clickMeta = captureSquareClickMeta(
        draw,
        panel.render,
        panel.rotate ?? 0,
        boardRotateFromRender(panel.render),
    );
    clearSvg(draw);
    return { bbox: layoutBox, clickMeta };
};

/**
 * Render multiple independent boards into one SVG.
 * @beta
 */
export const renderComposite = (json: APRenderComposite, opts = {} as IRenderCompositeOptions): Svg => {
    if (!validateComposite(json)) {
        throw new Error(`The composite json object does not validate against the composite schema. The validator said the following:\n${formatAJVErrors(validateComposite.errors ?? [])}`);
    }

    for (const panel of json.panels) {
        if (!validateRep(panel.render)) {
            throw new Error(`Panel "${panel.id}" render does not validate: ${formatAJVErrors(validateRep.errors ?? [])}`);
        }
    }
    validateCompositeAnnotationTargets(json);

    const compositeRotate = (opts as { rotate?: number }).rotate;
    if (compositeRotate !== undefined && compositeRotate !== 0) {
        throw new Error("Composite renders do not support opts.rotate; set panels[].rotate in the JSON instead.");
    }

    const draw = createRootDraw(opts);

    const measured = json.panels.map((panel, index) => {
        const { bbox, clickMeta } = measurePanel(draw, json, opts, index);
        return { panel, bbox, clickMeta };
    });

    clearSvg(draw);
    const compositeGroup = draw.group().id("ap-composite-panels");
    const gapPx = gapPixels(json.layout);

    const labelColour = opts.colourContext?.labels ?? "#000";

    const panelLabelBand = (panel: APRenderComposite["panels"][number]): number => {
        if (panel.label === undefined) {
            return 0;
        }
        const text = labelDisplayText(panel.label);
        const ink = measureAreaTitle(draw, text, COMPOSITE_LABEL_FONT_SIZE, labelColour);
        return areaTitleBand(ink.height, COMPOSITE_LABEL_FONT_SIZE);
    };

    const maxLabelBand = Math.max(
        0,
        ...json.panels.map((panel) => panelLabelBand(panel)),
    );

    const placements = layoutCompositePanels(
        measured.map(({ panel, bbox }) => ({
            panel,
            bbox,
            labelBand: panel.label !== undefined ? maxLabelBand : 0,
        })),
        json.layout,
        gapPx,
    );

    for (const placement of placements) {
        const measuredPanel = measured.find((m) => m.panel.id === placement.panel.id);
        if (measuredPanel === undefined) {
            continue;
        }
        const { bbox } = measuredPanel;
        const translateX = placement.boardX - bbox.x;
        const translateY = placement.boardTop - bbox.y;

        if (placement.panel.label !== undefined) {
            const labelText = labelDisplayText(placement.panel.label);
            const inkTop = placement.cellY + COMPOSITE_LABEL_FONT_SIZE * AREA_TITLE_PAD_EM;
            placeTextInkTop(
                compositeGroup,
                labelText,
                placement.cellX + placement.cellWidth / 2,
                inkTop,
                { size: COMPOSITE_LABEL_FONT_SIZE, anchor: "middle", fill: labelColour },
                "aprender-composite-panel-label",
            );
        }

        const panelGroup = compositeGroup
            .group()
            .attr("data-panel-id", placement.panel.id)
            .id(`panel-${placement.panel.id}`)
            .transform({ translate: [translateX, translateY] });

        compositeGroup.remove();
        composePanelLive(draw, panelGroup, placement.panel, opts, validateRep);
        draw.add(compositeGroup);
    }

    renderCompositeAnnotations(compositeGroup, json, measured, placements, opts);

    const pad = MOZILLA_VIEWBOX_PAD;
    let usedMeasuredViewBox = false;
    try {
        const composed = compositeGroup.rbox(draw);
        if (composed.width > 0 && composed.height > 0) {
            draw.viewbox(composed.x - pad, composed.y - pad, composed.width + pad * 2, composed.height + pad * 2);
            usedMeasuredViewBox = true;
        }
    } catch {
        // svgdom may not compute rbox on composed groups after live panel adoption
    }
    if (!usedMeasuredViewBox) {
        const extent = compositeExtent(placements);
        draw.viewbox(-pad, -pad, extent.width + pad * 2, extent.height + pad * 2);
    }

    return draw;
};
