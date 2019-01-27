export default class Renderer {
    public readonly name: string;
    // The JSON data is compiled and validated before coming here.
    public json: object;

    constructor(name = "default") {
        this.name = name;
    }
}
