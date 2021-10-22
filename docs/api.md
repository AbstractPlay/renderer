# Renderer Public API

This document tries to explain how to *use* the Abstract Play renderer. Documentation on developing for and extending the renderer will come later in a separate document.

## Usage

In the browser, simply load `APRender.js` via a `<script>` tag. From within Node, simply import the variables and functions you need. Both methods give you access to the same API. For a concrete example, see `test/index.html`.

## API

### Input

The primary input into the rendering engine is a valid JSON document that matches `/src/schema.json` (represented in TypeScript as `APRenderRep`). The JSON schema is the authoritative documentation. Additional explanation is provided in `/docs/schema.adoc`, and examples are also provided in the `/docs` folder.

### Rendering

There are two rendering functions: `render` and `renderStatic`, which both take the same inputs.

* `render(inObj: APRenderRep, options: IRenderOptions) => Svg` is the primary method. It immediately renders the image based on the provided options and also returns the `Svg` object if needed.
* `renderStatic` is designed for use in React functional components. It generates the SVG in a detached DOM element and returns the SVG code.

Here are the currently supported `IRenderOptions`:

* **divid: string**: This is the string `id` of the HTML element into which you wish to render the image.
* **divelem: HTMLElement**: Instead, you could provide the element itself, but the preferred approach is `divid`.
* **sheets?: string[]**: This is the list of sheet IDs you want the renderer to reference. This is optional. If not provided, all sheets will be searched.
* **patterns?: boolean**: Signals whether patterns are to be used. If omitted, it is assumed to be `false`.
* **patternList?: string[]**: The list of pattern IDs you wish used, in player order. Otherwise the full list of patterns will be used with the default order. There are ten total patterns defined.
* **colourBlind?: boolean**: Signals whether the colour-blind palette should be used (default `false`). There are only four colour-blind colours available. Otherwise the default nine colours will be chosen.
* **colourList?: string[]**: Optional list of hexadecimal colours you wish used, in player order. This overrides any other colour settings.
* **rotate?: number**: Instructs the renderer to rotate the rendered image a certain number of degrees. Currently only supports 90-degree increments. Negative numbers turn in a counter-clockwise direction. May not always work as expected for certain games.
* **width?: NumberAlias**: The width of the rendered image. Can be provided in any units supported by CSS. By default it is `100%`.
* **height?: NumberAlias**: The height of the rendered image. Can be provided in any units supported by CSS. By default it is `100%`.
* **boardClick (row: number, col: number, piece: string) => void**: A callback that will get attached to the board and pieces placed on it.

### Error Handling

If there is an error in the JSON, or something else goes wrong, and error is thrown. Some attempt is made to make the error message useful, but the JSON errors are challenging. Thankfully this should not be something ever encountered by users, only developers.
