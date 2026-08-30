import type { ColourResolvable } from "../schemas/schema.js";

export type ReferenceSide = "left" | "right" | "top" | "bottom";

export type SidebarAnchor = {
    layout: "sidebar";
    /** Edge of the artwork that attaches to the playfield. */
    attach: ReferenceSide;
};

export type AnnulusAnchor = {
    layout: "annulus";
    innerRadius: number;
    center: [number, number];
};

export type ReferenceAnchor = SidebarAnchor | AnnulusAnchor;

export type ReferenceStyleSlot = {
    role: "fill" | "stroke";
    default?: ColourResolvable;
};

export type ReferenceAsset = {
    id: string;
    svg: string;
    viewBox: { x: number; y: number; w: number; h: number };
    anchor: ReferenceAnchor;
    styleSlots?: Record<string, ReferenceStyleSlot>;
};

export type ResolvedReferenceArt = {
    viewBox: { x: number; y: number; w: number; h: number };
    anchor: ReferenceAnchor;
    fromLegend: boolean;
};

export type PlayfieldMetrics = {
    x: number;
    y: number;
    width: number;
    height: number;
    cx: number;
    cy: number;
    hullRadius: number;
};

export type ReferencePlacement = {
    x: number;
    y: number;
    width: number;
    height: number;
};
