import { RendererBase } from "../RendererBase";
import { DefaultRenderer } from "./default";
import { StackingOffsetRenderer } from "./stackingOffset";

export { RendererBase as Renderer, DefaultRenderer, StackingOffsetRenderer };

const renderers = new Map<string, RendererBase>();
const rDefault = new DefaultRenderer();
const rStackingOff = new StackingOffsetRenderer();
renderers.set(rDefault.name, rDefault);
renderers.set(rStackingOff.name, rStackingOff);
export {renderers};
