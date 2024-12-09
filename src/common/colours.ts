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
    return "#" + rgb.map(v => Math.round(v).toString(16)).join("");
}

export const hex2rgb = (hex: string): RGB => {
    let r: string; let g: string; let b: string;
    if (hex.length === 4) {
        [r, g, b] = [hex[1], hex[2], hex[3]];
    } else if (hex.length === 7) {
        [r, g, b] = [hex.substring(1,3), hex.substring(3,5), hex.substring(5)];
    } else {
        throw new Error(`Malformed hexadecimal colour provided: ${hex}`);
    }
    return [r,g,b].map(n => parseInt(n, 16)) as RGB;
}
