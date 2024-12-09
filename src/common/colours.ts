import { rgb as convert_rgb, hsl as convert_hsl, hex as convert_hex } from "color-convert";

export const getRandomColor = ():string => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

export type RGB = [number,number,number];

export const afterOpacity = (fg: RGB,o: number,bg: RGB = [255,255,255]): RGB => {
    return fg.map((colFg,idx)=>o*colFg+(1-o)*bg[idx]) as RGB;
}

export const rgb2hex = (rgb: RGB): string => {
    return "#" + convert_rgb.hex(rgb);
}

export const hex2rgb = (hex: string): RGB => {
    return convert_hex.rgb(hex);
}

const unlogit = (x: number) => {
    return Math.log(x / (1 - x));
}

const logit = (x: number) => {
    return 1 / (1 + Math.exp(-x));
}

export const lighten = (rgb: [number, number, number], ds: number, dl: number): RGB => {
    const hsl = convert_rgb.hsl(rgb);
    const l = 100 * logit(unlogit(hsl[2] / 100) + dl);
    const s = 100 * logit(unlogit(hsl[1] / 100) + ds);
    return convert_hsl.rgb([hsl[0], s, l]);
}
