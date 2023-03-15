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
    bpm?: TagFrames.Bpm,
    composer?: TagFrames.Composer,
    genre?: TagFrames.Genre,
    copyright?: TagFrames.Copyright,
    encodingTime?: TagFrames.EncodingTime,
    date?: TagFrames.RecordingDate,
    playlistDelay?: TagFrames.PlaylistDelay,
    originalReleaseTime?: TagFrames.OriginalReleaseTime,
    recordingTime?: TagFrames.RecordingTime,
    releaseTime?: TagFrames.ReleaseTime,
    taggingTime?: TagFrames.TaggingTime,
    encodedBy?: TagFrames.EncodedBy,
    textWriter?: TagFrames.TextWriter,
    fileType?: TagFrames.FileType,
    involvedPeopleList?: TagFrames.InvolvedPeopleList,
    time?: TagFrames.Time,
    contentGroup?: TagFrames.ContentGroup,
    title?: TagFrames.Title,
    subtitle?: TagFrames.Subtitle,
    initialKey?: TagFrames.InitialKey,
    language?: TagFrames.Language,
    length?: TagFrames.Length,
    musicianCreditsList?: TagFrames.MusicianCreditsList,
    mediaType?: TagFrames.MediaType,
    mood?: TagFrames.Mood,
    originalTitle?: TagFrames.OriginalTitle,
    originalFilename?: TagFrames.OriginalFilename,
    originalTextwriter?: TagFrames.OriginalTextwriter,
    originalArtist?: TagFrames.OriginalArtist,
    originalYear?: TagFrames.OriginalYear,
    fileOwner?: TagFrames.FileOwner,
    artist?: TagFrames.Artist,
    performerInfo?: TagFrames.PerformerInfo,
    conductor?: TagFrames.Conductor,
    remixArtist?: TagFrames.RemixArtist,
    partOfSet?: TagFrames.PartOfSet,
    producedNotice?: TagFrames.ProducedNotice,
    publisher?: TagFrames.Publisher,
    trackNumber?: TagFrames.TrackNumber,
    recordingDates?: TagFrames.RecordingDates,
    internetRadioName?: TagFrames.InternetRadioName,
    internetRadioOwner?: TagFrames.InternetRadioOwner,
    albumSortOrder?: TagFrames.AlbumSortOrder,
    performerSortOrder?: TagFrames.PerformerSortOrder,
    titleSortOrder?: TagFrames.TitleSortOrder,
    size?: TagFrames.Size,
    ISRC?: TagFrames.ISRC,
    encodingTechnology?: TagFrames.EncodingTechnology,
    setSubtitle?: TagFrames.SetSubtitle,
    year?: TagFrames.Year,
    comment?: TagFrames.Comment,
    unsynchronisedLyrics?: TagFrames.UnsynchronisedLyrics,
    synchronisedLyrics?: TypeOrTypeArray<TagFrames.SynchronisedLyrics>,
    userDefinedText?: TypeOrTypeArray<TagFrames.UserDefinedText>,
    image?: TagFrames.Image,
    popularimeter?: TagFrames.Popularimeter,
    private?: TypeOrTypeArray<TagFrames.Private>,
    uniqueFileIdentifier?: TypeOrTypeArray<TagFrames.UniqueFileIdentifier>,
    chapter?: TypeOrTypeArray<TagFrames.Chapter<Tags>>,
    tableOfContents?: TypeOrTypeArray<TagFrames.TableOfContents<Tags>>,
    commercialUrl?: TypeOrTypeArray<TagFrames.CommercialUrl>,
    copyrightUrl?: TagFrames.CopyrightUrl,
    fileUrl?: TagFrames.FileUrl,
    artistUrl?: TypeOrTypeArray<TagFrames.ArtistUrl>,
    audioSourceUrl?: TagFrames.AudioSourceUrl,
    radioStationUrl?: TagFrames.RadioStationUrl,
    paymentUrl?: TagFrames.PaymentUrl,
    publisherUrl?: TagFrames.PublisherUrl,
    userDefinedUrl?: TypeOrTypeArray<TagFrames.UserDefinedUrl>,
    eventTimingCodes?: TagFrames.EventTimingCodes,
    commercialFrame?: TypeOrTypeArray<TagFrames.CommercialFrame>
}

export interface TagIdentifiers {
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
    TYER?: TagAliases["year"]
    COMM?: TagAliases["comment"]
    APIC?: TagAliases["image"]
    USLT?: TagAliases["unsynchronisedLyrics"]
    SYLT?: TagAliases["synchronisedLyrics"]
    TXXX?: TagAliases["userDefinedText"]
    POPM?: TagAliases["popularimeter"]
    PRIV?: TagAliases["private"]
    UFID?: TagAliases["uniqueFileIdentifier"]
    CHAP?: TagAliases["chapter"]
    CTOC?: TagAliases["tableOfContents"]
    WCOM?: TagAliases["commercialUrl"]
    WCOP?: TagAliases["copyrightUrl"]
    WOAF?: TagAliases["fileUrl"]
    WOAR?: TagAliases["artistUrl"]
    WOAS?: TagAliases["audioSourceUrl"]
    WORS?: TagAliases["radioStationUrl"]
    WPAY?: TagAliases["paymentUrl"]
    WPUB?: TagAliases["publisherUrl"]
    WXXX?: TagAliases["userDefinedUrl"]
    ETCO?: TagAliases["eventTimingCodes"]
    COMR?: TagAliases["commercialFrame"]
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
