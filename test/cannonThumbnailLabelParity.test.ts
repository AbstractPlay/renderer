import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect } from "chai";
import "mocha";
import { DefaultRenderer } from "../src/renderers/default";
import type { APRenderRep } from "../src/schemas/schema";
import { coreRenderOptions, makeDraw } from "./helpers/renderTestDraw";

const fixtureDir = join(dirname(fileURLToPath(import.meta.url)), "fixtures", "thumbnails");

/** From https://thumbnails.abstractplay.com/cannon-light.svg coordinate labels (implicit 16px). */
const LEGACY_CANNON_LABEL_BBOX_HEIGHT = 21.7890625;

function coordinateLabelBBoxHeights(draw: ReturnType<typeof makeDraw>): number[] {
    const doc = draw.node.ownerDocument;
    const group = doc.querySelector('[id$="labels"]');
    const texts = group?.querySelectorAll("text") ?? [];
    const heights: number[] = [];
    for (const node of texts) {
        heights.push((node as SVGGraphicsElement).getBBox().height);
    }
    return heights;
}

describe("cannon thumbnail label parity", () => {
    it("matches legacy thumbnail coordinate label size for cannon.json", () => {
        const raw = readFileSync(join(fixtureDir, "cannon.json"), "utf8");
        const rep = JSON.parse(raw) as APRenderRep;

        const renderer = new DefaultRenderer();
        const draw = makeDraw();
        renderer.render(rep, draw, coreRenderOptions);

        expect(renderer.boardLabelFontSize()).to.equal(16);

        const svg = draw.svg();
        const fontSizes = [...svg.matchAll(/font-size="([0-9.]+)"/g)].map((m) =>
            Number.parseFloat(m[1]!),
        );
        expect(fontSizes.length).to.be.greaterThan(0);
        for (const size of fontSizes) {
            expect(size).to.equal(16);
        }

        const heights = coordinateLabelBBoxHeights(draw);
        expect(heights).to.have.length(40);
        for (const h of heights) {
            expect(h).to.be.closeTo(LEGACY_CANNON_LABEL_BBOX_HEIGHT, 0.01);
        }
    });
});
