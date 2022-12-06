const FrameIdentifiersV3 = {
    album:                  "TALB",
    bpm:                    "TBPM",
    composer:               "TCOM",
    genre:                  "TCON",
    copyright:              "TCOP",
    date:                   "TDAT",
    playlistDelay:          "TDLY",
    encodedBy:              "TENC",
    textWriter:             "TEXT",
    fileType:               "TFLT",
    time:                   "TIME",
    contentGroup:           "TIT1",
    title:                  "TIT2",
    subtitle:               "TIT3",
    initialKey:             "TKEY",
    language:               "TLAN",
    length:                 "TLEN",
    mediaType:              "TMED",
    originalTitle:          "TOAL",
    originalFilename:       "TOFN",
    originalTextwriter:     "TOLY",
    originalArtist:         "TOPE",
    originalYear:           "TORY",
    fileOwner:              "TOWN",
    artist:                 "TPE1",
    performerInfo:          "TPE2",
    conductor:              "TPE3",
    remixArtist:            "TPE4",
    partOfSet:              "TPOS",
    publisher:              "TPUB",
    trackNumber:            "TRCK",
    recordingDates:         "TRDA",
    internetRadioName:      "TRSN",
    internetRadioOwner:     "TRSO",
    size:                   "TSIZ",
    ISRC:                   "TSRC",
    encodingTechnology:     "TSSE",
    year:                   "TYER",
    comment:                "COMM",
    image:                  "APIC",
    unsynchronisedLyrics:   "USLT",
    synchronisedLyrics:     "SYLT",
    userDefinedText:        "TXXX",
    popularimeter:          "POPM",
    private:                "PRIV",
    chapter:                "CHAP",
    tableOfContents:        "CTOC",
    userDefinedUrl:         "WXXX",
    commercialUrl:          "WCOM",
    copyrightUrl:           "WCOP",
    fileUrl:                "WOAF",
    artistUrl:              "WOAR",
    audioSourceUrl:         "WOAS",
    radioStationUrl:        "WORS",
    paymentUrl:             "WPAY",
    publisherUrl:           "WPUB",
    eventTimingCodes:       "ETCO",
    commercialFrame:        "COMR",
    uniqueFileIdentifier:   "UFID"
} as const

/**
 * v4 removes some text frames compared to v3: TDAT, TIME, TRDA, TSIZ, TYER
 * It adds the text frames: TDEN, TDOR, TDRC, TDRL, TDTG, TIPL, TMCL, TMOO,
 * TPRO, TSOA, TSOP, TSOT, TSST
 *
 * Removed other frames: CHAP, CTOC
 */
const FrameIdentifiersV4 = {
    image:                  "APIC",
    comment:                "COMM",
    commercialFrame:        "COMR",
    eventTimingCodes:       "ETCO",
    private:                "PRIV",
    popularimeter:          "POPM",
    synchronisedLyrics:     "SYLT",
    album:                  "TALB",
    bpm:                    "TBPM",
    composer:               "TCOM",
    genre:                  "TCON",
    copyright:              "TCOP",
    encodingTime:           "TDEN",
    playlistDelay:          "TDLY",
    originalReleaseTime:    "TDOR",
    recordingTime:          "TDRC",
    releaseTime:            "TDRL",
    taggingTime:            "TDTG",
    encodedBy:              "TENC",
    textWriter:             "TEXT",
    fileType:               "TFLT",
    involvedPeopleList:     "TIPL",
    contentGroup:           "TIT1",
    title:                  "TIT2",
    subtitle:               "TIT3",
    initialKey:             "TKEY",
    language:               "TLAN",
    length:                 "TLEN",
    musicianCreditsList:    "TMCL",
    mediaType:              "TMED",
    mood:                   "TMOO",
    originalTitle:          "TOAL",
    originalFilename:       "TOFN",
    originalTextwriter:     "TOLY",
    originalArtist:         "TOPE",
    fileOwner:              "TOWN",
    artist:                 "TPE1",
    performerInfo:          "TPE2",
    conductor:              "TPE3",
    remixArtist:            "TPE4",
    partOfSet:              "TPOS",
    producedNotice:         "TPRO",
    publisher:              "TPUB",
    trackNumber:            "TRCK",
    internetRadioName:      "TRSN",
    internetRadioOwner:     "TRSO",
    albumSortOrder:         "TSOA",
    performerSortOrder:     "TSOP",
    titleSortOrder:         "TSOT",
    ISRC:                   "TSRC",
    encodingTechnology:     "TSSE",
    setSubtitle:            "TSST",
    userDefinedText:        "TXXX",
    unsynchronisedLyrics:   "USLT",
    commercialUrl:          "WCOM",
    copyrightUrl:           "WCOP",
    fileUrl:                "WOAF",
    artistUrl:              "WOAR",
    audioSourceUrl:         "WOAS",
    radioStationUrl:        "WORS",
    paymentUrl:             "WPAY",
    publisherUrl:           "WPUB",
    userDefinedUrl:         "WXXX"
} as const

/**
 * Alias to identifier
 */
export const FRAME_IDENTIFIERS = {
    v2: {
        album:                  "TAL",
        bpm:                    "TBP",
        composer:               "TCM",
        genre:                  "TCO",
        copyright:              "TCR",
        date:                   "TDA",
        playlistDelay:          "TDY",
        encodedBy:              "TEN",
        textWriter:             "TEXT",
        fileType:               "TFT",
        time:                   "TIM",
        contentGroup:           "TT1",
        title:                  "TT2",
        subtitle:               "TT3",
        initialKey:             "TKE",
        language:               "TLA",
        length:                 "TLE",
        mediaType:              "TMT",
        originalTitle:          "TOT",
        originalFilename:       "TOF",
        originalTextwriter:     "TOL",
        originalArtist:         "TOA",
        originalYear:           "TOR",
        artist:                 "TP1",
        performerInfo:          "TP2",
        conductor:              "TP3",
        remixArtist:            "TP4",
        partOfSet:              "TPA",
        publisher:              "TPB",
        trackNumber:            "TRK",
        recordingDates:         "TRD",
        size:                   "TSI",
        ISRC:                   "TRC",
        encodingTechnology:     "TSS",
        year:                   "TYE",
        image:                  "PIC",
        commercialUrl:          "WCM",
        copyrightUrl:           "WCP",
        fileUrl:                "WAF",
        artistUrl:              "WAR",
        audioSourceUrl:         "WAS",
        publisherUrl:           "WPB",
        userDefinedUrl:         "WXX"
    },
    v3: FrameIdentifiersV3,
    v4: FrameIdentifiersV4,
    v34: {
        ...FrameIdentifiersV3,
        ...FrameIdentifiersV4
    }
} as const

/**
 * Identifier to Alias
 */
export const FRAME_ALIASES =
    Object.entries(FRAME_IDENTIFIERS).reduce<
        Record<string, Record<string,string>>
    >(
        (acc, [versionKey, frameIdentifiers]) => {
            acc[versionKey] = Object.entries(frameIdentifiers).reduce<
                Record<string, string>
            >(
                (acc, [tagKey, frameIdentifier]) => {
                    acc[frameIdentifier] = tagKey
                    return acc
                },
                {}
            )
            return acc
        },
        {}
    )
