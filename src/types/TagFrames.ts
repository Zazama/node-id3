/**
 * Tag frames type definitions and documentations.
 *
 * @public
 */


import { TagConstants } from "../definitions/TagConstants"
import { Values } from "../types/utility"

/**
 * Tag frames type definitions and documentations.
 *
 * @public
 */


/**
 * The 'Album/Movie/Show title' frame is intended for the title of the recording(/source of sound) which the audio in the file is taken from.
 *
 * @public
 */
export type Album = string

/**
 * The 'BPM' frame contains the number of beats per minute in the mainpart of the audio. The BPM is an integer and represented as a numerical string.
 *
 * @public
 */
export type Bpm = string

/**
 *  The 'Composer(s)' frame is intended for the name of the composer(s). They are seperated with the "/" character.
 *
 * @public
 */
export type Composer = string

/**
 * The 'Content type', which previously was stored as a one byte numeric value only, is now a numeric string. You may use one or several of the types as ID3v1.1 did or, since the category list would be impossible to maintain with accurate and up to date categories, define your own.
 *
 * References to the ID3v1 genres can be made by, as first byte, enter "(" followed by a number from the genres list (appendix A) and ended with a ")" character. This is optionally followed by a refinement, e.g. "(21)" or "(4)Eurodisco". Several references can be made in the same frame, e.g. "(51)(39)". If the refinement should begin with a "(" character it should be replaced with "((", e.g. "((I can figure out any genre)" or "(55)((I think...)"
 *
 * @public
 */
export type Genre = string

/**
 * The 'Copyright message' frame, which must begin with a year and a space character (making five characters), is intended for the copyright holder of the original sound, not the audio file itself. The absence of this frame means only that the copyright information is unavailable or has been removed, and must not be interpreted to mean that the sound is public domain. Every time this field is displayed the field must be preceded with "Copyright © ".
 *
 * @public
 */
export type Copyright = string

/**
 * The 'Encoding time' frame contains a timestamp describing when the
 audio was encoded. Valid timestamps are yyyy, yyyy-MM, yyyy-MM-dd, yyyy-MM-ddTHH, yyyy-MM-ddTHH:mm and yyyy-MM-ddTHH:mm:ss.
 *
 * @public
 */
export type EncodingTime = string

/**
 * The 'Date' frame is a numeric string in the DDMM format containing the date for the recording. This field is always four characters long.
 *
 * @public
 */
export type RecordingDate = string

/**
 * The 'Playlist delay' defines the numbers of milliseconds of silence between every song in a playlist. The player should use the "ETC" frame, if present, to skip initial silence and silence at the end of the audio to match the 'Playlist delay' time. The time is represented as a numeric string.
 *
 * @public
 */
export type PlaylistDelay = string

/**
 * The 'Original release time' frame contains a timestamp describing when the original recording of the audio was released. Valid timestamps are yyyy, yyyy-MM, yyyy-MM-dd, yyyy-MM-ddTHH, yyyy-MM-ddTHH:mm and yyyy-MM-ddTHH:mm:ss.
 *
 * @public
 */
export type OriginalReleaseTime = string

/**
 * The 'Recording time' frame contains a timestamp describing when the audio was recorded. Valid timestamps are yyyy, yyyy-MM, yyyy-MM-dd, yyyy-MM-ddTHH, yyyy-MM-ddTHH:mm and yyyy-MM-ddTHH:mm:ss.
 *
 * @public
 */
export type RecordingTime = string

/**
 * The 'Release time' frame contains a timestamp describing when the audio was first released. Valid timestamps are yyyy, yyyy-MM, yyyy-MM-dd, yyyy-MM-ddTHH, yyyy-MM-ddTHH:mm and yyyy-MM-ddTHH:mm:ss.
 *
 * @public
 */
export type ReleaseTime = string

/**
 * The 'Tagging time' frame contains a timestamp describing then the audio was tagged. Valid timestamps are yyyy, yyyy-MM, yyyy-MM-dd, yyyy-MM-ddTHH, yyyy-MM-ddTHH:mm and yyyy-MM-ddTHH:mm:ss.
 *
 * @public
 */
