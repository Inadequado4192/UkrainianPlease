export type XML_List<D = any> = D[] | { li: D } | { li: D[] };
export type XML_String = { _text: string }

export interface TranslationAbout {
    _attributes?: Record<string, string>
    originalMod: {
        name: XML_String
        id: XML_String
        packageId: XML_String
    }
    authors: XML_List<{ nickname: XML_String, steamId: XML_String }>,
    sourceTranslationId?: XML_String
    lastUpdate?: XML_String
}


export interface ModAbout {
    name: XML_String,
    package: XML_String,
    author: XML_String,
    modDependencies?: XML_List<{
        packageId: XML_String,
        displayName: XML_String,
        steamWorkshopUrl?:XML_String,
        downloadUrl?: XML_String
    }>
}

export interface GetPublishedFileDetails {
    publishedfileid: string,
    result: number,
    creator: string,
    creator_app_id: number,
    consumer_app_id: number,
    filename: string,
    file_size: string,
    file_url: string,
    hcontent_file: string,
    preview_url: string,
    hcontent_preview: string,
    title: string,
    description: string,
    time_created: number,
    time_updated: number,
    visibility: number,
    banned: number,
    ban_reason: "",
    subscriptions: number,
    favorited: number,
    lifetime_subscriptions: number,
    lifetime_favorited: number,
    views: number,
    tags: { tag: string }[]
}