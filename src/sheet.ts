import { Nested } from "svg.js";

export default interface ISheet {
    readonly name: string;
    readonly description: string;
    readonly glyphs: Map<string, (svg: Nested) => void>;
}
