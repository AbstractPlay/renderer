import { RendererBase } from "../RendererBase";
import { DefaultRenderer } from "./default";
import { StackingOffsetRenderer } from "./stackingOffset";
import { StackingTilesRenderer } from "./stackingTiles";

export { RendererBase as Renderer, DefaultRenderer, StackingOffsetRenderer, StackingTilesRenderer };

const renderers = new Map<string, RendererBase>();
const rDefault = new DefaultRenderer();
const rStackingOff = new StackingOffsetRenderer();
const rStackingTiles = new StackingTilesRenderer();
renderers.set(rDefault.name, rDefault);
renderers.set(rStackingOff.name, rStackingOff);
renderers.set(rStackingTiles.name, rStackingTiles);
export {renderers};
