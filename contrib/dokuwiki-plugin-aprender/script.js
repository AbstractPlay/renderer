/**
 * Client-side init for the aprender DokuWiki plugin.
 *
 * Instance JSON is embedded in the page body (not JSINFO) because DokuWiki
 * builds the header before page content is rendered.
 *
 * @license MIT
 */
(function () {
    'use strict';

    /**
     * @param {string} message
     * @returns {string}
     */
    function escapeHtml(message) {
        return String(message)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    /**
     * @param {string} id
     * @param {string} message
     */
    function showError(id, message) {
        var node = document.getElementById(id);
        if (!node) {
            return;
        }
        node.innerHTML = '<pre class="aprender-error">' + escapeHtml(message) + '</pre>';
    }

    /**
     * @param {string|number} value
     * @param {'width'|'height'} axis
     * @returns {string}
     */
    function normalizeCssSize(value, axis) {
        var text = String(value).trim();
        if (/^\d+$/.test(text)) {
            return text + 'px';
        }
        if (axis === 'height' && /^(\d+(?:\.\d+)?)%$/.test(text)) {
            return text.replace('%', 'vh');
        }
        return text;
    }

    /**
     * @param {string|number} value
     * @returns {string}
     */
    function normalizeScale(value) {
        var text = String(value).trim();
        if (/^\d+$/.test(text)) {
            return String(Number(text) / 100);
        }
        if (/^(\d+(?:\.\d+)?)%$/.test(text)) {
            return String(Number(text.replace('%', '')) / 100);
        }
        return text;
    }

    /**
     * @param {HTMLElement} container
     * @param {object} options
     */
    function applyFrameSizing(container, options) {
        var frame = container.parentElement;
        if (!frame || !frame.classList.contains('aprender-frame')) {
            frame = container;
        }

        if (options.width !== undefined) {
            frame.style.width = normalizeCssSize(options.width, 'width');
            frame.classList.add('aprender-has-width');
        }

        if (options.height !== undefined) {
            frame.style.height = normalizeCssSize(options.height, 'height');
            frame.classList.add('aprender-has-height');
        }

        if (options.scale !== undefined) {
            frame.style.transform = 'scale(' + normalizeScale(options.scale) + ')';
            frame.style.transformOrigin = 'top left';
            frame.classList.add('aprender-has-scale');
        }
    }

    /**
     * @param {HTMLElement} container
     */
    function fitSvg(container) {
        var svg = container.querySelector('svg');
        if (!svg) {
            return;
        }
        svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    }

    /**
     * @returns {Array<{id: string, json: object, options: object}>}
     */
    function collectInstances() {
        var nodes = document.querySelectorAll('div.aprender[id]');
        var instances = [];

        for (var i = 0; i < nodes.length; i++) {
            var id = nodes[i].id;
            var dataEl = document.getElementById(id + '-data');
            var optionsEl = document.getElementById(id + '-options');

            if (!dataEl) {
                continue;
            }

            try {
                instances.push({
                    id: id,
                    json: JSON.parse(dataEl.textContent || ''),
                    options: optionsEl ? JSON.parse(optionsEl.textContent || '{}') : {}
                });
            } catch (err) {
                var message = err && err.message ? err.message : String(err);
                showError(id, message);
            }
        }

        return instances;
    }

    /**
     * @param {() => void} onReady
     * @param {() => void} onTimeout
     * @param {number} [attempts]
     */
    function whenAPRenderReady(onReady, onTimeout, attempts) {
        var remaining = attempts === undefined ? 200 : attempts;

        if (window.APRender && typeof window.APRender.render === 'function') {
            onReady();
            return;
        }

        if (remaining <= 0) {
            onTimeout();
            return;
        }

        window.setTimeout(function () {
            whenAPRenderReady(onReady, onTimeout, remaining - 1);
        }, 50);
    }

    /**
     * @param {{id: string, json: object, options?: object}} instance
     */
    function renderInstance(instance) {
        var options = instance.options || {};
        var container = document.getElementById(instance.id);
        if (!container) {
            return;
        }

        applyFrameSizing(container, options);

        var renderOptions = {
            divid: instance.id,
            prefix: instance.id + '-'
        };

        if (options.rotate !== undefined) {
            renderOptions.rotate = options.rotate;
        }
        if (options.colourBlind) {
            renderOptions.colourBlind = true;
        }
        if (options.patterns) {
            renderOptions.patterns = true;
        }

        if (options.width !== undefined) {
            renderOptions.width = '100%';
        }
        if (options.height !== undefined) {
            renderOptions.height = '100%';
        }

        try {
            window.APRender.render(instance.json, renderOptions);
            fitSvg(container);
        } catch (err) {
            var message = err && err.message ? err.message : String(err);
            showError(instance.id, message);
        }
    }

    function init() {
        var instances = collectInstances();
        if (!instances.length) {
            return;
        }

        whenAPRenderReady(
            function () {
                for (var i = 0; i < instances.length; i++) {
                    renderInstance(instances[i]);
                }
            },
            function () {
                for (var j = 0; j < instances.length; j++) {
                    showError(
                        instances[j].id,
                        'Failed to load the Abstract Play renderer bundle.'
                    );
                }
            }
        );
    }

    if (window.jQuery) {
        window.jQuery(init);
    } else if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