export type TaggingTime = string

/**
 * The 'Encoded by' frame contains the name of the person or organisation that encoded the audio file. This field may contain a copyright message, if the audio file also is copyrighted by the encoder.
 *
 * @public
 */
export type EncodedBy = string

/**
 * The 'Lyricist(s)/Text writer(s)' frame is intended for the writer(s) of the text or lyrics in the recording. They are seperated with the "/" character.
 *
 * @public
 */
export type TextWriter = string

/**
 * The 'File type' frame indicates which type of audio this tag defines. The following type and refinements are defined:
 *
 * MPG       MPEG Audio
 * /1        MPEG 1/2 layer I
 * /2        MPEG 1/2 layer II
 * /3        MPEG 1/2 layer III
 * /2.5      MPEG 2.5
 *  /AAC     Advanced audio compression
 * VQF       Transform-domain Weighted Interleave Vector Quantization
 * PCM       Pulse Code Modulated audio
 *
 * but other types may be used, not for these types though. This is used in a similar way to the predefined types in the "Media type" frame, but without parentheses. If this frame is not present audio type is assumed to be "MPG".
 *
 * @public
 */
export type FileType = string

/**
 * The 'Involved people list' is very similar to the musician credits list, but maps between functions, like producer, and names.
 *
 * @public
 */
export type InvolvedPeopleList = string

/**
 * The 'Time' frame is a numeric string in the HHMM format containing the time for the recording. This field is always four characters long.
 *
 * @public
 */
export type Time = string

/**
 * The 'Content group description' frame is used if the sound belongs to a larger category of sounds/music. For example, classical music is often sorted in different musical sections (e.g. "Piano Concerto", "Weather - Hurricane").
 *
 * @public
 */
export type ContentGroup = string

/**
 * The 'Title/Songname/Content description' frame is the actual name of the piece (e.g. "Adagio", "Hurricane Donna").
 *
 * @public
 */
export type Title = string

/**
 * The 'Subtitle/Description refinement' frame is used for information directly related to the contents title (e.g. "Op. 16" or "Performed live at Wembley").
 *
 * @public
 */
export type Subtitle = string

/**
 * The 'Initial key' frame contains the musical key in which the sound starts. It is represented as a string with a maximum length of three characters. The ground keys are represented with "A","B","C","D","E", "F" and "G" and halfkeys represented with "b" and "#". Minor is represented as "m". Example "Cbm". Off key is represented with an "o" only.
 *
 * @public
 */
export type InitialKey = string

/**
 * The 'Language(s)' frame should contain the languages of the text or lyrics spoken or sung in the audio. The language is represented with three characters according to ISO-639-2. If more than one language is used in the text their language codes should follow according to their usage.
 *
 * @see {@link https://id3.org/ISO%20639-2 | ISO 639-2}
 *
 * @public
 */
export type Language = string

/**
 * The 'Length' frame contains the length of the audiofile in milliseconds, represented as a numeric string.
 *
 * @public
 */
export type Length = string

/**
 * The 'Musician credits list' is intended as a mapping between instruments and the musician that played it. Every odd field is an instrument and every even is an artist or a comma delimited list of artists.
 *
 * @public
 */
export type MusicianCreditsList = string

