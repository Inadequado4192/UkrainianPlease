import path from "path";
import { ForEachTranslation, getLongest, Logging, ReadTranslationAbout, SteamAPI, XMLListToArray } from "./utils";
import { TranslationAbout } from "./types";
import { writeFileSync } from "fs-extra";

const loggin = new Logging();

const pathToModList_md = path.join(__dirname, "../modList.md");

const mods: [fileName: string, TranslationAbout][] = [];

loggin.write("Reading translations...");
ForEachTranslation(async ({ translationPath, translationFileName }) => {
    mods.push([translationFileName, await ReadTranslationAbout(translationPath)])
}).then(async () => {
    loggin.back();
    
    
    loggin.write("Craeting mod-list...");
    const details = await SteamAPI.getDetailsFromWorkshop(mods.map(([, a]) => a.originalMod.id._text));
    let data = `
> [!TIP]
> Якщо модифікація не була оновлена до останньої версії, деякі рядки тексту можуть залишатися неперекладеними. Однак, якщо оновлення стосується лише окремих аспектів функціоналу, переклад все одно повинен працювати коректно без необхідності оновлення модифікації.

`;

    const writeList = (num: string, name: string, authors: string, updateTranslationTime: string, updateModTime: string, forNewVersion: string) =>
        data += `| ${num} | ${name} | ${authors} | ${updateTranslationTime} | ${updateModTime} | ${forNewVersion} |\n`

    writeList("#", "Назва", "Автор", "Дата оновлення перекладу", "Дата оновлення моду", "Оновлено до нових версій");
    writeList("-", "-", "-", "-", "-", "-");

    mods.sort(([aname], [bname]) => aname.localeCompare(bname));

    for (let i = 0; i < mods.length; i++) {
        const [mName, m] = mods[i]!;
        const mDetailds = details.find(d => d.publishedfileid == m.originalMod.id._text);
        if (!mDetailds) throw Error(`Модифікацію ${mName} не знайдено`);
        writeList(
            `\`${i + 1}\``,
            `[${mName}](https://steamcommunity.com/sharedfiles/filedetails/?id=${m.originalMod.id._text})`,
            XMLListToArray(m.authors).map(a => `[${a.nickname._text}](http://steamcommunity.com/profiles/${a.steamId._text})`).join("\n"),
            m.lastUpdate?._text ? new Date(m.lastUpdate?._text).toLocaleDateString() : "-",
            new Date(mDetailds.time_updated * 1000).toLocaleDateString(),
            new Date(m.lastUpdate._text).getTime() > (mDetailds.time_updated * 1000) ? "✔️" : "❌"
        );
    }

    writeFileSync(pathToModList_md, data);
    loggin.back();
    loggin.write("Success");
});