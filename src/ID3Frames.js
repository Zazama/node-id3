const fs = require('fs')
const ID3FrameBuilder = require("./ID3FrameBuilder")
const ID3FrameReader = require("./ID3FrameReader")
const ID3Definitions = require("./ID3Definitions")

module.exports.GENERIC_TEXT = {
    create: (specName, data) => {
        if (!specName || !data) {
            return null
        }

        return new ID3FrameBuilder(specName)
            .appendStaticNumber(0x01, 0x01)
            .appendStaticValue(data, null, 0x01)
            .getBuffer()
    },
    read: (buffer) => {
        const reader = new ID3FrameReader(buffer, 0)

        return reader.consumeStaticValue('string')
    }
}

module.exports.GENERIC_URL = {
    create: (specName, data) => {
        if (!specName || !data) {
            return null
        }

        return new ID3FrameBuilder(specName)
            .appendStaticValue(data)
            .getBuffer()
    },
    read: (buffer) => {
        const reader = new ID3FrameReader(buffer)

        return reader.consumeStaticValue('string')
    }
}

module.exports.APIC = {
    create: (data) => {
        try {
            if (data instanceof Buffer) {
                data = {
                    imageBuffer: Buffer.from(data)
                }
            } else if (typeof data === 'string' || data instanceof String) {
                data = {
                    imageBuffer: fs.readFileSync(data)
                }
            } else if (!data.imageBuffer) {
                return Buffer.alloc(0)
            }

            let mime_type = data.mime

            if (!data.mime) {
                if (data.imageBuffer.length > 3 && data.imageBuffer.compare(Buffer.from([0xff, 0xd8, 0xff]), 0, 3, 0, 3) === 0) {
                    mime_type = "image/jpeg"
                } else if (data.imageBuffer.length > 8 && data.imageBuffer.compare(Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]), 0, 8, 0, 8) === 0) {
                    mime_type = "image/png"
                } else {
                    mime_type = ""
                }
            }

            /*
             * Fix a bug in iTunes where the artwork is not recognized when the description is empty using UTF-16.
             * Instead, if the description is empty, use encoding 0x00 (ISO-8859-1).
             */
            const { description = '' } = data;
            const encoding = description ? 0x01 : 0x00
            return new ID3FrameBuilder("APIC")
                .appendStaticNumber(encoding, 1)
                .appendNullTerminatedValue(mime_type)
                .appendStaticNumber(0x03, 1)
                .appendNullTerminatedValue(description, encoding)
                .appendStaticValue(data.imageBuffer)
                .getBuffer()
        } catch (e) {
            return e
        }
    },
    read: (buffer, version) => {
        const reader = new ID3FrameReader(buffer, 0)
        let mime
        if (version === 2) {
            mime = reader.consumeStaticValue('string', 3, 0x00)
        } else {
            mime = reader.consumeNullTerminatedValue('string', 0x00)
        }

        const typeId = reader.consumeStaticValue('number', 1)
        const description = reader.consumeNullTerminatedValue('string')
        const imageBuffer = reader.consumeStaticValue()

        return {
            mime: mime,
            type: {
                id: typeId,
                name: ID3Definitions.APIC_TYPES[typeId]
            },
            description: description,
            imageBuffer: imageBuffer
        }
    }
}

module.exports.COMM = {
    create: (data) => {
        data = data || {}
        if (!data.text) {
            return null
        }

        return new ID3FrameBuilder("COMM")
            .appendStaticNumber(0x01, 1)
            .appendStaticValue(data.language)
            .appendNullTerminatedValue(data.shortText, 0x01)
            .appendStaticValue(data.text, null, 0x01)
            .getBuffer()
    },
    read: (buffer) => {
        const reader = new ID3FrameReader(buffer, 0)

        return {
            language: reader.consumeStaticValue('string', 3, 0x00),
            shortText: reader.consumeNullTerminatedValue('string'),
            text: reader.consumeStaticValue('string', null)
        }
    }
}