/**
 * The 'Media type' frame describes from which media the sound originated.
 *
 * @remarks This may be a text string or a reference to the predefined media types found in the list below. References are made within "(" and ")" and are optionally followed by a text refinement, e.g. "(MC) with four channels". If a text refinement should begin with a "(" character it should be replaced with "((". Predefined refinements is appended after the media type, e.g. "(CD/A)" or "(VID/PAL/VHS)".
 *
 * ```
 * DIG    Other digital media
 *    /A  Analog transfer from media
 *
 * ANA    Other analog media
 *   /WAC Wax cylinder
 *   /8CA 8-track tape cassette
 *
 * CD     CD
 *     /A Analog transfer from media
 *    /DD DDD
 *    /AD ADD
 *    /AA AAD
 *
 * LD     Laserdisc
 *     /A Analog transfer from media
 *
 * TT     Turntable records
 *    /33 33.33 rpm
 *    /45 45 rpm
 *    /71 71.29 rpm
 *    /76 76.59 rpm
 *    /78 78.26 rpm
 *    /80 80 rpm
 *
 * MD     MiniDisc
 *     /A Analog transfer from media
 *
 * DAT    DAT
 *     /A Analog transfer from media
 *     /1 standard, 48 kHz/16 bits, linear
 *     /2 mode 2, 32 kHz/16 bits, linear
 *     /3 mode 3, 32 kHz/12 bits, nonlinear, low speed
 *     /4 mode 4, 32 kHz/12 bits, 4 channels
 *     /5 mode 5, 44.1 kHz/16 bits, linear
 *     /6 mode 6, 44.1 kHz/16 bits, 'wide track' play
 *
 * DCC    DCC
 *     /A Analog transfer from media
 *
 * DVD    DVD
 *     /A Analog transfer from media
 *
 * TV     Television
 *   /PAL PAL
 *  /NTSC NTSC
 * /SECAM SECAM
 *
 * VID    Video
 *   /PAL PAL
 *  /NTSC NTSC
 * /SECAM SECAM
 *   /VHS VHS
 *  /SVHS S-VHS
 *  /BETA BETAMAX
 *
 * RAD    Radio
 *    /FM FM
 *    /AM AM
 *    /LW LW
 *    /MW MW
 *
 * TEL    Telephone
 *     /I ISDN
 *
 * MC     MC (normal cassette)
 *     /4 4.75 cm/s (normal speed for a two sided cassette)
 *     /9 9.5 cm/s
 *     /I Type I cassette (ferric/normal)
 *    /II Type II cassette (chrome)
 *   /III Type III cassette (ferric chrome)
 *    /IV Type IV cassette (metal)
 *
 * REE    Reel
 *     /9 9.5 cm/s
 *    /19 19 cm/s
 *    /38 38 cm/s
 *    /76 76 cm/s
 *     /I Type I cassette (ferric/normal)
 *    /II Type II cassette (chrome)
 *   /III Type III cassette (ferric chrome)
 *    /IV Type IV cassette (metal)
 * ```
 *
 * @public
 */
export type MediaType = string

/**
 * The 'Mood' frame is intended to reflect the mood of the audio with a few keywords, e.g. "Romantic" or "Sad".
 *
 * @public
 */
export type Mood = string

/**
 * The 'Original album/movie/show title' frame is intended for the title of the original recording (or source of sound), if for example the music in the file should be a cover of a previously released song.
 *
 * @public
 */
export type OriginalTitle = string

/**
 * The 'Original filename' frame contains the preferred filename for the file, since some media doesn't allow the desired length of the filename. The filename is case sensitive and includes its suffix.
 *
 * @public
 */
export type OriginalFilename = string

/**
 * The 'Original lyricist(s)/text writer(s)' frame is intended for the text writer(s) of the original recording, if for example the music in the file should be a cover of a previously released song. The text writers are seperated with the "/" character.
 *
 * @public
 */
export type OriginalTextwriter = string

/**
 * The 'Original artist(s)/performer(s)' frame is intended for the performer(s) of the original recording, if for example the music in the file should be a cover of a previously released song. The performers are seperated with the "/" character.
 *
 * @public
 */
export type OriginalArtist = string

/**
 * The 'Original release year' frame is intended for the year when the original recording, if for example the music in the file should be a cover of a previously released song, was released. The field is formatted as in the "Year" frame.
 *
 * @public
 */
export type OriginalYear = string

/**
 * The 'File owner/licensee' frame contains the name of the owner or licensee of the file and it's contents.
 *
 * @public
 */
export type FileOwner = string

/**
 * The 'Lead artist(s)/Lead performer(s)/Soloist(s)/Performing group' is used for the main artist(s). They are seperated with the "/" character.
 *
 * @public
 */
export type Artist = string

/**
 * The 'Band/Orchestra/Accompaniment' frame is used for additional information about the performers in the recording.
 *
 * @public
 */
