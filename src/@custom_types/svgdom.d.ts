declare module "svgdom" {
    export function createSVGWindow(): Window & { document: Document };
}
