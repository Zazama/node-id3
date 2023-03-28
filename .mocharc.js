'use strict'

module.exports = {
    require: [
        "source-map-support/register",
        "ts-node/register",
    ],
    recursive: true,
    spec: "./test/**/*.ts"
}
