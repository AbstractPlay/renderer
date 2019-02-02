/* tslint:disable:no-console */

import Ajv from "ajv";
import { render } from "../src/index";
import { APRenderRep } from "../src/schema";
import schema from "../src/schema.json";

test("placeholder that always succeeds", () => {
    expect(true).toBe(true);
});

test("schema validator", () => {
    const data = {
        board: {style: "squares-checkered"},
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
    expect(valid).toBe(true);
});

test("debugging outputter", () => {
    const data = {
        board: {style: "squares-checkered"},
        legend: {
            B: {name: "piece", colour: 2},
            G: {name: "piece", colour: 3},
            R: {name: "piece", colour: 1},
            Y: {name: "piece", colour: 4},
        },
        pieces: "YYRR\nY--R\nB--G\nBBGG",
    };
    const window = require("svgdom");
    // v3
    // const {SVG, registerWindow} = require("@svgdotjs/svg.js");
    // registerWindow(window, window.document);
    // const canvas = SVG(document.documentElement);

    // v2
    const SVG = require("svg.js")(window);
    const document = window.document;
    const canvas = SVG(document.documentElement);

    render(data, {divid: "", target: canvas});
    console.log(canvas.svg());
    // const canvas = SVG(document.documentElement);
});