export type PerformerInfo = string

/**
 * The 'Conductor' frame is used for the name of the conductor.
 *
 * @public
 */
export type Conductor = string

/**
 * The 'Interpreted, remixed, or otherwise modified by' frame contains more information about the people behind a remix and similar interpretations of another existing piece.
 *
 * @public
 */
export type RemixArtist = string

/**
 * The 'Part of a set' frame is a numeric string that describes which part of a set the audio came from. This frame is used if the source described in the "Album/Movie/Show title" frame is divided into several mediums, e.g. a double CD. The value may be extended with a "/" character and a numeric string containing the total number of parts in the set. E.g. "1/2".
 *
 * @public
 */
export type PartOfSet = string

/**
 * The 'Produced notice' frame, in which the string must begin with a year and a space character (making five characters), is intended for the production copyright holder of the original sound, not the audio file itself. The absence of this frame means only that the production copyright information is unavailable or has been removed, and must not be interpreted to mean that the audio is public domain. Every time this field is displayed the field must be preceded with "Produced " (P) " ", where (P) is one character showing a P in a circle.
 *
 * @public
*/
export type ProducedNotice = string

/**
 * The 'Publisher' frame simply contains the name of the label or publisher.
 *
 * @public
 */
export type Publisher = string

/**
 * The 'Track number/Position in set' frame is a numeric string containing the order number of the audio-file on its original recording. This may be extended with a "/" character and a numeric string containing the total numer of tracks/elements on the original recording. E.g. "4/9".
 *
 * @public
 */
export type TrackNumber = string

/**
 * The 'Recording dates' frame is a intended to be used as complement to the "Year", "Date" and "Time" frames. E.g. "4th-7th June, 12th June" in combination with the "Year" frame.
 *
 * @public
 */
export type RecordingDates = string

/**
 * The 'Internet radio station name' frame contains the name of the internet radio station from which the audio is streamed.
 *
 * @public
 */
export type InternetRadioName = string

/**
 * The 'Internet radio station owner' frame contains the name of the owner of the internet radio station from which the audio is streamed.
 *
 * @public
 */
export type InternetRadioOwner = string

/**
 * The 'Album sort order' frame defines a string which should be used instead of the album name (TALB) for sorting purposes. E.g. an album named "A Soundtrack" might preferably be sorted as "Soundtrack".
 *
 * @public
 */
export type AlbumSortOrder = string

/**
 * The 'Performer sort order' frame defines a string which should be used instead of the performer (TPE2) for sorting purposes.
 *
 * @public
 */
export type PerformerSortOrder = string

/**
 * The 'Title sort order' frame defines a string which should be used instead of the title (TIT2) for sorting purposes.
 *
 * @public
 */
export type TitleSortOrder = string

/**
 * The 'Size' frame contains the size of the audiofile in bytes, excluding the ID3v2 tag, represented as a numeric string.
 *
 * @public
 */
export type Size = string

/**
 * The 'ISRC' frame should contain the International Standard Recording Code (ISRC) (12 characters).
 *
 * @public
 */
export type ISRC = string

/**
 * The 'Software/Hardware and settings used for encoding' frame includes the used audio encoder and its settings when the file was encoded. Hardware refers to hardware encoders, not the computer on which a program was run.
 *
 * @public
 */
export type EncodingTechnology = string

/**
 * The 'Set subtitle' frame is intended for the subtitle of the part of a set this track belongs to.
 *
 * @public
 */
export type SetSubtitle = string

/**
 * The 'Year' frame is a numeric string with a year of the recording. This frames is always four characters long (until the year 10000).
 *
 * @public
 */
export type Year = string

/**
 * @public
 */
export type Comment = {
    /**
     * 3 letter ISO 639-2 language code, for example: eng
     * @see {@link https://id3.org/ISO%20639-2 | ISO 639-2}
     */
    language: string,
    shortText?: string,
    text: string,
}

