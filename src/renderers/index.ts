import { RendererBase } from "./_base";
import { DefaultRenderer } from "./default";
import { EntropyRenderer } from "./entropy";
import { HomeworldsRenderer } from "./homeworlds";
import { StackingExpandingRenderer } from "./stackingExpanding";
import { StackingOffsetRenderer } from "./stackingOffset";
import { StackingTilesRenderer } from "./stackingTiles";

export { RendererBase as Renderer, DefaultRenderer, StackingOffsetRenderer, StackingTilesRenderer, StackingExpandingRenderer, HomeworldsRenderer, EntropyRenderer };

const renderers: (name: string) => RendererBase = (name) =>{
  switch(name) {
    case DefaultRenderer.rendererName:
      return new DefaultRenderer();
    case StackingOffsetRenderer.rendererName:
      return new StackingOffsetRenderer();
    case StackingTilesRenderer.rendererName:
      return new StackingTilesRenderer();
    case StackingExpandingRenderer.rendererName:
      return new StackingExpandingRenderer();
    case HomeworldsRenderer.rendererName:
      return new HomeworldsRenderer();
    case EntropyRenderer.rendererName:
      return new EntropyRenderer();
    default:
      throw new Error(`Don't know a renderer called ${name}`);
  }
}
export {renderers};
