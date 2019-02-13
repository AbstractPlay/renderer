// tslint:disable: no-var-requires

import { IRendererOptions } from "../src/RendererBase";
import { DefaultRenderer } from "../src/renderers";
import { APRenderRep } from "../src/schema";

const r = new DefaultRenderer();

// tslint:disable-next-line: no-var-requires
const window = require("svgdom");
const SVG = require("svg.js")(window);
const document = window.document;
const canvas = SVG(document.documentElement);

const cloneDeep = require("lodash/cloneDeep");

const baseData: APRenderRep = {
    board: {
        height: 8,
        style: "squares-checkered",
        width: 8,
    },
    pieces: null,
};

test("Placeholder that will always pass", () => {
    expect(true).toBe(true);
});

// test("JSON Prechecks: Correct renderer (default)", () => {
//     const data: APRenderRep = cloneDeep(baseData);

//     expect(() => { r.render(data, canvas, {}); }).not.toThrow();
// });

// test("JSON Prechecks: Correct renderer (explicit)", () => {
//     const data: APRenderRep = cloneDeep(baseData);
//     data.renderer = "default";

//     expect(() => { r.render(data, canvas, {}); }).not.toThrow();
// });

// test("JSON Prechecks: Incorrect renderer", () => {
//     const data: APRenderRep = cloneDeep(baseData);
//     data.renderer = "stacking";

//     expect(() => { r.render(data, canvas, {}); }).toThrow();
// });

// test("Options Prechecks: Valid sheet list", () => {
//     const opts: IRendererOptions = {sheetList: ["default"]};
//     expect(() => { r.render(baseData, canvas, opts); }).not.toThrow();
// });

// test("Options Prechecks: Invalid sheet list", () => {
//     const opts: IRendererOptions = {sheetList: ["nonexistent"]};
//     expect(() => { r.render(baseData, canvas, opts); }).toThrow();
// });

// test("Options Prechecks: Valid pattern list", () => {
//     const opts: IRendererOptions = {patternList: ["honeycomb", "triangles"], patterns: true};
//     expect(() => { r.render(baseData, canvas, opts); }).not.toThrow();
// });

// test("Options Prechecks: Invalid pattern list", () => {
//     const opts1: IRendererOptions = {patternList: ["nonexistent", "triangles"], patterns: true};
//     const opts2: IRendererOptions = {patternList: ["nonexistent", "triangles"], patterns: false};
//     const opts3: IRendererOptions = {patternList: ["nonexistent", "triangles"]};
//     expect(() => { r.render(baseData, canvas, opts1); }).toThrow();
//     expect(() => { r.render(baseData, canvas, opts2); }).not.toThrow();
//     expect(() => { r.render(baseData, canvas, opts3); }).not.toThrow();
// });

// test("Options Prechecks: Valid colour list", () => {
//     const opts: IRendererOptions = {colours: ["#a6611a", "#80cdc1", "#018571", "#dfc27d"]};
//     expect(() => { r.render(baseData, canvas, opts); }).not.toThrow();
// });

// test("Options Prechecks: Invalid colour list", () => {
//     const opts1: IRendererOptions = {colours: ["#dfc27z"]};
//     const opts2: IRendererOptions = {colours: ["#dfc27"]};
//     const opts3: IRendererOptions = {colours: ["#fff"]};
//     expect(() => { r.render(baseData, canvas, opts1); }).toThrow();
//     expect(() => { r.render(baseData, canvas, opts2); }).toThrow();
//     expect(() => { r.render(baseData, canvas, opts3); }).toThrow();
// });
