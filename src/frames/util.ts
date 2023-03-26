
export function validateLanguage(language: string) {
    if (language.length !== 3) {
        throw new TypeError(
            "Language string length must be 3, see ISO 639-2 codes"
        )
    }
    return language
}