/**
 * Unsychronised lyrics/text transcription
 *
 * @remarks
 * This frame contains the lyrics of the song or a text transcription of
   other vocal activities. The head includes an encoding descriptor and
   a content descriptor. The body consists of the actual text. The
   'Content descriptor' is a terminated string. If no descriptor is
   entered, 'Content descriptor' is $00 (00) only. Newline characters
   are allowed in the text. There may be more than one 'Unsynchronised
   lyrics/text transcription' frame in each tag, but only one with the
   same language and content descriptor.
 *
 * @public
 */
export type UnsynchronisedLyrics = {
    /**
     * 3 letter ISO 639-2 language code, for example: eng
     * @see {@link https://id3.org/ISO%20639-2 | ISO 639-2}
     */
    language: string,
    /**
     * Content descriptor
     */
    shortText?: string,
    /**
     * Lyrics/text
     */
    text: string
}

/**
 * The synchronised lyrics `SYLT` tag frame.
 *
 * @see {@link https://id3.org/d3v2.3.0 | 4.10. Synchronised lyrics/text}
 *
 * @public
 */
export type SynchronisedLyrics = {
    /**
     * 3 letter ISO 639-2 language code, for example: eng
     * @see {@link https://id3.org/ISO%20639-2 | ISO 639-2}
     * @public
     */
    language: string,
    /**
     * Absolute time unit:
     * {@link TagConstants.TimeStampFormat}
     */
    timeStampFormat: Values<TagConstants['TimeStampFormat']>,
    /**
     * The type of context in the text (i.e. lyrics, chord, etc.).
     *
     * {@link TagConstants.SynchronisedLyrics.ContentType}
     */
    contentType: number,
    /**
     * Content descriptor
     */
    shortText?: string,
    synchronisedText: {
        text: string,
        /**
         * A positive integer expressing an absolute time in unit according
         * to `timeStampFormat`.
         */
        timeStamp: number
    }[]
}[]

/**
 * @public
 */
export type UserDefinedText = {
    description: string,
    value: string
} | {
    description: string,
    value: string
}[]

/**
 * `APIC` (attached picture) tag frames
 *
 * Filename or image data.
 *
 * @public
 */
 export type Image = string | Buffer | {
    mime: string
    /**
     * See https://en.wikipedia.org/wiki/ID3#ID3v2_embedded_image_extension
     */
    type: {
        /**
         * {@link TagConstants.AttachedPicture.PictureType}
         */
        id: number,
        /**
         * @deprecated Provided as an information when a tag is read,
         * unused when a tag is written.
         */
        name?: string
    },
    description?: string,
    imageBuffer: Buffer,
}

/**
 * @public
 */
export type Popularimeter = {
    email: string,
    /**
     * 1-255
     */
    rating: number,
    counter: number,
}

/**
 * @public
 */
export type Private = {
    ownerIdentifier: string,
    data: Buffer
}[]

/**
 * This frame's purpose is to be able to identify the audio file in a
 * database that may contain more information relevant to the content.
 * Since standardisation of such a database is beyond this document,
 * all frames begin with a null-terminated string with a URL
 * containing an email address, or a link to a location where an email
 * address can be found, that belongs to the organisation responsible
 * for this specific database implementation. Questions regarding the
 * database should be sent to the indicated email address. The URL
 * should not be used for the actual database queries. The string
 * "http://www.id3.org/dummy/ufid.html" should be used for tests.
 * Software that isn't told otherwise may safely remove such frames.
 *
 * There may be more than one "UFID" frame in a tag, but only one with
 * the same `ownerIdentifier`.
 *
 * @public
 */
export type UniqueFileIdentifier = {
    /**
     * Must be non-empty.
     */
    ownerIdentifier: string,
    /**
     * Up to 64 bytes of binary data.
     * Providing more data will result in an undefined behaviour.
     */
    identifier: Buffer
}[]

/**
 * The purpose of this frame is to describe a single chapter within an audio file. There may be more than one frame of this type in a tag but each must have an Element ID that is unique with respect to any other "CHAP" frame or "CTOC" frame in the tag.
 *
 * @see {@link https://id3.org/id3v2-chapters-1.0#Chapter_frame | Chapter frame}
 *
 * @public
 */
