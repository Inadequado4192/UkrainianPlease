import fs from "fs-extra";
import path from "path";
import { createXML, fixInvalidChars, invalidCharsRegex, Pathes, ReadModAbout, SteamAPI, SteamCMD, translationsAlreadyStored, XMLListToArray } from "./utils";
import { TranslationAbout } from "./types";
import { js2xml } from "xml-js";

(() => {
    const ids = process.argv.slice(2);

    const _details = SteamAPI.getDetailsFromWorkshop(ids);

    SteamCMD.execute({
        downloadIds: ids,
        async onEnd(steamCMDGamePath, code) {
            const d = await _details;
            for (let id of ids) {
                const details = d.find(d => d.publishedfileid == id)!
                // await SteamCMD.FromSteamCMDToTranslationsDir({
                //     id, details: d.find(d => d.publishedfileid == id)!
                // });

                const modPath = path.join(steamCMDGamePath, id);
                const translationAbout = await ReadModAbout(modPath);

                const originalModName = fixInvalidChars(
                    translationAbout.name._text.replace(/\s(UA|[–-] Український переклад)$/i, "")
                );

                // if (await translationsAlreadyStored(originalModName)) {

                // }

                const storageTranslationsPath = path.join(Pathes.translation_testing, originalModName)

                if (fs.existsSync(storageTranslationsPath)) {
                    console.log(`${translationAbout.name._text} вже завантажено.`);
                    await fs.rm(modPath, { recursive: true, force: true });
                    continue;
                }



                // Finding Translation
                let translationDataPath: null | string = null;
                {
                    const various = ["1.5", "1.4", "1.3", "1.2", "1.1", ""];
                    for (let i = 0; i < various.length && !translationDataPath; i++) {
                        let target = path.join(steamCMDGamePath, id, various[i]!, `Languages/Ukrainian`);
                        if (fs.existsSync(target)) translationDataPath = target;
                    }
                    if (!translationDataPath) throw Error(`Переклад не знайдено для "${path.join(steamCMDGamePath, id)}"`);
                }



                await fs.move(translationDataPath, storageTranslationsPath);


                await fs.rm(modPath, { recursive: true, force: true });

                // const translationDependency = (await SteamAPI.getRequiredItems(id))[0];


                const targetMod = XMLListToArray(translationAbout.modDependencies ?? [])[0];

                await fs.writeFileSync(path.join(storageTranslationsPath, "About.xml"), js2xml(createXML("TranslationDetails", {
                    _attributes: {
                        "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
                        "xsi:noNamespaceSchemaLocation": "../../Scheme.xsd"
                    },
                    originalMod: {
                        // name: { _text: originalModName },
                        // id: { _text: translationDependency ?? "" },
                        // packageId: { _text: "" }
                        name: { _text: targetMod?.displayName._text ?? "" },
                        id: { _text: targetMod?.steamWorkshopUrl?._text.match(/\d+$/g)?.[0] ?? "" },
                        packageId: { _text: targetMod?.packageId._text ?? "" }
                    },
                    authors: {
                        li: {
                            nickname: { _text: translationAbout.author._text },
                            steamId: { _text: details.creator ?? "" }
                        }
                    },
                    sourceTranslationId: { _text: id },
                    lastUpdate: { _text: new Date(details.time_updated * 1000).toISOString() }
                } satisfies TranslationAbout), { compact: true, spaces: 4 }));
            }
        },
    })
})();