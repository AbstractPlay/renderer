/* tslint:disable:no-console */

import Ajv from "ajv";
import { expect } from "chai";
import "mocha";
import schema from "../src/schema.json";

describe("Schema validator", () => {
    it("should validate with minimal example", () => {
        const data = {
            board: {style: "squares-checkered", height: 4, width: 4},
            legend: {
                B: {name: "piece", colour: 2},
                G: {name: "piece", colour: 3},
                R: {name: "piece", colour: 1},
                Y: {name: "piece", colour: 4},
            },
            pieces: "YYRR\nY--R\nB--G\nBBGG",
        };
        const ajv = new Ajv();
        const valid = ajv.validate(schema, data);
        expect(valid).to.equal(true);
    });
});
