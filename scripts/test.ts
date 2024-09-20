import path from "path";
import { ForEachTranslation, SteamAPI } from "./utils";


let n: string[] = [];
ForEachTranslation(({translationFileName}) => n.push(translationFileName)).then(() => console.log(n.map(n => n.match(/\d+\s(.+)$/)?.[1] ?? n).join(", ")));