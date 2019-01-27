import svg from "svg.js";
import sheets from "./sheets";

export default class Renderer {
    public readonly name: string;

    constructor(name = "default") {
        this.name = name;
    }

    public render(json: object) {
        return;
    }
}
