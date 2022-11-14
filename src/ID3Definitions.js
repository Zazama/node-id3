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
        publisherUrl:           "WPUB"
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

/**
 * Documented constants used in tag frames.
 *
 * @see {@link https://id3.org/} for more information.
 */
const Constants = {
    /**
     * Absolute time unit used by:
     * - Event timing codes (`ETCO` tag frame)
     * - Synchronised tempo codes (`SYTC` tag frame)
     * - Synchronised lyrics/text (`SYLT` tag frame)
     * - Position synchronisation frame (`POSS` tag frame))
     */
    TimeStampFormat: {
        MPEG_FRAMES: 1,
        MILLISECONDS: 2
    },
    /**
     * `SYLT` tag frame
     */
    SynchronisedLyrics: {
        ContentType: {
            OTHER: 0x00,
            LYRICS: 0x01,
            TEXT_TRANSCRIPTION: 0x02,
            MOVEMENT_OR_PART_NAME: 0x03,
            EVENTS: 0x04,
            CHORD: 0x05,
            TRIVIA_OR_POP_UP_INFORMATION: 0x06
        }
    },
    /**
     * `APIC` tag frame
     */
     AttachedPicture: {
        PictureType: {
            OTHER: 0,
            /**
             * 32x32 pixels (PNG only)
             */
            FILE_ICON: 0x01,
            OTHER_FILE_ICON: 0x02,
            FRONT_COVER: 0x03,
            BACK_COVER: 0x04,
            LEAFLET_PAGE: 0x05,
            /**
             * Label side of CD
             */
            MEDIA: 0x06
            /**
             * Lead artist/lead performer/soloist
             */,
            LEAD_ARTIST: 0x07,
            ARTIST_OR_PERFORMER: 0x08,
            CONDUCTOR: 0x09,
            BAND_OR_ORCHESTRA: 0x0A,
            COMPOSER: 0x0B,
            LYRICIST_OR_TEXT_WRITER: 0x0C,
            RECORDING_LOCATION: 0x0D,
            DURING_RECORDING: 0x0E,
            DURING_PERFORMANCE: 0x0F,
            MOVIE_OR_VIDEO_SCREEN_CAPTURE: 0x10,
            A_BRIGHT_COLOURED_FISH: 0x11,
            ILLUSTRATION: 0x12,
            BAND_OR_ARTIST_LOGOTYPE: 0x13,
            PUBLISHER_OR_STUDIO_LOGOTYPE: 0x14
        }
    }
}

module.exports.APIC_TYPES = APICTypes
module.exports.ENCODINGS = ENCODINGS
module.exports.FRAME_IDENTIFIERS = FRAME_IDENTIFIERS
module.exports.FRAME_INTERNAL_IDENTIFIERS = FRAME_INTERNAL_IDENTIFIERS
module.exports.ID3_FRAME_OPTIONS = ID3_FRAME_OPTIONS
module.exports.Constants = Constants
