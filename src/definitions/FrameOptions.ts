export type FrameOptions = {
    multiple: boolean
    updateCompareKey?: string
}

const satisfiesFrameOptions =
    <T extends Record<string, FrameOptions>>(data: T) => data

export const FRAME_OPTIONS = satisfiesFrameOptions({
    "PIC": {
        multiple: false /* change in 1.0 */
    },
    "WCM": {
        multiple: true
    },
    "WAR": {
        multiple: true
    },
    "T___": {
        // This is "correct", but in v4, the text frame's value can be split by using 0x00.
        // https://github.com/Zazama/node-id3/issues/111
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
        multiple: false /* change in 1.0 */
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
    },
    "UFID": {
        multiple: true
    }
 } as const)
