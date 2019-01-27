import ISheet from "../sheet";
import DefaultSheet from "./default";

const sheets = new Map<string, ISheet>();
sheets.set(DefaultSheet.name, DefaultSheet);
export default sheets;
