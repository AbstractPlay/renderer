"use strict";

const { render, renderglyph, addPrefix, sheets } = require("../build");

const missing = [];
if (typeof render !== "function") missing.push("render");
if (typeof renderglyph !== "function") missing.push("renderglyph");
if (typeof addPrefix !== "function") missing.push("addPrefix");
if (typeof sheets !== "object" || sheets === null) missing.push("sheets");

if (missing.length > 0) {
    throw new Error(
        `Bundled build is missing exports: ${missing.join(", ")}`
    );
}

console.log("smoke-build: ok");
