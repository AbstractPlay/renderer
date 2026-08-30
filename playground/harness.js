import { render } from "@abstractplay/renderer";
import PLAYGROUND_SAMPLES from "../test/fixtures/playground-samples.json" with { type: "json" };

const params = new URLSearchParams(window.location.search);
const sampleKey = params.get("sample");
const drawing = document.getElementById("drawing");

if (!sampleKey || !PLAYGROUND_SAMPLES[sampleKey]) {
    document.body.dataset.rendered = "error";
    document.body.dataset.error = `missing or unknown sample: ${sampleKey}`;
    drawing.innerHTML = `<pre id="error">${document.body.dataset.error}</pre>`;
} else {
    try {
        const json = JSON.parse(PLAYGROUND_SAMPLES[sampleKey].render);
        render(json, { divid: "drawing" });
        document.body.dataset.sample = sampleKey;
        document.body.dataset.rendered = "true";
    } catch (err) {
        document.body.dataset.rendered = "error";
        document.body.dataset.error = err && err.message ? err.message : String(err);
        drawing.innerHTML = `<pre id="error">${document.body.dataset.error}</pre>`;
    }
}
