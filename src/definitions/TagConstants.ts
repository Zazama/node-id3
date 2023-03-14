

/**
 * @public
 */
export type TagConstants = typeof TagConstants

/**
 * Constants documented in the id3 specifications used in tag frames.
 *
 * @see {@link https://id3.org/} for more information.
 *
 * @public
 */
export const TagConstants = {
    /**
     * Absolute time unit used by:
     * - Event timing codes (`ETCO` tag frame)
     * - Synchronised tempo codes (`SYTC` tag frame)
     * - Synchronised lyrics/text (`SYLT` tag frame)
     * - Position synchronisation frame (`POSS` tag frame))
     *
     * @label TimeStampFormat
     */
    TimeStampFormat: {
        MPEG_FRAMES: 1,
        MILLISECONDS: 2
    },
    /**
     * `ETCO` tag frame
     */
    EventTimingCodes: {
        EventType: {
            /**
             * Padding has no meaning
             */
            PADDING: 0x00,
            END_OF_INITIAL_SILENCE: 0x01,
            INTRO_START: 0x02,
            MAINPART_START: 0x03,
            OUTRO_START: 0x04,
            OUTRO_END: 0x05,
            VERSE_START: 0x06,
            REFRAIN_START: 0x07,
            INTERLUDE_START: 0x08,
            THEME_START: 0x09,
            VARIATION_START: 0x0A,
            KEY_CHANGE: 0x0B,
            TIME_CHANGE: 0x0C,
            /**
             * (Snap, Crackle & Pop)
             */
            MOMENTARY_UNWANTED_NOISE: 0x0D,
            SUSTAINED_NOISE: 0x0E,
            SUSTAINED_NOISE_END: 0x0F,
            INTRO_END: 0x10,
            MAINPART_END: 0x11,
            VERSE_END: 0x12,
            REFRAIN_END: 0x013,
            THEME_END: 0x14,
            /**
             * $15-$DF reserved for future use
             */
            RESERVED_1: 0x15,
            /**
             * $E0-$EF not predefined sync 0-F
             */
            NOT_PREDEFINED_SYNC: 0xE0,
            /**
             * $F0-$FC reserved for future use
             */
            RESERVED_2: 0xF0,
            /**
             * Start of silence
             */
            AUDIO_END: 0xFD,
            AUDIO_FILE_ENDS: 0xFE,
            /**
             * one more byte of events follows (all the following bytes with
             * the value $FF have the same function)
             */
            ONE_MORE_BYTE_FOLLOWS: 0xFF
        }
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
    },
    /**
     * `COMR` tag frame
     */
    CommercialFrame: {
        ReceivedAs: {
            OTHER: 0x00,
            STANDARD_CD_ALBUM_WITH_OTHER_SONGS: 0x01,
            COMPRESSED_AUDIO_ON_CD: 0x02,
            FILE_OVER_THE_INTERNET: 0x03,
            STREAM_OVER_THE_INTERNET: 0x04,
            AS_NOTE_SHEETS: 0x05,
            AS_NOTE_SHEETS_IN_A_BOOK_WITH_OTHER_SHEETS: 0x06,
            MUSIC_ON_OTHER_MEDIA: 0x07,
            NON_MUSICAL_MERCHANDISE: 0x08
        }
    }
} as const
