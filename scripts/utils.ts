import axios, { AxiosResponse } from "axios";
import { spawn } from "child_process";
import fs from "fs-extra";
import path from "path";
import { ElementCompact, js2xml, Options, xml2js } from "xml-js";
import { GetPublishedFileDetails, ModAbout, TranslationAbout, XML_List } from "./types";
import * as cheerio from "cheerio";
require("dotenv").config();


export namespace Pathes {
    export const pathToMod = path.join(__dirname, "../Mod") as `${string}/Mod`;
    export const pathToAbout = path.join(pathToMod, "About/About.xml");
    export const outputTranslationsDir = path.join(pathToMod, "Translations");
    export const outputdir = path.join(pathToMod, "Languages/Ukrainian") as `${typeof pathToMod}/Languages/Ukrainian`;
    // export const outputDefInjecteddir = path.join(outputdir, "DefInjected");
    // export const outputKeyeddir = path.join(outputdir, "Keyed");


    export const modLoadFolders = path.join(pathToMod, "LoadFolders.xml");


    export const translation_completed = path.join(__dirname, "../Translations/Completed");
    export const translation_testing = path.join(__dirname, "../Translations/Testing");
    export const translation_incompleted = path.join(__dirname, "../Translations/Incompleted");

    export function steamCMD() {
        const steamCMDPath = process.env.STEAMCMD_PATH;
        if (!steamCMDPath) throw Error("STEAMCMD_PATH is not defined");

        return {
            steamCMDPath,
            steamCMD294100_acf: path.join(steamCMDPath, "steamapps/workshop/appworkshop_294100.acf") as `${typeof steamCMDPath}/steamapps/workshop/appworkshop_294100.acf`,
            steamCMDGamePath: path.join(steamCMDPath, "steamapps/workshop/content/294100") as `${typeof steamCMDPath}/steamapps/workshop/content/294100`
        }
    }
}


export async function ForEachTranslation(callback: (paths: {
    rootPath: string,
    translationFileName: string,
    translationPath: string
}) => void) {
    for (let rootPath of [Pathes.translation_completed, /*Pathes.translation_incompleted*/] as const) {
        for (let translationFileName of await fs.readdir(rootPath)) {
            await callback({
                rootPath, translationFileName,
                translationPath: path.join(rootPath, translationFileName)
            });
        }
    }
}

export const xmlReaderOptions: Options.XML2JS = {
    compact: true,
    ignoreAttributes: true,
    ignoreCdata: true,
    ignoreComment: true,
    ignoreDoctype: true,
    ignoreDeclaration: true,
    ignoreInstruction: true
};



export async function ReadTranslationAbout(translationPath: string) {
    return (xml2js((await fs.readFile(path.join(translationPath, "About.xml"))).toString(), xmlReaderOptions) as ElementCompact).TranslationDetails as TranslationAbout;
}
export async function ReadModAbout(modPath: string) {
    // try {
    return (xml2js((await fs.readFile(path.join(modPath, "About/About.xml"))).toString(), xmlReaderOptions) as ElementCompact).ModMetaData as ModAbout;
    // } catch (error) {
    //     new ErrorDebug(error)
    //         .is_NoSuchFile("")
    //         .end();
    // }
}

export class ErrorDebug {
    public e: { errno: any }
    public constructor(e: unknown) {
        if (typeof e == "object" && e && "errno" in e) this.e = e;
        else throw e;
    }
    public end(): never { throw this.e; }
    public is_NoSuchFile(message: string) {
        if (this.e.errno == -4058) throw message;
        return this;
    }
}


export function createXML(rootName: string, xml: object) {
    return {
        _declaration: { _attributes: { version: "1.0", encoding: "utf-8" } },
        [rootName]: xml
    }
}

export function XMLListToArray<D>(l: XML_List<D>): D[] {
    if (Array.isArray(l)) return l;
    else if (Array.isArray(l.li)) return l.li;
    else return [l.li];
}




