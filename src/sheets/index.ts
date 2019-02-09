import { ISheet } from "../ISheet";
import { DefaultSheet } from "./default";

export { ISheet, DefaultSheet };

const sheets = new Map<string, ISheet>();
sheets.set(DefaultSheet.name, DefaultSheet);
export { sheets };