module.exports.USLT = {
    create: (data) => {
        data = data || {}
        if (typeof data === 'string' || data instanceof String) {
            data = {
                text: data
            }
        }
        if (!data.text) {
            return null
        }

        return new ID3FrameBuilder("USLT")
            .appendStaticNumber(0x01, 1)
            .appendStaticValue(data.language)
            .appendNullTerminatedValue(data.shortText, 0x01)
            .appendStaticValue(data.text, null, 0x01)
            .getBuffer()
    },
    read: (buffer) => {
        const reader = new ID3FrameReader(buffer, 0)

        return {
            language: reader.consumeStaticValue('string', 3, 0x00),
            shortText: reader.consumeNullTerminatedValue('string'),
            text: reader.consumeStaticValue('string', null)
        }
    }
}

module.exports.TXXX = {
    create: (data) => {
        if (!(data instanceof Array)) {
            data = [data]
        }

        return Buffer.concat(data.map(udt => new ID3FrameBuilder("TXXX")
            .appendStaticNumber(0x01, 1)
            .appendNullTerminatedValue(udt.description, 0x01)
            .appendStaticValue(udt.value, null, 0x01)
            .getBuffer()))
    },
    read: (buffer) => {
        const reader = new ID3FrameReader(buffer, 0)

        return {
            description: reader.consumeNullTerminatedValue('string'),
            value: reader.consumeStaticValue('string')
        }
    }
}

module.exports.POPM = {
    create: (data) => {
        const email = data.email
        let rating = Math.trunc(data.rating)
        let counter = Math.trunc(data.counter)
        if (!email) {
            return null
        }
        if (isNaN(rating) || rating < 0 || rating > 255) {
            rating = 0
        }
        if (isNaN(counter) || counter < 0) {
            counter = 0
        }

        return new ID3FrameBuilder("POPM")
            .appendNullTerminatedValue(email)
            .appendStaticNumber(rating, 1)
            .appendStaticNumber(counter, 4)
            .getBuffer()
    },
    read: (buffer) => {
        const reader = new ID3FrameReader(buffer)
        return {
            email: reader.consumeNullTerminatedValue('string'),
            rating: reader.consumeStaticValue('number', 1),
            counter: reader.consumeStaticValue('number')
        }
    }
}

module.exports.PRIV = {
    create: (data) => {
        if (!(data instanceof Array)) {
            data = [data]
        }

        return Buffer.concat(data.map(priv => new ID3FrameBuilder("PRIV")
            .appendNullTerminatedValue(priv.ownerIdentifier)
            .appendStaticValue(priv.data instanceof Buffer ? priv.data : Buffer.from(priv.data, "utf8"))
            .getBuffer()))
    },
    read: (buffer) => {
        const reader = new ID3FrameReader(buffer)
        return {
            ownerIdentifier: reader.consumeNullTerminatedValue('string'),
            data: reader.consumeStaticValue()
        }
    }
}

module.exports.UFID = {
    create: (data) => {
        if (!(data instanceof Array)) {
            data = [data]
        }

        return Buffer.concat(data.map(ufid => new ID3FrameBuilder("UFID")
            .appendNullTerminatedValue(ufid.ownerIdentifier)
            .appendStaticValue(ufid.identifier instanceof Buffer ? ufid.identifier : Buffer.from(ufid.identifier, "utf8"))
            .getBuffer()))
    },
    read: (buffer) => {
        const reader = new ID3FrameReader(buffer)
        return {
            ownerIdentifier: reader.consumeNullTerminatedValue('string'),
            identifier: reader.consumeStaticValue('string')
        }
    }
}

