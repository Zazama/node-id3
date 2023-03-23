import * as TagFrames from "./TagFrames"

/**
 * Tag frames type definitions and documentations.
 *
 * @public
 */
export { TagFrames }

/**
 * A utility to define an union of the given type or an array of the type.
 *
 * @remarks
 * Used for frames that can have multiple instances.
 *
 * @public
 */
export type TypeOrTypeArray<T> = T | T[]

/**
 * @public
 */
export interface TagAliases {
    album?: TagFrames.Album,
    albumSortOrder?: TagFrames.AlbumSortOrder,
    artist?: TagFrames.Artist,
    artistUrl?: TypeOrTypeArray<TagFrames.ArtistUrl>,
    audioSourceUrl?: TagFrames.AudioSourceUrl,
    bpm?: TagFrames.Bpm,
    chapter?: TypeOrTypeArray<TagFrames.Chapter<Tags>>,
    comment?: TagFrames.Comment,
    commercialFrame?: TypeOrTypeArray<TagFrames.CommercialFrame>
    commercialUrl?: TypeOrTypeArray<TagFrames.CommercialUrl>,
    composer?: TagFrames.Composer,
    conductor?: TagFrames.Conductor,
    contentGroup?: TagFrames.ContentGroup,
    copyright?: TagFrames.Copyright,
    copyrightUrl?: TagFrames.CopyrightUrl,
    date?: TagFrames.RecordingDate,
    encodedBy?: TagFrames.EncodedBy,
    encodingTechnology?: TagFrames.EncodingTechnology,
    encodingTime?: TagFrames.EncodingTime,
    eventTimingCodes?: TagFrames.EventTimingCodes,
    fileOwner?: TagFrames.FileOwner,
    fileType?: TagFrames.FileType,
    fileUrl?: TagFrames.FileUrl,
    genre?: TagFrames.Genre,
    image?: TagFrames.Image,
    initialKey?: TagFrames.InitialKey,
    internetRadioName?: TagFrames.InternetRadioName,
    internetRadioOwner?: TagFrames.InternetRadioOwner,
    involvedPeopleList?: TagFrames.InvolvedPeopleList,
    ISRC?: TagFrames.ISRC,
    language?: TagFrames.Language,
    length?: TagFrames.Length,
    mediaType?: TagFrames.MediaType,
    mood?: TagFrames.Mood,
    musicianCreditsList?: TagFrames.MusicianCreditsList,
    originalArtist?: TagFrames.OriginalArtist,
    originalFilename?: TagFrames.OriginalFilename,
    originalReleaseTime?: TagFrames.OriginalReleaseTime,
    originalTextwriter?: TagFrames.OriginalTextwriter,
    originalTitle?: TagFrames.OriginalTitle,
    originalYear?: TagFrames.OriginalYear,
    partOfSet?: TagFrames.PartOfSet,
    paymentUrl?: TagFrames.PaymentUrl,
    performerInfo?: TagFrames.PerformerInfo,
    performerSortOrder?: TagFrames.PerformerSortOrder,
    playlistDelay?: TagFrames.PlaylistDelay,
    popularimeter?: TagFrames.Popularimeter,
    private?: TypeOrTypeArray<TagFrames.Private>,
    producedNotice?: TagFrames.ProducedNotice,
    publisher?: TagFrames.Publisher,
    publisherUrl?: TagFrames.PublisherUrl,
    radioStationUrl?: TagFrames.RadioStationUrl,
    recordingDates?: TagFrames.RecordingDates,
    recordingTime?: TagFrames.RecordingTime,
    releaseTime?: TagFrames.ReleaseTime,
    remixArtist?: TagFrames.RemixArtist,
    setSubtitle?: TagFrames.SetSubtitle,
    size?: TagFrames.Size,
    subtitle?: TagFrames.Subtitle,
    synchronisedLyrics?: TypeOrTypeArray<TagFrames.SynchronisedLyrics>,
    tableOfContents?: TypeOrTypeArray<TagFrames.TableOfContents<Tags>>,
    taggingTime?: TagFrames.TaggingTime,
    textWriter?: TagFrames.TextWriter,
    time?: TagFrames.Time,
    title?: TagFrames.Title,
    titleSortOrder?: TagFrames.TitleSortOrder,
    trackNumber?: TagFrames.TrackNumber,
    uniqueFileIdentifier?: TypeOrTypeArray<TagFrames.UniqueFileIdentifier>,
    unsynchronisedLyrics?: TagFrames.UnsynchronisedLyrics,
    userDefinedText?: TypeOrTypeArray<TagFrames.UserDefinedText>,
    userDefinedUrl?: TypeOrTypeArray<TagFrames.UserDefinedUrl>,
    year?: TagFrames.Year,
}