export type Chapter<Tags> = {
    /**
     * Must be unique
     */
    elementID: string,
    endTimeMs: number,
    startTimeMs: number,
    startOffsetBytes?: number,
    endOffsetBytes?: number,
    tags?: Tags
}[]

/**
 * @see {@link https://id3.org/id3v2-chapters-1.0#Table_of_contents_frame | Table of contents frame}
 *
 * @public
 */
 export type TableOfContents<Tags> = {
    /**
     * Must be unique
     */
    elementID: string,
    isOrdered?: boolean,
    elements?: string[]
    tags?: Tags
}[]

/**
 * The 'Commercial information' frame is a URL pointing at a webpage with information such as where the album can be bought. There may be more than one "WCOM" frame in a tag, but not with the same content.
 *
 * @public
 */
 export type CommercialUrl = string[]

/**
 * The 'Copyright/Legal information' frame is a URL pointing at a webpage where the terms of use and ownership of the file is described.
 *
 * @public
 */
export type CopyrightUrl = string

/**
 * The 'Official audio file webpage' frame is a URL pointing at a file specific webpage.
 *
 * @public
 */
export type FileUrl = string

/**
 * The 'Official artist/performer webpage' frame is a URL pointing at the artists official webpage. There may be more than one "WOAR" frame in a tag if the audio contains more than one performer, but not with the same content.
 *
 * @public
 */
 export type ArtistUrl = string[]

/**
 * The 'Official audio source webpage' frame is a URL pointing at the official webpage for the source of the audio file, e.g. a movie.
 *
 * @public
 */
export type AudioSourceUrl = string

/**
 * The 'Official internet radio station homepage' contains a URL pointing at the homepage of the internet radio station.
 *
 * @public
 */
export type RadioStationUrl = string

/**
 * The 'Payment' frame is a URL pointing at a webpage that will handle the process of paying for this file.
 *
 * @public
 */
export type PaymentUrl = string

/**
 * The 'Publishers official webpage' frame is a URL pointing at the official wepage for the publisher.
 *
 * @public
 */
export type PublisherUrl = string

/**
 * The 'User-defined URL link' frame is intended for URL links concerning the audiofile in a similar way to the other "W"-frames. There may be more than one "WXXX" frame in each tag, but only one with the same description.
 *
 * @public
 */
 export type UserDefinedUrl = {
    description: string,
    url: string
}[]

/**
 * ETCO frame
 *
 * @see {@link https://id3.org/id3v2.3.0#Event_timing_codes | 4.6. Event timing codes}
 *
 * @public
 */
 export type EventTimingCodes = {
    /**
     * Absolute time unit:
     * {@link TagConstants.TimeStampFormat}
     */
    timeStampFormat: Values<TagConstants['TimeStampFormat']>,
    keyEvents: {
        /**
         * {@link TagConstants.EventTimingCodes.EventType}
         */
        type: number,
        /**
         * A positive integer expressing an absolute time in unit according
         * to `timeStampFormat`.
         */
        timeStamp: number
    }[]
}

/**
 * Commercial COMR frame
 *
 * @public
 */
export type CommercialFrame = {
    /**
     * Object containing price information.
     * Key is a three letter currency code according to ISO-4217 (e.g. EUR).
     * Value is a price string or number, e.g. 17.52
     */
    prices: {
        [currencyCode: string]: string | number
    },
    /**
     * Describes how long the price is valid
     */
    validUntil: {
        year: number,
        month: number,
        day: number
    },
    contactUrl?: string,
    /**
     * Describes how the audio is delivered when bought
     * {@link TagConstants.CommercialFrame.ReceivedAs}
     */
    receivedAs: number,
    /**
     * Name of the seller
     */
    nameOfSeller?: string,
    /**
     * Short description of the product
     */
    description?: string,
    /**
     * Optional logo of the seller.
     */
    sellerLogo?: {
        /**
         * Mime type of picture.
         * Only allowed values: image/jpeg, image/png, image/
         */
        mimeType?: string,
        /**
         * Filepath to a picture or Buffer containing the picture
         */
        picture: string | Buffer
    }
}[]
