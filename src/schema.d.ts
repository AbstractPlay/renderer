/* tslint:disable */
/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

/**
 * Pattern for the global stash definitions for the `homeworlds` renderer.
 */
export type Stashstrings = string;

/**
 * Games on the Abstract Play service must produce representations of the play area based on this schema. The front-end renderer will then translate that into various forms. Detailed documentation is difficult within a JSON document (e.g., no multi-line strings allowed), so see the website for standalone documentation.
 */
export interface APRenderRep {
  /**
   * The rendering engine the game wants to use.
   */
  renderer?: "default" | "stacking-offset" | "stacking-tiles" | "homeworlds";
  /**
   * Map each `piece` to an actual glyph with possible options.
   */
  legend?: {
    [k: string]: string | Glyph | [Glyph, ...Glyph[]];
  };
  /**
   * This is the game board itself.
   */
  board:
    | {
        style:
          | "squares"
          | "squares-checkered"
          | "vertex"
          | "vertex-cross"
          | "go"
          | "hex-odd-p"
          | "hex-even-p"
          | "hex-odd-f"
          | "hex-even-f"
          | "hex-of-hex"
          | "hex-of-tri"
          | "hex-of-cir"
          | "snubsquare";
        /**
         * The base stroke weight of lines drawn to construct the board.
         */
        strokeWeight?: number;
        /**
         * The colour for lines drawn to construct the board, includes the labels.
         */
        strokeColour?: string;
        /**
         * The opacity of lines drawn to construct the board, includes the labels.
         */
        strokeOpacity?: number;
        /**
         * Only meaningful for the 'hex_of_*' styles. Determines the minimum width at the top and bottom of the board.
         */
        minWidth?: number;
        /**
         * Only meaningful for the 'hex_as_*' styles. Determines the maximum width at the centre of the board.
         */
        maxWidth?: number;
        /**
         * Required for the `squares*`, `vertex`, and `go` styles.
         */
        width?: number;
        /**
         * Required for the `squares*`, `vertex`, and `go` styles.
         */
        height?: number;
        /**
         * Only meaningful for the `squares` and `vertex` boards. Places heavier grid lines to create tiles that are X grids high.
         */
        tileWidth?: number;
        /**
         * Only meaningful for the `squares` and `vertex` boards. Places heavier grid lines to create tiles that are X grids high.
         */
        tileHeight?: number;
      }
    | {
        /**
         * The name of the system. For simplicity, no whitespace, no weird characters, and 1–25 characters in length.
         */
        name: string;
        /**
         * If this is a home system, give the compass direction representing the player's seat. Omit property in shared systems.
         */
        seat?: "N" | "E" | "S" | "W";
        /**
         * Describes the system's stars.
         */
        stars: [string] | [string, string];
      }[];
  pieces:
    | null
    | string
    | [string[][], ...string[][][]]
    | [string]
    | [string, string]
    | [string, string, string]
    | [string, string, string, string]
    | [string, string, string, string, string]
    | [string, string, string, string, string, string]
    | [string, string, string, string, string, string, string]
    | [string, string, string, string, string, string, string, string]
    | [string, string, string, string, string, string, string, string, string]
    | [string, string, string, string, string, string, string, string, string, string]
    | [string, string, string, string, string, string, string, string, string, string, string]
    | [string, string, string, string, string, string, string, string, string, string, string, string]
    | [string, string, string, string, string, string, string, string, string, string, string, string, string]
    | [string, string, string, string, string, string, string, string, string, string, string, string, string, string]
    | [
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string
      ]
    | [
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string
      ]
    | [
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string
      ]
    | [
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string
      ]
    | [
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string
      ]
    | [
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string
      ]
    | [
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string
      ]
    | [
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string
      ]
    | [
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string
      ]
    | [
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string
      ][];
  /**
   * Areas are placed vertically under the game board. There's no default way of handling this. Each renderer will need to know what to do with it.
   */
  areas?: {
    R: Stashstrings;
    G: Stashstrings;
    B: Stashstrings;
    Y: Stashstrings;
    [k: string]: unknown;
  }[];
  /**
   * Instruct the renderer how to show any changes to the game state. See the docs for details.
   */
  annotations?: [
    {
      /**
       * The type of annotation
       */
      type: "move" | "enter" | "exit";
      /**
       * The cells involved in the annotation
       */
      targets: [
        {
          row: number;
          col: number;
          [k: string]: unknown;
        },
        ...{
          row: number;
          col: number;
          [k: string]: unknown;
        }[]
      ];
      style?: "solid" | "dashed";
      /**
       * Pattern for hex colour strings
       */
      colour?: string;
      arrow?: boolean;
      [k: string]: unknown;
    },
    ...{
      /**
       * The type of annotation
       */
      type: "move" | "enter" | "exit";
      /**
       * The cells involved in the annotation
       */
      targets: [
        {
          row: number;
          col: number;
          [k: string]: unknown;
        },
        ...{
          row: number;
          col: number;
          [k: string]: unknown;
        }[]
      ];
      style?: "solid" | "dashed";
      /**
       * Pattern for hex colour strings
       */
      colour?: string;
      arrow?: boolean;
      [k: string]: unknown;
    }[]
  ];
  [k: string]: unknown;
}
/**
 * An individual glyph with options, used in the `legend` property.
 */
export interface Glyph {
  /**
   * The name of the actual glyph.
   */
  name: string;
  /**
   * A positive integer pointing to a player position. Based on user settings, an appropriate background fill colour will be chosen.
   */
  player?: number;
  /**
   * A 3- or 6-digit hex colour value. Do not use this to assign player colours! This should only be used for tweaking composite pieces. Ignored if `player` is also defined.
   */
  colour?: string;
  /**
   * A number representing how you want the glyph proportionately scaled. Numbers <1 will shrink the glyph. Numbers >1 will enlarge it.
   */
  scale?: number;
  /**
   * A number between 0 and 1 indicating how opaque to render the glyph. A value of 0 means completely transparent.
   */
  opacity?: number;
  /**
   * A number between -360 and 360 representing the degrees to rotate the glyph. Negative values rotate counterclockwise.
   */
  rotate?: number;
  /**
   * The number of units to nudge the glyph from centre.
   */
  nudge?: {
    /**
     * Negative values move the glyph to the left.
     */
    dx?: number;
    /**
     * Negative values move the glyph up.
     */
    dy?: number;
  };
}
