export interface Options {
    /**
     * Only read the specified tag identifiers, defaults to all.
     */
    include?: string[],
    /**
     * Do not read the specified tag identifiers, defaults to none.
     */
    exclude?: string[],
    /**
     * Only return the `raw` object, defaults to false.
     */
    onlyRaw?: boolean,
    /**
     * Do not generate the `raw` object, defaults to false.
     */
    noRaw?: boolean
 }
