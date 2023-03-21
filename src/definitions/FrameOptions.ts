export type FrameOptions = {
    multiple: boolean
    updateCompareKey?: string
}

const FRAME_OPTIONS_V2 = {
    "PIC": {
        multiple: false /* change in 1.0 */
    },
    "WAR": {
        multiple: true
    },
    "WCM": {
        multiple: true
    }
 } as const satisfies Record<string, FrameOptions>


const FRAME_OPTIONS_V3 = {
    "APIC": {
        multiple: false /* change in 1.0 */
    },
    "CHAP": {
        multiple: true
    },
    "COMM": {
        multiple: false /* change in 1.0 */
    },
    "COMR": {
        multiple: true
    },
    "CTOC": {
        multiple: true
    },
    "ETCO": {
        multiple: false
    },
    "POPM": {
        multiple: false /* change in 1.0 */
    },
    "PRIV": {
        multiple: true
    },
    "SYLT": {
        multiple: true
    },
    "TXXX": {
        multiple: true,
        updateCompareKey: "description"
    },
    "T___": {
        // This is "correct", but in v4, the text frame's value can be split by using 0x00.
        // https://github.com/Zazama/node-id3/issues/111
        multiple: false
    },
    "UFID": {
        multiple: true
    },
    "USLT": {
        multiple: false /* change in 1.0 */
    },
    "WCOM": {
        multiple: true
    },
    "WOAR": {
        multiple: true
    },
    "WXXX": {
        multiple: true,
        updateCompareKey: "description"
    }
 } as const satisfies Record<string, FrameOptions>

 export const FRAME_OPTIONS = {
    ...FRAME_OPTIONS_V2,
    ...FRAME_OPTIONS_V3
 } as const