export interface TagIdentifiers {
    APIC?: TagAliases["image"]
    CHAP?: TagAliases["chapter"]
    COMM?: TagAliases["comment"]
    COMR?: TagAliases["commercialFrame"]
    CTOC?: TagAliases["tableOfContents"]
    ETCO?: TagAliases["eventTimingCodes"]
    POPM?: TagAliases["popularimeter"]
    PRIV?: TagAliases["private"]
    SYLT?: TagAliases["synchronisedLyrics"]
    TALB?: TagAliases["album"]
    TBPM?: TagAliases["bpm"]
    TCOM?: TagAliases["composer"]
    TCON?: TagAliases["genre"]
    TCOP?: TagAliases["copyright"]
    TDAT?: TagAliases["date"]
    TDEN?: TagAliases["encodingTime"]
    TDLY?: TagAliases["playlistDelay"]
    TDOR?: TagAliases["originalReleaseTime"]
    TDRC?: TagAliases["recordingTime"]
    TDRL?: TagAliases["releaseTime"]
    TDTG?: TagAliases["taggingTime"]
    TENC?: TagAliases["encodedBy"]
    TEXT?: TagAliases["textWriter"]
    TFLT?: TagAliases["fileType"]
    TIME?: TagAliases["time"]
    TIPL?: TagAliases["involvedPeopleList"]
    TIT1?: TagAliases["contentGroup"]
    TIT2?: TagAliases["title"]
    TIT3?: TagAliases["subtitle"]
    TKEY?: TagAliases["initialKey"]
    TLAN?: TagAliases["language"]
    TLEN?: TagAliases["length"]
    TMCL?: TagAliases["musicianCreditsList"]
    TMED?: TagAliases["mediaType"]
    TMOO?: TagAliases["mood"]
    TOAL?: TagAliases["originalTitle"]
    TOFN?: TagAliases["originalFilename"]
    TOLY?: TagAliases["originalTextwriter"]
    TOPE?: TagAliases["originalArtist"]
    TORY?: TagAliases["originalYear"]
    TOWN?: TagAliases["fileOwner"]
    TPE1?: TagAliases["artist"]
    TPE2?: TagAliases["performerInfo"]
    TPE3?: TagAliases["conductor"]
    TPE4?: TagAliases["remixArtist"]
    TPOS?: TagAliases["partOfSet"]
    TPRO?: TagAliases["producedNotice"]
    TPUB?: TagAliases["publisher"]
    TRCK?: TagAliases["trackNumber"]
    TRDA?: TagAliases["recordingDates"]
    TRSN?: TagAliases["internetRadioName"]
    TRSO?: TagAliases["internetRadioOwner"]
    TSIZ?: TagAliases["size"]
    TSOA?: TagAliases["albumSortOrder"]
    TSOP?: TagAliases["performerSortOrder"]
    TSOT?: TagAliases["titleSortOrder"]
    TSRC?: TagAliases["ISRC"]
    TSSE?: TagAliases["encodingTechnology"]
    TSST?: TagAliases["setSubtitle"]
    TXXX?: TagAliases["userDefinedText"]
    TYER?: TagAliases["year"]
    UFID?: TagAliases["uniqueFileIdentifier"]
    USLT?: TagAliases["unsynchronisedLyrics"]
    WCOM?: TagAliases["commercialUrl"]
    WCOP?: TagAliases["copyrightUrl"]
    WOAF?: TagAliases["fileUrl"]
    WOAR?: TagAliases["artistUrl"]
    WOAS?: TagAliases["audioSourceUrl"]
    WORS?: TagAliases["radioStationUrl"]
    WPAY?: TagAliases["paymentUrl"]
    WPUB?: TagAliases["publisherUrl"]
    WXXX?: TagAliases["userDefinedUrl"]
}

/**
 * On write either a tag alias or tag identifier can be be specified.
 * This is undefined behaviour when both are specified.
 */
export interface WriteTags extends TagAliases, TagIdentifiers {
}

export interface Tags extends TagAliases {
    raw?: TagIdentifiers
}
