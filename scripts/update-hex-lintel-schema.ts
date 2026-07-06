import * as fs from "fs";
import * as path from "path";
import { allHexLintelPieces } from "../src/renderers/isometric/lintels";

const schemaPath = path.join(__dirname, "../src/schemas/schema.json");
const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8")) as {
    $defs: {
        isometricPieces: { enum: string[]; description?: string };
        isoPiece: { oneOf: unknown[] };
    };
};

const basePieces = [
    "cube",
    "cylinder",
    "cone",
    "pyramid",
    "hexp",
    "hexf",
    "lintelN",
    "lintelE",
    "lintelS",
    "lintelW",
    "lintelNS",
    "lintelEW",
    "spaceCube",
    "spaceHex",
    ...allHexLintelPieces(),
];

schema.$defs.isometricPieces.enum = basePieces;
schema.$defs.isometricPieces.description =
    "The types of pieces supported in an isometric legend. Hex lintel entries (lintelp_*, lintelf_*) are generated from src/renderers/isometric/lintels.ts.";

const spacerBranch = {
    description: "Invisible spacer (occupies stack slot, draws no strokes or fills).",
    type: "object",
    properties: {
        piece: { enum: ["spaceCube", "spaceHex"] },
        height: {
            description: "Vertical edge length in symbol units (top face is always 100). When omitted, defaults to a proper cube.",
            type: "number",
            minimum: 0,
            default: 0,
        },
        scale: {
            description: "As a percentage of the cell size. By default, pieces are shrunk by 25% within the cell.",
            type: "number",
            minimum: 0,
            default: 0.75,
        },
    },
    required: ["piece"],
    additionalProperties: false,
};

const isoPiece = schema.$defs.isoPiece;
const hasSpacerBranch = isoPiece.oneOf.some(
    (branch) =>
        typeof branch === "object"
        && branch !== null
        && "properties" in branch
        && typeof (branch as { properties?: { piece?: { enum?: string[] } } }).properties?.piece?.enum !== "undefined"
        && (branch as { properties: { piece: { enum: string[] } } }).properties.piece.enum.includes("spaceHex"),
);
if (!hasSpacerBranch) {
    isoPiece.oneOf.unshift(spacerBranch);
}

fs.writeFileSync(schemaPath, `${JSON.stringify(schema, null, 4)}\n`);
console.log(`Updated isometricPieces enum with ${basePieces.length} entries.`);
