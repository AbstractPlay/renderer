import { RendererBase } from "../RendererBase";
import { DefaultRenderer } from "./default";

export { RendererBase as Renderer, DefaultRenderer };

const renderers = new Map<string, RendererBase>();
const rDefault = new DefaultRenderer();
renderers.set(rDefault.name, rDefault);
export {renderers};
