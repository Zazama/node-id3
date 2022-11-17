const FRAME_IDENTIFIERS = {
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
    v3: {
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
        commercialFrame:        "COMR"
    }
}

const FRAME_INTERNAL_IDENTIFIERS = {
    v2: Object.keys(FRAME_IDENTIFIERS.v2).reduce((acc, key) => {
        acc[FRAME_IDENTIFIERS.v2[key]] = key
        return acc
    }, {}),
    v3: Object.keys(FRAME_IDENTIFIERS.v3).reduce((acc, key) => {
        acc[FRAME_IDENTIFIERS.v3[key]] = key
        return acc
    }, {})
}

const ID3_FRAME_OPTIONS = {
    v2: {
        "PIC": {
            multiple: false /* change in 1.0 */
        },
        "WCM": {
            multiple: true
        },
        "WAR": {
            multiple: true
        }
    },
    v3: {
        "T___": {
            multiple: false
        },
        "TXXX": {
            multiple: true,
            updateCompareKey: "description"
        },
        "APIC": {
            multiple: false /* change in 1.0 */
        },
        "USLT": {
            multiple: false
        },
        "SYLT": {
            multiple: true
        },
        "COMM": {
            multiple: false /* change in 1.0 */
        },
        "POPM": {
            multiple: false /* change in 1.0 */
        },
        "PRIV": {
            multiple: true
        },
        "CTOC": {
            multiple: true
        },
        "CHAP": {
            multiple: true
        },
        "WXXX": {
            multiple: true,
            updateCompareKey: "description"
        },
        "WCOM": {
            multiple: true
        },
        "WOAR": {
            multiple: true
        },
        "ETCO": {
            multiple: false
        },
        "COMR": {
            multiple: true
        }
    }
}

/*
**  List of official text information frames
**  LibraryName: "T***"
**  Value is the ID of the text frame specified in the link above, the object's keys are just for simplicity, you can also use the ID directly.
*/

/*
**  Officially available types of the picture frame
*/
const APICTypes = [
    "other",
    "file icon",
    "other file icon",
    "front cover",
    "back cover",
    "leaflet page",
    "media",
    "lead artist",
    "artist",
    "conductor",
    "band",
    "composer",
    "lyricist",
    "recording location",
    "during recording",
    "during performance",
    "video screen capture",
    "a bright coloured fish",
    "illustration",
    "band logotype",
    "publisher logotype"
]

const ENCODINGS = [
    'ISO-8859-1', 'UTF-16', 'UTF-16BE', 'utf8'
]

module.exports.APIC_TYPES = APICTypes
module.exports.ENCODINGS = ENCODINGS
module.exports.FRAME_IDENTIFIERS = FRAME_IDENTIFIERS
module.exports.FRAME_INTERNAL_IDENTIFIERS = FRAME_INTERNAL_IDENTIFIERS
module.exports.ID3_FRAME_OPTIONS = ID3_FRAME_OPTIONS
