import { render } from "@abstractplay/renderer";
import PLAYGROUND_SAMPLES from "../test/fixtures/playground-samples.json" with { type: "json" };

function handleClick(row, col, piece) {
    console.log(`Row: ${row}, Col: ${col}, Piece: ${piece}`);
}

function processJson() {
    const myNode = document.getElementById("drawing");
    while (myNode.lastChild) {
        myNode.removeChild(myNode.lastChild);
    }
    const options = { divid: "drawing" };
    const radio = document.querySelector('input[name="playerfill"]:checked').value;
    if (radio === "blind") {
        options.colourBlind = true;
    } else if (radio === "patterns") {
        options.patterns = true;
    }
    if (document.getElementById("chkColoursGlobal").checked) {
        options.colours = ["#e31a1c", "#1f78b4", "#33a02c", "#ffff99", "#6a3d9a", "#ff7f00", "#b15928", "#fb9a99", "#a6cee3", "#b2df8a", "#fdbf6f", "#cab2d6"];
        options.coloursGlobal = false;
    }
    let rotation = 0;
    const freestyle = parseInt(document.getElementById("rotFree").value, 10);
    if (freestyle === 0) {
        rotation = document.querySelector('input[name="rotation"]:checked').value;
    } else {
        rotation = freestyle;
    }
    options.rotate = rotation;
    options.boardClick = handleClick;

    const fill = document.getElementById("ccFill");
    const bg = document.getElementById("ccBackground");
    const strokes = document.getElementById("ccStrokes");
    const borders = document.getElementById("ccBorders");
    const labels = document.getElementById("ccLabels");
    const notes = document.getElementById("ccNotes");
    const board = document.getElementById("ccBoard");
    options.colourContext = {
        background: bg.value,
        fill: fill.value,
        strokes: strokes.value,
        borders: borders.value,
        labels: labels.value,
        annotations: notes.value,
        board: board.value.length > 0 ? board.value : undefined,
    };
    if (board.value.trim().length > 0) {
        options.colourContext.board = board.value;
    }
    if (document.getElementById("chkContextGlobal").checked) {
        options.contextGlobal = false;
    }

    const settingsIn = document.getElementById("settingsIn");
    if (settingsIn && settingsIn.value.trim().length > 0) {
        const settings = JSON.parse(settingsIn.value);
        if (settings.colourContext !== undefined) {
            options.colourContext = settings.colourContext;
            options.contextGlobal = false;
        }
        if (settings.palette !== undefined && settings.palette.length > 0) {
            options.colours = settings.palette;
            options.coloursGlobal = false;
        }
        if (settings.glyphmap !== undefined) {
            options.glyphmap = settings.glyphmap;
        }
    }

    const div = document.getElementById("drawing");
    div.style.backgroundColor = (options.colourContext && options.colourContext.background) ? options.colourContext.background : bg.value;

    const data = JSON.parse(document.getElementById("jsonIn").value);
    render(data, options);
    return false;
}

function decodeBase64Url(s) {
    const padded = s.replace(/-/g, "+").replace(/_/g, "/")
        + "===".slice((s.length + 3) % 4);
    return decodeURIComponent(escape(atob(padded)));
}

function loadInitialFromUrl(samples) {
    const params = new URLSearchParams(window.location.search);
    const jsonParam = params.get("json");
    const sampleKey = params.get("sample");
    const jsonbox = document.getElementById("jsonIn");
    const select = document.getElementById("samples");
    const description = document.getElementById("sampledesc");

    if (jsonParam) {
        try {
            const parsed = JSON.parse(decodeBase64Url(jsonParam));
            jsonbox.value = JSON.stringify(parsed, null, 2);
            select.value = "_empty";
            description.innerHTML = "";
            processJson();
            return true;
        } catch (e) {
            description.innerHTML = `<p class="has-text-danger">Could not load JSON from URL: ${e.message}</p>`;
            return false;
        }
    }

    if (sampleKey && samples[sampleKey]) {
        select.value = sampleKey;
        select.dispatchEvent(new Event("change"));
        return true;
    }

    return false;
}

const samples = PLAYGROUND_SAMPLES;

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("submit").addEventListener("click", processJson, false);

    const select = document.getElementById("samples");
    for (const key in samples) {
        const opt = document.createElement("option");
        opt.value = key;
        opt.innerHTML = samples[key].name;
        select.appendChild(opt);
    }

    select.addEventListener("change", () => {
        const description = document.getElementById("sampledesc");
        const jsonbox = document.getElementById("jsonIn");
        if (select.value === "_empty") {
            description.innerHTML = "";
            jsonbox.value = "";
        } else {
            const sample = samples[select.value];
            description.innerHTML = sample.description;
            jsonbox.value = sample.render;
        }
        if (jsonbox.value.length > 0) {
            processJson();
        } else {
            document.getElementById("drawing").innerHTML = "";
        }
    });

    document.getElementById("toggle").addEventListener("click", () => {
        const jsonbox = document.getElementById("jsonIn");
        jsonbox.value = JSON.stringify(JSON.parse(jsonbox.value), undefined, 4);
    });

    document.getElementById("btnLight").addEventListener("click", () => {
        document.getElementById("ccBackground").value = "#fff";
        document.getElementById("ccFill").value = "#000";
        document.getElementById("ccStrokes").value = "#000";
        document.getElementById("ccBorders").value = "#000";
        document.getElementById("ccLabels").value = "#000";
        document.getElementById("ccNotes").value = "#000";
        document.getElementById("ccBoard").value = "";
    });

    document.getElementById("btnDark").addEventListener("click", () => {
        document.getElementById("ccBackground").value = "#222";
        document.getElementById("ccFill").value = "#e6f2f2";
        document.getElementById("ccStrokes").value = "#6d6d6d";
        document.getElementById("ccBorders").value = "#000";
        document.getElementById("ccLabels").value = "#009fbf";
        document.getElementById("ccNotes").value = "#99cccc";
        document.getElementById("ccBoard").value = "";
    });

    loadInitialFromUrl(samples);
});