export namespace SteamCMD {
    export function execute(opt: {
        downloadIds: string[],
        onEnd: (steamCMDResultPath: ReturnType<typeof Pathes.steamCMD>["steamCMDGamePath"], code: number | null) => void
    }) {
        const { steamCMDPath, steamCMDGamePath, steamCMD294100_acf } = Pathes.steamCMD();

        fs.removeSync(steamCMD294100_acf); // Cleare History...

        const steamcmd = spawn(path.join(steamCMDPath, "steamcmd.exe"), [
            "+login anonymous",
            ...opt.downloadIds.map(a => `+workshop_download_item 294100 ${a}`),
            "+quit"
        ]);

        steamcmd.on("error", e => {
            if ("code" in e && e.code == "ENOENT") throw Error("steamCMD_Path_ENOENT");
            else throw e;
        });
        steamcmd.stderr.on("data", d => process.stdout.write(d));
        // steamcmd.stdout.on("data", d => process.stdout.write(d));
        steamcmd.on("close", opt.onEnd.bind({}, steamCMDGamePath));
    }


    // export async function FromSteamCMDToTranslationsDir({ id, details }: {
    //     id: string,
    //     details: GetPublishedFileDetails
    // }) {
    //     const { steamCMDGamePath } = Pathes.steamCMD();

    //     const modPath = path.join(steamCMDGamePath, id);
    //     const translationAbout = await ReadModAbout(modPath);

    //     const originalModName = translationAbout.name._text.replace(/\sUA$/, "");


    //     const translationsPath = path.join(Pathes.translation_testing, `${id} ${originalModName}`)

    //     if (fs.existsSync(translationsPath)) {
    //         console.log(translationAbout.name._text, "Already loaded");
    //         await fs.rm(modPath, { recursive: true, force: true });
    //         return;
    //     }


    //     let finded = false;
    //     for (let pathToData of ["1.5", "1.4", "1.3", "1.2", "1.1", ""].map(v => `${v}/Languages/Ukrainian`)) {
    //         try {
    //             await fs.move(
    //                 path.join(steamCMDGamePath, id, pathToData),
    //                 translationsPath
    //             );
    //             finded = true;
    //             break;
    //         } catch (e) {
    //             if (typeof e == "object" && e && "errno" in e && e.errno == -4058) continue;
    //             else throw e;
    //         }
    //     }
    //     if (!finded) throw Error(`Переклад не знайдено для "${steamCMDGamePath}"`);

    //     await fs.rm(modPath, { recursive: true, force: true });

    //     const translationDependency = (await SteamAPI.getRequiredItems(id))[0];


    //     await fs.writeFileSync(path.join(translationsPath, "About.xml"), js2xml(createXML("TranslationDetails", {
    //         _attributes: {
    //             "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
    //             "xsi:noNamespaceSchemaLocation": "../../Scheme.xsd"
    //         },
    //         originalMod: {
    //             name: { _text: originalModName },
    //             id: { _text: translationDependency ?? "" },
    //             packageId: { _text: "" }
    //         },
    //         authors: {
    //             li: {
    //                 nickname: { _text: translationAbout.author._text },
    //                 steamId: { _text: details.creator ?? "" }
    //             }
    //         },
    //         sourceTranslationId: { _text: id },
    //         lastUpdate: { _text: new Date(details.time_updated * 1000).toISOString() }
    //     } satisfies TranslationAbout), { compact: true, spaces: 4 }));
    // }
}



export namespace SteamAPI {
    export function getDetailsFromWorkshop(modIds: string[]) {
        const API_KEY = process.env.STEAM_API_KEY;
        if (!API_KEY) throw Error("Steam API_KEY is missing");

        const formData = new FormData();
        formData.append("key", API_KEY);
        formData.append("itemcount", modIds.length.toString());
        for (let i = 0; i < modIds.length; i++)
            formData.append(`publishedfileids[${i}]`, modIds[i]!);

        return axios.post(`https://api.steampowered.com/ISteamRemoteStorage/GetPublishedFileDetails/v1/`, formData, {
            headers: {
                "Content-Type": "multipart/form-data"  // Важливо для правильного розпізнавання форми сервером
            }
        }).then(d => d.data.response.publishedfiledetails as GetPublishedFileDetails[]);
    }
    export async function getRequiredItems(id: string | number) {
        const { data } = await axios.get(`https://steamcommunity.com/sharedfiles/filedetails/?id=${id}`);
        const $ = cheerio.load(data);

        const ids: string[] = []

        $("#RequiredItems > a").each((i, e) => {
            const id = $(e).attr("href")?.match(/\d+$/g)?.[0];
            if (id) ids.push(id);
        });

        return ids;
    }
}



export function fixInvalidChars(string: string) { return string.replace(invalidCharsRegex, ""); }
export const invalidCharsRegex = /[<>:"/\\|?*]/g;




export function translationsAlreadyStored(id_name: string) {
    return fs.exists(path.join(Pathes.outputdir, id_name));
}