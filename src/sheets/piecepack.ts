import svg from "svg.js";
import { ISheet } from "../ISheet";

const sheet: ISheet = {
    name: "piecepack",
    // tslint:disable-next-line:object-literal-sort-keys
    description: "Core Piecepack graphics set",
    cellsize: 100,
    glyphs: new Map<string, (canvas: svg.Nested) => void>(),
};

// Alphabetize by glyph name, please!
// The element's root `id` must be the same as its map key.
// If using groups to make complex glyphs, be sure to include the attribute `data-cellsize` (the greater of width and height) so the renderer can scale it properly.

sheet.glyphs.set("piecepack-numbers-0", (canvas: svg.Nested) => {
    const group = canvas.group()
        .id("piecepack-numbers-0")
        .attr("data-cellsize", 800);
    group.rect(800, 800).fill({opacity: 0});
    group.path("M65.5,401c0,106,29.7,190.3,89,253s141.7,94,247,94c104.7,0,186.3-31.3,245-94s88-147,88-253c0-106.7-28.7-191-86-253 c-58.7-64-141-96-247-96c-105.3,0-187.7,31.7-247,95S65.5,295,65.5,401z M318.5,401c0-62.7,3.3-108.3,10-137 c13.3-40.7,37.7-61,73-61c39.3,0,64.3,25.3,75,76c4,19.3,6,60,6,122c0,64-2,104.7-6,122c-10,50-35,75-75,75 c-32,0-53.8-12.8-65.5-38.5S318.5,481,318.5,401z")
        .attr("data-playerfill", true)
        .stroke({width: 5, color: "#000"})
        .fill("#000");
});

export { sheet as PiecepackSheet };
