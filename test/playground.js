            function handleClick(row, col, piece) {
                console.log(`Row: ${row}, Col: ${col}, Piece: ${piece}`);
            }
            function processJson() {
                var myNode = document.getElementById("drawing");
                while (myNode.lastChild) {
                    myNode.removeChild(myNode.lastChild);
                }
                var options = {divid: "drawing"};
                var radio = document.querySelector('input[name="playerfill"]:checked').value;
                if (radio === "blind") {
                    options.colourBlind = true;
                } else if (radio === "patterns") {
                    options.patterns = true;
                }
                if (document.getElementById("chkColoursGlobal").checked) {
                    options.colours = ["#e31a1c","#1f78b4","#33a02c","#ffff99","#6a3d9a","#ff7f00","#b15928","#fb9a99","#a6cee3","#b2df8a","#fdbf6f","#cab2d6"]
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

                // add colour context
                var fill = document.getElementById("ccFill");
                var bg = document.getElementById("ccBackground");
                var strokes = document.getElementById("ccStrokes");
                var borders = document.getElementById("ccBorders");
                var labels = document.getElementById("ccLabels");
                var notes = document.getElementById("ccNotes");
                var board = document.getElementById("ccBoard");
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

                var settingsIn = document.getElementById("settingsIn");
                if (settingsIn && settingsIn.value.trim().length > 0) {
                    var settings = JSON.parse(settingsIn.value);
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

                var div = document.getElementById("drawing");
                div.style.backgroundColor = (options.colourContext && options.colourContext.background) ? options.colourContext.background : bg.value;

                var data = JSON.parse(document.getElementById("jsonIn").value);
                var canvas = APRender.render(data, options);
                return false;
            }

            function decodeBase64Url(s) {
                var padded = s.replace(/-/g, "+").replace(/_/g, "/")
                    + "===".slice((s.length + 3) % 4);
                return decodeURIComponent(escape(atob(padded)));
            }

            function loadInitialFromUrl() {
                var params = new URLSearchParams(window.location.search);
                var jsonParam = params.get("json");
                var sampleKey = params.get("sample");
                var jsonbox = document.getElementById("jsonIn");
                var select = document.getElementById("samples");
                var description = document.getElementById("sampledesc");

                if (jsonParam) {
                    try {
                        var parsed = JSON.parse(decodeBase64Url(jsonParam));
                        jsonbox.value = JSON.stringify(parsed, null, 2);
                        select.value = "_empty";
                        description.innerHTML = "";
                        processJson();
                        return true;
                    } catch (e) {
                        description.innerHTML = "<p class=\"has-text-danger\">Could not load JSON from URL: "
                            + e.message + "</p>";
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

            var samples = PLAYGROUND_SAMPLES;

            document.addEventListener("DOMContentLoaded", function(event) {
                document.getElementById("submit").addEventListener("click", processJson, false);

                // load sample renders
                const select = document.getElementById("samples");
                for (const key in samples) {
                    var opt = document.createElement('option');
                    opt.value = key;
                    opt.innerHTML = samples[key].name;
                    select.appendChild(opt);
                }

                // Listen for sample render change
                select.addEventListener("change", (e) => {
                    var description = document.getElementById("sampledesc");
                    var jsonbox = document.getElementById("jsonIn");
                    if (select.value === "_empty") {
                        description.innerHTML = "";
                        jsonbox.value = "";
                    } else {
                        var sample = samples[select.value];
                        description.innerHTML = sample.description;
                        jsonbox.value = sample.render;
                    }
                    if (jsonbox.value.length > 0) {
                        processJson();
                    } else {
                        document.getElementById("drawing").innerHTML = "";
                    }
                });

                // listen for prettify click
                var prettybtn = document.getElementById("toggle");
                prettybtn.addEventListener("click", (e) => {
                    var jsonbox = document.getElementById("jsonIn");
                    jsonbox.value = JSON.stringify(JSON.parse(jsonbox.value), undefined, 4);
                });

                // listen for light mode click
                var lightbtn = document.getElementById("btnLight");
                lightbtn.addEventListener("click", e => {
                    var fill = document.getElementById("ccFill");
                    var bg = document.getElementById("ccBackground");
                    var strokes = document.getElementById("ccStrokes");
                    var borders = document.getElementById("ccBorders");
                    var labels = document.getElementById("ccLabels");
                    var notes = document.getElementById("ccNotes");
                    var board = document.getElementById("ccBoard");
                    bg.value = "#fff";
                    fill.value = "#000";
                    strokes.value = "#000";
                    borders.value = "#000";
                    labels.value = "#000";
                    notes.value = "#000";
                    board.value = "";
                });
                // listen for dark mode click
                var darkbtn = document.getElementById("btnDark");
                darkbtn.addEventListener("click", e => {
                    var fill = document.getElementById("ccFill");
                    var bg = document.getElementById("ccBackground");
                    var strokes = document.getElementById("ccStrokes");
                    var borders = document.getElementById("ccBorders");
                    var labels = document.getElementById("ccLabels");
                    var notes = document.getElementById("ccNotes");
                    var board = document.getElementById("ccBoard");
                    bg.value = "#222";
                    fill.value = "#e6f2f2";
                    strokes.value = "#6d6d6d";
                    borders.value = "#000";
                    labels.value = "#009fbf";
                    notes.value = "#99cccc";
                    board.value = "";
                });

                loadInitialFromUrl();
            });