module.exports.CHAP = {
    create: (data, version, nodeId3) => {
        if (!(data instanceof Array)) {
            data = [data]
        }

        return Buffer.concat(data.map(chap => {
            if (!chap || !chap.elementID || typeof chap.startTimeMs === "undefined" || !chap.endTimeMs) {
                return null
            }
            return new ID3FrameBuilder("CHAP")
                .appendNullTerminatedValue(chap.elementID)
                .appendStaticNumber(chap.startTimeMs, 4)
                .appendStaticNumber(chap.endTimeMs, 4)
                .appendStaticNumber(chap.startOffsetBytes ? chap.startOffsetBytes : 0xFFFFFFFF, 4)
                .appendStaticNumber(chap.endOffsetBytes ? chap.endOffsetBytes : 0xFFFFFFFF, 4)
                .appendStaticValue(nodeId3.create(chap.tags).slice(10))
                .getBuffer()
        }).filter(chap => chap instanceof Buffer))
    },
    read: (buffer, version, nodeId3) => {
        const reader = new ID3FrameReader(buffer)
        let chap = {
            elementID: reader.consumeNullTerminatedValue('string'),
            startTimeMs: reader.consumeStaticValue('number', 4),
            endTimeMs: reader.consumeStaticValue('number', 4),
            startOffsetBytes: reader.consumeStaticValue('number', 4),
            endOffsetBytes: reader.consumeStaticValue('number', 4),
            tags: nodeId3.getTagsFromFrames(nodeId3.getFramesFromID3Body(reader.consumeStaticValue(), 3, 4, 10), 3)
        }
        if (chap.startOffsetBytes === 0xFFFFFFFF) delete chap.startOffsetBytes
        if (chap.endOffsetBytes === 0xFFFFFFFF) delete chap.endOffsetBytes
        return chap
    }
}

module.exports.CTOC = {
    create: (data, version, nodeId3) => {
        if (!(data instanceof Array)) {
            data = [data]
        }

        return Buffer.concat(data.map((toc, index) => {
            if (!toc || !toc.elementID) {
                return null
            }
            if (!(toc.elements instanceof Array)) {
                toc.elements = []
            }

            let ctocFlags = Buffer.alloc(1, 0)
            if (index === 0) {
                ctocFlags[0] += 2
            }
            if (toc.isOrdered) {
                ctocFlags[0] += 1
            }

            const builder = new ID3FrameBuilder("CTOC")
                .appendNullTerminatedValue(toc.elementID)
                .appendStaticValue(ctocFlags, 1)
                .appendStaticNumber(toc.elements.length, 1)
            toc.elements.forEach((el) => {
                builder.appendNullTerminatedValue(el)
            })
            if (toc.tags) {
                builder.appendStaticValue(nodeId3.create(toc.tags).slice(10))
            }
            return builder.getBuffer()
        }).filter((toc) => toc instanceof Buffer))
    },
    read: (buffer, version, nodeId3) => {
        const reader = new ID3FrameReader(buffer)
        const elementID = reader.consumeNullTerminatedValue('string')
        const flags = reader.consumeStaticValue('number', 1)
        const entries = reader.consumeStaticValue('number', 1)
        const elements = []
        for (let i = 0; i < entries; i++) {
            elements.push(reader.consumeNullTerminatedValue('string'))
        }
        const tags = nodeId3.getTagsFromFrames(nodeId3.getFramesFromID3Body(reader.consumeStaticValue(), 3, 4, 10), 3)

        return {
            elementID,
            isOrdered: !!(flags & 0x01 === 0x01),
            elements,
            tags
        }
    }
}

module.exports.WXXX = {
    create: (data) => {
        if (!(data instanceof Array)) {
            data = [data]
        }

        return Buffer.concat(data.map((udu) => {
            return new ID3FrameBuilder("WXXX")
                .appendStaticNumber(0x01, 1)
                .appendNullTerminatedValue(udu.description, 0x01)
                .appendStaticValue(udu.url, null)
                .getBuffer()
        }))
    },
    read: (buffer) => {
        const reader = new ID3FrameReader(buffer, 0)

        return {
            description: reader.consumeNullTerminatedValue('string'),
            url: reader.consumeStaticValue('string', null, 0x00)
        }
    }
}
