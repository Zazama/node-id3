
/**
 * Language codes are
 * [ISO 639-2](https://en.wikipedia.org/wiki/List_of_ISO_639-2_codes)
 * and must be a 3 character string.
 *
 * This function could also be potentially be used to validate that the given
 * code is a known code.
 *
 * @param languageCode The language code to be validated.
 * @returns Returns the given language code if valid otherwise throws.
 */
export function validateLanguageCode(languageCode: string) {
    if (languageCode.length !== 3) {
        throw new RangeError(
            "Language string length must be 3, see ISO 639-2 codes"
        )
    }
    return languageCode
}

/**
 * Currency codes are
 * [ISO-4217](https://en.wikipedia.org/wiki/ISO_4217)
 *
 * @param currencyCode The currency code to be validated.
 * @returns Returns the given currency code if valid otherwise throws.
 */
export function validateCurrencyCode(currencyCode: string) {
    if (currencyCode.length !== 3) {
        throw new RangeError(
            "Currency string length must be 3, see "
        )
    }
    return currencyCode
}
