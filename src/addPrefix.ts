import type { IRenderOptions } from "./renderOptions.js";

export const addPrefix = (svg: string, opts = {} as Pick<IRenderOptions, "prefix">): string => {
    const escapeRegex = (str: string): string => {
        return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    };

    if (opts.prefix !== undefined) {
        const prefix = opts.prefix;
        const idRegex = /id="([^"]+)"/g;

        const ids: string[] = [];
        let match: RegExpExecArray | null;
        while ((match = idRegex.exec(svg)) !== null) {
            ids.push(match[1]);
        }

        ids.sort((a, b) => b.length - a.length);

        ids.forEach((id) => {
            const newId = `${prefix}${id}`;
            const escapedId = escapeRegex(id);

            const idDefRegex = new RegExp(`id="${escapedId}"`, "g");
            svg = svg.replace(idDefRegex, `id="${newId}"`);

            const refPatterns = [
                new RegExp(`url\\(#${escapedId}\\)`, "g"),
                new RegExp(`href="#${escapedId}"`, "g"),
                new RegExp(`xlink:href="#${escapedId}"`, "g"),
                new RegExp(`"#${escapedId}"`, "g"),
                new RegExp(`#${escapedId}(?=[\\s\\{\\.\\#\\>\\+\\~\\[\\,\\:])`, "g"),
            ];

            refPatterns.forEach((regex) => {
                svg = svg.replace(regex, (match) => {
                    if (match.startsWith("#")) {
                        return `#${newId}`;
                    }
                    return match.replace(`#${id}`, `#${newId}`);
                });
            });
        });
    }
    return svg;
};
