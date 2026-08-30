import { RendererBase } from "./_base.js";
import { DefaultRenderer } from "./default.js";
import { EntropyRenderer } from "./entropy.js";
import { HomeworldsOrigRenderer } from "./homeworldsOrig.js";
import { HomeworldsRenderer } from "./homeworlds.js";
import { StackingExpandingRenderer } from "./stackingExpanding.js";
import { Stacking3DRenderer } from "./stacking3D.js";
import { StackingOffsetRenderer } from "./stackingOffset.js";
import { StackingTilesRenderer } from "./stackingTiles.js";
import { FreespaceRenderer } from "./freespace.js";
import { SowingNumeralsRenderer } from "./sowingNumerals.js";
import { SowingPipsRenderer } from "./sowingPips.js";
import { ConhexRenderer } from "./conhex.js";
import { MulticellSquareRenderer } from "./multicellSquare.js";
import { PolyominoRenderer } from "./polyomino.js";
import { IsometricRenderer } from "./isometric.js";
import { TreePyramidRenderer } from "./treePyramid.js";

export {
    RendererBase as Renderer, DefaultRenderer, StackingOffsetRenderer, StackingTilesRenderer,
    StackingExpandingRenderer, HomeworldsOrigRenderer, HomeworldsRenderer, EntropyRenderer,
    FreespaceRenderer, SowingNumeralsRenderer, SowingPipsRenderer, ConhexRenderer,
    MulticellSquareRenderer, PolyominoRenderer, IsometricRenderer, TreePyramidRenderer,
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
    case IsometricRenderer.rendererName:
      return new IsometricRenderer();
    case TreePyramidRenderer.rendererName:
      return new TreePyramidRenderer();
    default:
      throw new Error(`Don't know a renderer called ${name}`);
  }
}
export {renderers};
