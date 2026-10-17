import type { AnnotationBasic, APRenderRep, ColourResolvable, RenderLabel } from "./schema.js";

export interface CompositeCellRef {
    panel: string;
    row: number;
    col: number;
}

/** Cross-panel annotation (`move`, `line`, `dots`, `outline`). */
export interface CompositeAnnotation {
    type: "move" | "line" | "dots" | "outline";
    targets: CompositeCellRef[];
    style?: "solid" | "dashed";
    strokeWidth?: number;
    opacity?: number;
    colour?: ColourResolvable;
    arrow?: boolean;
    anchors?: boolean;
    size?: number;
    dashed?: number[];
    dotShape?: NonNullable<AnnotationBasic["dotShape"]>;
    rotation?: number;
}

export type CompositePanelRotate = 0 | 90 | 180 | 270;

export type CompositeLayoutArrangement = "row" | "column" | "grid";

export type CompositeLayoutAlign = "start" | "center" | "end";

export interface APRenderCompositeLayout {
    arrangement: CompositeLayoutArrangement;
    /** Space between panels in default cell-size units (50px per unit). */
    gap?: number;
    /** Required when `arrangement` is `grid`. */
    columns?: number;
    align?: CompositeLayoutAlign;
}

export interface APRenderCompositePanel {
    id: string;
    label?: RenderLabel;
    rotate?: CompositePanelRotate;
    render: APRenderRep;
}

export interface APRenderComposite {
    kind: "composite";
    layout: APRenderCompositeLayout;
    panels: APRenderCompositePanel[];
    annotations?: CompositeAnnotation[];
}
