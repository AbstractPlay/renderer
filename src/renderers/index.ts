import Renderer from "../renderer";
import DefaultRenderer from "./default";

const renderers = new Map<string, Renderer>();
renderers.set(DefaultRenderer.name, DefaultRenderer);
export default renderers;
