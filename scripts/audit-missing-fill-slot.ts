/**
 * Audit duotone / fill+border glyphs missing fill-slot bindings (house regression pattern).
 */
import { SVG, registerWindow } from "@svgdotjs/svg.js";
import { createSVGWindow } from "svgdom";
import { contactSheets } from "../src/sheets/contact/index.js";
import { getGlyphDefinitionMeta, invokeGlyphBuild } from "../src/sheets/registry/defineGlyph.js";

const window = createSVGWindow();
registerWindow(window, window.document);
const canvas = SVG(window.document.documentElement).size(100, 100);

for (const sheet of contactSheets) {
    for (const [name, build] of sheet.glyphs) {
        const meta = getGlyphDefinitionMeta(sheet.name, name);
        const slots = meta?.slots;
        if (!slots?.fill || !slots?.border) {
            continue;
        }
        const sym = invokeGlyphBuild(build, canvas);
        const fillCount = sym.find('[data-slot-fill="fill"]').length;
        const legacyFill = sym.find("[data-playerfill=true]").length;
        const strokeAsFill = sym.find('[data-slot-stroke="fill"]').length;
        if (fillCount === 0 && legacyFill === 0 && strokeAsFill === 0) {
            console.log(`${sheet.name}/${name}`);
        }
    }
}
