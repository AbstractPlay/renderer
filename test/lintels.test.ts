import { expect } from "chai";
import "mocha";
import Ajv from "ajv";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const schema = require("../src/schemas/schema.json");
import {
    allHexLintelPieces,
    boardHexOrientation,
    drawnHexEdges,
    effectiveLintelPiece,
    hexLintelName,
    parseLintelPiece,
    remapHexEdgesBetweenOrientations,
    resolveHexLintelDrawnEdges,
    sortByCanonicalOrder,
} from "../src/renderers/isometric/lintels";
import { Orientation } from "honeycomb-grid";

describe("hex lintel naming", () => {
    it("should round-trip every generated lintel name", () => {
        for (const name of allHexLintelPieces()) {
            const parsed = parseLintelPiece(name);
            expect(parsed).to.not.equal(null);
            if (parsed === null || parsed.kind !== "hex") {
                throw new Error(`expected hex lintel for ${name}`);
            }
            const rebuilt = hexLintelName(parsed.orientation, parsed.omitted);
            expect(rebuilt).to.equal(name);
        }
    });

    it("should sort omitted edges in canonical clockwise order", () => {
        expect(hexLintelName("f", sortByCanonicalOrder("f", ["S", "N"]))).to.equal("lintelf_N_S");
    });

    it("should rotate lintelp_NE by one quarter-turn to lintelp_SE", () => {
        expect(effectiveLintelPiece("lintelp_NE", 1)).to.equal("lintelp_SE");
    });

    it("should rotate lintelp_E by one quarter-turn to lintelp_SW", () => {
        expect(effectiveLintelPiece("lintelp_E", 1)).to.equal("lintelp_SW");
    });

    it("should return to lintelp_NE after four quarter-turns", () => {
        expect(effectiveLintelPiece("lintelp_NE", 4)).to.equal("lintelp_NE");
    });

    it("should keep lintelf_N_S unchanged after two quarter-turns", () => {
        expect(effectiveLintelPiece("lintelf_N_S", 2)).to.equal("lintelf_N_S");
    });

    it("should map full omission to spaceHex", () => {
        expect(hexLintelName("p", ["NE", "E", "SE", "SW", "W", "NW"])).to.equal("spaceHex");
        expect(parseLintelPiece("spaceHex")!.omitted).to.have.length(6);
    });

    it("should omit only the named edge in drawnHexEdges", () => {
        expect(drawnHexEdges("p", ["E"])).to.deep.equal(["NE", "SE", "SW", "W", "NW"]);
        expect(drawnHexEdges("p", ["W"])).to.deep.equal(["NE", "E", "SE", "SW", "NW"]);
    });

    it("should remap pointy edge labels to flat equivalents", () => {
        expect(remapHexEdgesBetweenOrientations("p", "f", ["E", "W"])).to.deep.equal(["NE", "SW"]);
    });

    it("should resolve lintelp_E at 90 degrees to flat geometry with S omitted", () => {
        const resolved = resolveHexLintelDrawnEdges("p", ["E"], 1);
        expect(resolved.orientation).to.equal(Orientation.FLAT);
        expect(resolved.drawnEdges).to.deep.equal(["N", "NE", "SE", "SW", "NW"]);
    });

    it("should use pointy board orientation at zero rotations", () => {
        expect(boardHexOrientation(0)).to.equal(Orientation.POINTY);
        expect(boardHexOrientation(2)).to.equal(Orientation.POINTY);
        expect(boardHexOrientation(1)).to.equal(Orientation.FLAT);
    });
});

describe("spacer isoPiece schema", () => {
    const ajv = new Ajv();

    it("should validate spaceCube without colour", () => {
        const data = {
            renderer: "isometric",
            board: { style: "squares", width: 1, height: 1 },
            legend: { S: { piece: "spaceCube", height: 30 } },
            pieces: [[["S"]]],
        };
        expect(ajv.validate(schema, data)).to.equal(true);
    });

    it("should validate spaceHex without colour", () => {
        const data = {
            renderer: "isometric",
            board: { style: "hex-of-hex", minWidth: 2, maxWidth: 4 },
            legend: { S: { piece: "spaceHex", height: 30 } },
            pieces: [[["S"]]],
        };
        expect(ajv.validate(schema, data)).to.equal(true);
    });
});
