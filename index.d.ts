declare module "node-id3" {
   namespace NodeID3 {
      export interface Tags {
         /**
          * The 'Album/Movie/Show title' frame is intended for the title of the recording(/source of sound) which the audio in the file is taken from. 
          */
         album?: string,
         /**
          * The 'BPM' frame contains the number of beats per minute in the mainpart of the audio. The BPM is an integer and represented as a numerical string. 
          */
         bpm?: number,
         /**
          *  The 'Composer(s)' frame is intended for the name of the composer(s). They are seperated with the "/" character. 
          */
         composer?: string,
         /**
          * The 'Content type', which previously was stored as a one byte numeric value only, is now a numeric string. You may use one or several of the types as ID3v1.1 did or, since the category list would be impossible to maintain with accurate and up to date categories, define your own.
          * 
          * References to the ID3v1 genres can be made by, as first byte, enter "(" followed by a number from the genres list (appendix A) and ended with a ")" character. This is optionally followed by a refinement, e.g. "(21)" or "(4)Eurodisco". Several references can be made in the same frame, e.g. "(51)(39)". If the refinement should begin with a "(" character it should be replaced with "((", e.g. "((I can figure out any genre)" or "(55)((I think...)"
          */
         genre?: string,
         /**
          * The 'Copyright message' frame, which must begin with a year and a space character (making five characters), is intended for the copyright holder of the original sound, not the audio file itself. The absence of this frame means only that the copyright information is unavailable or has been removed, and must not be interpreted to mean that the sound is public domain. Every time this field is displayed the field must be preceded with "Copyright © ". 
          */
         copyright?: string,
         /**
          * The 'Date' frame is a numeric string in the DDMM format containing the date for the recording. This field is always four characters long. 
          */
         date?: string,
         /**
          * The 'Playlist delay' defines the numbers of milliseconds of silence between every song in a playlist. The player should use the "ETC" frame, if present, to skip initial silence and silence at the end of the audio to match the 'Playlist delay' time. The time is represented as a numeric string. 
          */
         playlistDelay?: number,
         /**
          * The 'Encoded by' frame contains the name of the person or organisation that encoded the audio file. This field may contain a copyright message, if the audio file also is copyrighted by the encoder. 
          */
         encodedBy?: string,
         /**
          * The 'Lyricist(s)/Text writer(s)' frame is intended for the writer(s) of the text or lyrics in the recording. They are seperated with the "/" character. 
          */
         textWriter?: string,
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
          */
         fileType?: string,
         /**
          * The 'Time' frame is a numeric string in the HHMM format containing the time for the recording. This field is always four characters long. 
          */
         time?: string,
         /**
          * The 'Content group description' frame is used if the sound belongs to a larger category of sounds/music. For example, classical music is often sorted in different musical sections (e.g. "Piano Concerto", "Weather - Hurricane"). 
          */
         contentGroup?: string,
         /**
          * The 'Title/Songname/Content description' frame is the actual name of the piece (e.g. "Adagio", "Hurricane Donna"). 
          */
         title?: string,
         /**
          * The 'Subtitle/Description refinement' frame is used for information directly related to the contents title (e.g. "Op. 16" or "Performed live at Wembley"). 
          */
         subtitle?: string,
         /**
          * The 'Initial key' frame contains the musical key in which the sound starts. It is represented as a string with a maximum length of three characters. The ground keys are represented with "A","B","C","D","E", "F" and "G" and halfkeys represented with "b" and "#". Minor is represented as "m". Example "Cbm". Off key is represented with an "o" only. 
          */
         initialKey?: string,
         /**
          * The 'Language(s)' frame should contain the languages of the text or lyrics spoken or sung in the audio. The language is represented with three characters according to ISO-639-2. If more than one language is used in the text their language codes should follow according to their usage. 
          */
         language?: string,
         /**
          * The 'Length' frame contains the length of the audiofile in milliseconds, represented as a numeric string. 
          */
         length?: number,
         /**
          * The 'Media type' frame describes from which media the sound originated. This may be a text string or a reference to the predefined media types found in the list below. References are made within "(" and ")" and are optionally followed by a text refinement, e.g. "(MC) with four channels". If a text refinement should begin with a "(" character it should be replaced with "((". Predefined refinements is appended after the media type, e.g. "(CD/A)" or "(VID/PAL/VHS)".
          *
          *DIG     Other digital media
          *    /A  Analog transfer from media
          *
          *ANA     Other analog media
          *   /WAC Wax cylinder
          *   /8CA 8-track tape cassette
          *
          *CD      CD
          *     /A Analog transfer from media
          *    /DD DDD
          *    /AD ADD
          *    /AA AAD
          *
          *LD      Laserdisc
          *     /A Analog transfer from media
          *
          *TT      Turntable records
          *    /33 33.33 rpm
          *    /45 45 rpm
          *    /71 71.29 rpm
          *    /76 76.59 rpm
          *    /78 78.26 rpm
          *    /80 80 rpm
          *
          *MD      MiniDisc
          *     /A Analog transfer from media
          *
          *DAT     DAT
          *     /A Analog transfer from media
          *     /1 standard, 48 kHz/16 bits, linear
          *     /2 mode 2, 32 kHz/16 bits, linear
          *     /3 mode 3, 32 kHz/12 bits, nonlinear, low speed
          *     /4 mode 4, 32 kHz/12 bits, 4 channels
          *     /5 mode 5, 44.1 kHz/16 bits, linear
          *     /6 mode 6, 44.1 kHz/16 bits, 'wide track' play
          *
          *DCC     DCC
          *     /A Analog transfer from media
          *
          *DVD     DVD
          *     /A Analog transfer from media
          *
          *TV      Television
          *   /PAL PAL
          *  /NTSC NTSC
          * /SECAM SECAM
          *
          *VID     Video
          *   /PAL PAL
          *  /NTSC NTSC
          * /SECAM SECAM
          *   /VHS VHS
          *  /SVHS S-VHS
          *  /BETA BETAMAX
          *
          *RAD     Radio
          *    /FM FM
          *    /AM AM
          *    /LW LW
          *    /MW MW
          *
          *TEL     Telephone
          *     /I ISDN
          *
          *MC      MC (normal cassette)
          *     /4 4.75 cm/s (normal speed for a two sided cassette)
          *     /9 9.5 cm/s
          *     /I Type I cassette (ferric/normal)
          *    /II Type II cassette (chrome)
          *   /III Type III cassette (ferric chrome)
          *    /IV Type IV cassette (metal)
          *
          *REE     Reel
          *     /9 9.5 cm/s
          *    /19 19 cm/s
          *    /38 38 cm/s
          *    /76 76 cm/s
          *     /I Type I cassette (ferric/normal)
          *    /II Type II cassette (chrome)
          *   /III Type III cassette (ferric chrome)
          *    /IV Type IV cassette (metal)
          */
         mediaType?: string,
         /**
          * The 'Original album/movie/show title' frame is intended for the title of the original recording (or source of sound), if for example the music in the file should be a cover of a previously released song. 
          */
         originalTitle?: string,
         /**
          * The 'Original filename' frame contains the preferred filename for the file, since some media doesn't allow the desired length of the filename. The filename is case sensitive and includes its suffix. 
          */
         originalFilename?: string,
         /**
          * The 'Original lyricist(s)/text writer(s)' frame is intended for the text writer(s) of the original recording, if for example the music in the file should be a cover of a previously released song. The text writers are seperated with the "/" character. 
          */
         originalTextwriter?: string,
         /**
          * The 'Original artist(s)/performer(s)' frame is intended for the performer(s) of the original recording, if for example the music in the file should be a cover of a previously released song. The performers are seperated with the "/" character. 
          */
         originalArtist?: string,
         /**
          * The 'Original release year' frame is intended for the year when the original recording, if for example the music in the file should be a cover of a previously released song, was released. The field is formatted as in the "Year" frame. 
          */
         originalYear?: number,
         /**
          * The 'File owner/licensee' frame contains the name of the owner or licensee of the file and it's contents. 
          */
         fileOwner?: string,
         /**
          * The 'Lead artist(s)/Lead performer(s)/Soloist(s)/Performing group' is used for the main artist(s). They are seperated with the "/" character. 
          */
         artist?: string,
         /**
          * The 'Band/Orchestra/Accompaniment' frame is used for additional information about the performers in the recording. 
          */
         performerInfo?: string,
         /**
          * The 'Conductor' frame is used for the name of the conductor. 
          */
         conductor?: string,
         /**
          * The 'Interpreted, remixed, or otherwise modified by' frame contains more information about the people behind a remix and similar interpretations of another existing piece. 
          */
         remixArtist?: string,
         /**
          * The 'Part of a set' frame is a numeric string that describes which part of a set the audio came from. This frame is used if the source described in the "Album/Movie/Show title" frame is divided into several mediums, e.g. a double CD. The value may be extended with a "/" character and a numeric string containing the total number of parts in the set. E.g. "1/2". 
          */
         partOfSet?: string,
         /**
          * The 'Publisher' frame simply contains the name of the label or publisher. 
          */
         publisher?: string,
         /**
          * The 'Track number/Position in set' frame is a numeric string containing the order number of the audio-file on its original recording. This may be extended with a "/" character and a numeric string containing the total numer of tracks/elements on the original recording. E.g. "4/9". 
          */
         trackNumber?: string,
         /**
          * The 'Recording dates' frame is a intended to be used as complement to the "Year", "Date" and "Time" frames. E.g. "4th-7th June, 12th June" in combination with the "Year" frame. 
          */
         recordingDates?: string,
         /**
          * The 'Internet radio station name' frame contains the name of the internet radio station from which the audio is streamed. 
          */
         internetRadioName?: string,
         /**
          * The 'Internet radio station owner' frame contains the name of the owner of the internet radio station from which the audio is streamed. 
          */
         internetRadioOwner?: string,
         /**
          * The 'Size' frame contains the size of the audiofile in bytes, excluding the ID3v2 tag, represented as a numeric string. 
          */
         size?: number,
         /**
          * The 'ISRC' frame should contain the International Standard Recording Code (ISRC) (12 characters). 
          */
         ISRC?: string,
         /**
          * The 'Software/Hardware and settings used for encoding' frame includes the used audio encoder and its settings when the file was encoded. Hardware refers to hardware encoders, not the computer on which a program was run. 
          */
         encodingTechnology?: string,
         /**
          * The 'Year' frame is a numeric string with a year of the recording. This frames is always four characters long (until the year 10000). 
          */
         year?: number,
         comment?: {
            language: string,
            text: string,
         },
         unsynchronisedLyrics?: {
            language: string,
            text: string
         }
         userDefinedText?: [{
            description: string,
            value: string
         }]
         image?: {
            mime: string
            /**
             * See https://en.wikipedia.org/wiki/ID3#ID3v2_embedded_image_extension
             */
            type: {
               id: number,
               name: string
            },
            description: string,
            imageBuffer: Buffer,
         },
         popularimeter?: {
            email: string,
            /**
             * 1-255
             */
            rating: number,
            counter: number,
         },
         private?: [{
            ownerIdentifier: string,
            data: string
         }],
         chapter?: Array<{
            elementID: string;
            endTimeMs: number;
            startTimeMs: number;
            tags?: {
               image?: Tags["image"];
               title?: string;
            };
         }>;
      }
      export function write(tags: Tags, filebuffer: Buffer): Buffer
      export function write(tags: Tags, filebuffer: Buffer, fun: (err: null, buffer: Buffer) => void): void
      export function write(tags: Tags, filepath: string): true | Error
      export function write(tags: Tags, filepath: string, fn: (err: NodeJS.ErrnoException | Error | null) => void): void
      export function create(tags: Tags): Buffer
      export function create(tags: Tags, fn: (buffer: Buffer) => void): void
      export function read(filebuffer: string | Buffer): Tags
      export function read(filebuffer: string | Buffer, fn: (err: NodeJS.ErrnoException | null, tags: Tags | null) => void): void
      export function update(tags: Tags, filebuffer: Buffer): Buffer
      export function update(tags: Tags, filepath: string): true | Error
      export function update(tags: Tags, filepath: string, fn: (err: NodeJS.ErrnoException | Error | null) => void): void
      export function update(tags: Tags, filebuffer: Buffer, fn: (err: NodeJS.ErrnoException | null, buffer?: Buffer) => void): void
   }
   export = NodeID3
}
