import { RendererBase } from "./_base";
import { DefaultRenderer } from "./default";
import { EntropyRenderer } from "./entropy";
import { HomeworldsOrigRenderer } from "./homeworldsOrig";
import { HomeworldsRenderer } from "./homeworlds";
import { StackingExpandingRenderer } from "./stackingExpanding";
import { Stacking3DRenderer } from "./stacking3D";
import { StackingOffsetRenderer } from "./stackingOffset";
import { StackingTilesRenderer } from "./stackingTiles";
import { FreespaceRenderer } from "./freespace";
import { SowingNumeralsRenderer } from "./sowingNumerals";
import { SowingPipsRenderer } from "./sowingPips";
import { ConhexRenderer } from "./conhex";
import { MulticellSquareRenderer } from "./multicellSquare";
import { PolyominoRenderer } from "./polyomino";

export {
    RendererBase as Renderer, DefaultRenderer, StackingOffsetRenderer, StackingTilesRenderer,
    StackingExpandingRenderer, HomeworldsOrigRenderer, HomeworldsRenderer, EntropyRenderer,
    FreespaceRenderer, SowingNumeralsRenderer, SowingPipsRenderer, ConhexRenderer,
    MulticellSquareRenderer, PolyominoRenderer,
};

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
    case Stacking3DRenderer.rendererName:
      return new Stacking3DRenderer();
    case HomeworldsOrigRenderer.rendererName:
      return new HomeworldsOrigRenderer();
    case HomeworldsRenderer.rendererName:
      return new HomeworldsRenderer();
    case EntropyRenderer.rendererName:
      return new EntropyRenderer();
    case FreespaceRenderer.rendererName:
      return new FreespaceRenderer();
    case SowingNumeralsRenderer.rendererName:
      return new SowingNumeralsRenderer();
    case SowingPipsRenderer.rendererName:
      return new SowingPipsRenderer();
    case ConhexRenderer.rendererName:
      return new ConhexRenderer();
    case MulticellSquareRenderer.rendererName:
      return new MulticellSquareRenderer();
    case PolyominoRenderer.rendererName:
      return new PolyominoRenderer();
    default:
      throw new Error(`Don't know a renderer called ${name}`);
  }
}
export {renderers};
