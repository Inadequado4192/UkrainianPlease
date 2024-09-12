import fs from "fs-extra"
import path from "path";
import { xml2js, js2xml, Options, ElementCompact } from "xml-js";
import { createXML, fixInvalidChars, ForEachTranslation, Pathes, ReadTranslationAbout, XMLListToArray, xmlReaderOptions } from "./utils";
import { TranslationAbout } from "./types";





(async () => {
    const {
        outputTranslationsDir,
    } = Pathes;
    // const rootPath = "./Translations/Completed";

    const modMap: TranslationAbout[] = [];

    // const DefInjectedMap: Record<string, LanguageDataCompact["LanguageData"]> = {};
    // const KeyedMap: LanguageDataCompact["LanguageData"] = {};
    // const ModsInfo: (TranslationAbout & { type: string })[] = [];

    if (fs.existsSync(outputTranslationsDir)) fs.emptyDirSync(outputTranslationsDir); // Clear dir
    else fs.mkdirSync(outputTranslationsDir, { recursive: true });

    await ForEachTranslation(async ({ rootPath, translationFileName, translationPath }) => {
        const tAbout = await ReadTranslationAbout(translationPath);

        const outputTranslationPath = path.join(Pathes.outputTranslationsDir, fixInvalidChars(tAbout.originalMod.name._text), "Languages/Ukrainian");

        fs.mkdirSync(outputTranslationPath, { recursive: true, });
        fs.copySync(translationPath, outputTranslationPath, {});
        
        fs.rmSync(path.join(outputTranslationPath, "About.xml"));

        modMap.push(tAbout);

        // const mod: ModTranslationData = {
        //     DefInjectedMap: {},
        //     KeyedMap: {},
        //     _info: {
        //         ...await ReadTranslationAbout(modPath),
        //         type: rootPath == "./Translations/Completed" ? "Completed" : "Incompleted"
        //     }
        // }
        // const DefInjected = path.join(modPath, "DefInjected");
        // const Keyed = path.join(modPath, "Keyed");

        // if (await fs.existsSync(DefInjected)) {
        //     for (let defDirs of await fs.readdirSync(DefInjected)) {
        //         for (let filename of await fs.readdirSync(path.join(DefInjected, defDirs))) {
        //             const xml = xml2js(await fs.readFileSync(path.join(DefInjected, defDirs, filename)).toString(), xmlReaderOptions) as LanguageDataCompact;
        //             Object.assign(mod.DefInjectedMap[defDirs] ?? (mod.DefInjectedMap[defDirs] = {}), xml.LanguageData);
        //         }
        //     }
        // }

        // if (await fs.existsSync(Keyed)) {
        //     for (let filename of await fs.readdirSync(Keyed)) {
        //         const xml = xml2js(await fs.readFileSync(path.join(Keyed, filename)).toString(), xmlReaderOptions) as LanguageDataCompact;
        //         Object.assign(mod.KeyedMap, xml.LanguageData);
        //     }
        // }

        // modMap.push(mod);
    });








    fs.writeFile(
        Pathes.modLoadFolders,
        js2xml(
            createXML(
                "loadFolders",
                Object.assign({},
                    ...(["v1.0", "v1.1", "v1.2", "v1.3", "v1.4", "v1.5"].map(v => ({
                        [v]: {
                            li: modMap.map(m => ({
                                _attributes: { "IfModActive": m.originalMod.packageId._text },
                                _text: "Translations/" + fixInvalidChars(m.originalMod.name._text)
                            }))
                        }
                    })))
                )
            ), { compact: true, spaces: 4 }
        )
    );

    function write(fpath: string, data: ElementCompact) {
        return fs.writeFileSync(
            fpath,
            js2xml({
                _declaration: { _attributes: { version: "1.0", encoding: "utf-8" } },
                ...data
            }, { compact: true, spaces: 4 }),
        );
    }

    {
        // Write in About
        const a = xml2js(await fs.readFileSync(Pathes.pathToAbout).toString(), xmlReaderOptions) as ElementCompact;
        a.ModMetaData.description._text = (a.ModMetaData.description._text as string).replace(/Мод містить переклади для (\d+) модів./, `Мод містить переклади для ${modMap.length} модів.`)
//         const keyString = "[h3]Список перекладу[/h3]";
//         a.ModMetaData.description._text = (a.ModMetaData.description._text as string).replace(
//             new RegExp(`${keyString.replace(/(\[|\])/g, "\\$1")}(.|\n|\t|\r)+$`),
//             keyString + `
// [table]
// ${[...modMap].map(i => `
// [tr]
//     [td][url=https://steamcommunity.com/sharedfiles/filedetails/?id=${i.originalMod.id._text}]${i.originalMod.name._text}[/url][/td]
//     [td]${XMLListToArray(i.authors).map(d => `[url=http://steamcommunity.com/profiles/${d.steamId._text}]${d.nickname._text}[/url]`).join(", ")}[/td]
// [/tr]
// `.trim()).join("\n")}
// [/table]`
//         );
        // console.log(a);
        await write(Pathes.pathToAbout, a);
    }
})();
// http://steamcommunity.com/profiles/76561198328065280


interface LanguageDataCompact {
    _declaration?: { _attributes: { version: "1.0", encoding: "utf-8" } }
    LanguageData: Record<string, { _text: string }>
}