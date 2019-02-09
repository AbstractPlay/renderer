import { RendererBase } from "../RendererBase";
import { DefaultRenderer } from "./default";

export { RendererBase as Renderer, DefaultRenderer };

const renderers = new Map<string, RendererBase>();
renderers.set(DefaultRenderer.name, new DefaultRenderer());
export {renderers};
