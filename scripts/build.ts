import fs from "fs-extra"
import path from "path";
import { xml2js, js2xml, Options, ElementCompact } from "xml-js";
import { createXML, fixInvalidChars, ForEachTranslation, Logging, Pathes, ReadTranslationAbout, SteamAPI, XMLListToArray, xmlReaderOptions } from "./utils";
import { TranslationAbout } from "./types";

const logging = new Logging();
const options = process.argv.slice(2);

(async () => {

    const modMap: { about: TranslationAbout, output: string }[] = [];

    // process
    if (!options.includes("about-only")) {
        await doTranslations();
        await doLoadFolders();
    }
    await doAbout();



    async function doTranslations() {


        if (fs.existsSync(Pathes.outputTranslationsDir)) await fs.emptyDir(Pathes.outputTranslationsDir); // Clear dir
        else await fs.mkdir(Pathes.outputTranslationsDir, { recursive: true });



        logging.write("Reading translations folder...");
        await ForEachTranslation(async ({ rootPath, translationFileName, translationPath }) => {
            const about = await ReadTranslationAbout(translationPath);
            const output = fixInvalidChars(translationFileName);

            const outputTranslationPath = path.join(Pathes.outputTranslationsDir, output, "Languages/Ukrainian");

            await fs.mkdir(outputTranslationPath, { recursive: true, });
            await fs.copy(translationPath, outputTranslationPath, {});

            await fs.rm(path.join(outputTranslationPath, "About.xml"));

            modMap.push({ about, output });
        });
        logging.back();
    }

    async function doLoadFolders() {
        logging.write("Creating `loadFolders.xml`...");
        await fs.writeFile(
            Pathes.modLoadFolders,
            js2xml(
                createXML(
                    "loadFolders",
                    Object.assign({}, {
                        "v1.5": {
                            li: modMap.map(m => {
                                // const md = details.find(d => d.publishedfileid == m.about.originalMod.id._text);
                                // if (!md) throw Error(`Модифікація ${m.about.originalMod.id._text} не знайдена`);
                                return {
                                    _attributes: { "IfModActive": m.about.originalMod.packageId._text },
                                    _text: "Translations/" + m.output
                                }
                            })
                        }
                    })
                ), { compact: true, spaces: 4 }
            )
        );
        logging.back();
    }
    async function doAbout() {
        logging.write("Creating `About.xml`...");

        const VARS = {
            "MOD_COUNT": (await fs.readdir(Pathes.translation_completed)).length
        }

        let modAboutText = await fs.readFileSync(Pathes.pathToAbout_Layout).toString();
        for (let v in VARS)
            modAboutText = modAboutText.replaceAll(`{{${v}}}`, String(VARS[v as keyof typeof VARS]));
        await fs.writeFile(Pathes.pathToAbout, modAboutText)
        logging.back();
    }
    logging.write("Success");
})();
// http://steamcommunity.com/profiles/{steamid}


interface LanguageDataCompact {
    _declaration?: { _attributes: { version: "1.0", encoding: "utf-8" } }
    LanguageData: Record<string, { _text: string }>
}