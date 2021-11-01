import { RendererBase } from "./_base";
import { DefaultRenderer } from "./default";
import { EntropyRenderer } from "./entropy";
import { HomeworldsRenderer } from "./homeworlds";
import { StackingOffsetRenderer } from "./stackingOffset";
import { StackingTilesRenderer } from "./stackingTiles";

export { RendererBase as Renderer, DefaultRenderer, StackingOffsetRenderer, StackingTilesRenderer, HomeworldsRenderer, EntropyRenderer };

const renderers = new Map<string, RendererBase>();
const rDefault = new DefaultRenderer();
const rStackingOff = new StackingOffsetRenderer();
const rStackingTiles = new StackingTilesRenderer();
const rHomeworlds = new HomeworldsRenderer();
const rEntropy = new EntropyRenderer();
renderers.set(rDefault.name, rDefault);
renderers.set(rStackingOff.name, rStackingOff);
renderers.set(rStackingTiles.name, rStackingTiles);
renderers.set(rHomeworlds.name, rHomeworlds);
renderers.set(rEntropy.name, rEntropy);
export {renderers};
