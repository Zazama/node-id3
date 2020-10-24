const fs = require('fs')
const ID3FrameBuilder = require("./ID3FrameBuilder")
const ID3FrameReader = require("./ID3FrameReader")
const ID3Definitions = require("./ID3Definitions")

module.exports.GENERIC_TEXT = {
    create: (specName, data, version) => {
        if(!specName || !data) {
            return null
        }

        return new ID3FrameBuilder(specName)
            .appendStaticNumber(0x01, 0x01)
            .appendStaticValue(data, null, 0x01)
            .getBuffer()
    },
    read: (buffer, version) => {
        const reader = new ID3FrameReader(buffer, 0)

        return reader.consumeStaticValue('string')
    }
}

module.exports.GENERIC_URL = {
    create: (specName, data, version) => {
        if(!specName || !data) {
            return null
        }

        return new ID3FrameBuilder(specName)
            .appendStaticValue(data)
            .getBuffer()
    },
    read: (buffer, version) => {
        const reader = new ID3FrameReader(buffer)

        return reader.consumeStaticValue('string')
    }
}

module.exports.APIC = {
    create: (data, version) => {
        try {
            if (data instanceof Buffer) {
                data = {
                    imageBuffer: Buffer.from(data)
                }
            } else if (typeof data === 'string' || data instanceof String) {
                data = {
                    imageBuffer: Buffer.from(fs.readFileSync(data, 'binary'), 'binary')
                }
            } else if (!data.imageBuffer) {
                return Buffer.alloc(0)
            }

            let mime_type = data.mime

            if(!data.mime) {
                if (data.imageBuffer[0] === 0xff && data.imageBuffer[1] === 0xd8 && data.imageBuffer[2] === 0xff) {
                    mime_type = "image/jpeg"
                } else {
                    mime_type = "image/png"
                }
            }

            return new ID3FrameBuilder("APIC")
                .appendStaticNumber(0x01, 1)
                .appendNullTerminatedValue(mime_type)
                .appendStaticNumber(0x03, 1)
                .appendNullTerminatedValue(data.description, 0x01)
                .appendStaticValue(data.imageBuffer)
                .getBuffer()
        } catch(e) {
            return e
        }
    },
    read: (buffer, version) => {
        const reader = new ID3FrameReader(buffer, 0)
        let mime
        if(version === 2) {
            mime = reader.consumeStaticValue('string', 3, 0x00)
        } else {
            mime = reader.consumeNullTerminatedValue('string', 0x00)
        }
        if(mime === "image/jpeg") {
            mime = "jpeg"
        } else if(mime === "image/png") {
            mime = "png"
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
    create: (data, version) => {
        data = data || {}
        if(!data.text) {
            return null
        }

        return new ID3FrameBuilder("COMM")
            .appendStaticNumber(0x01, 1)
            .appendStaticValue(data.language)
            .appendNullTerminatedValue(data.shortText, 0x01)
            .appendStaticValue(data.text, null, 0x01)
            .getBuffer()
    },
    read: (buffer, version) => {
        const reader = new ID3FrameReader(buffer, 0)

        return {
            language: reader.consumeStaticValue('string', 3, 0x00),
            shortText: reader.consumeNullTerminatedValue('string'),
            text: reader.consumeStaticValue('string', null)
        }
    }
}

module.exports.USLT = {
    create: (data, version) => {
        data = data || {}
        if(typeof data === 'string' || data instanceof String) {
            data = {
                text: data
            }
        }
        if(!data.text) {
            return null
        }

        return new ID3FrameBuilder("USLT")
            .appendStaticNumber(0x01, 1)
            .appendStaticValue(data.language)
            .appendNullTerminatedValue(data.shortText, 0x01)
            .appendStaticValue(data.text, null, 0x01)
            .getBuffer()
    },
    read: (buffer, version) => {
        const reader = new ID3FrameReader(buffer, 0)

        return {
            language: reader.consumeStaticValue('string', 3, 0x00),
            shortText: reader.consumeNullTerminatedValue('string'),
            text: reader.consumeStaticValue('string', null)
        }
    }
}

module.exports.TXXX = {
    create: (data, version) => {
        if(!(data instanceof Array)) {
            data = [data]
        }

        return Buffer.concat(data.map(udt => new ID3FrameBuilder("TXXX")
            .appendStaticNumber(0x01, 1)
            .appendNullTerminatedValue(udt.description, 0x01)
            .appendStaticValue(udt.value, null, 0x01)
            .getBuffer()))
    },
    read: (buffer, version) => {
        const reader = new ID3FrameReader(buffer, 0)

        return {
            description: reader.consumeNullTerminatedValue('string'),
            value: reader.consumeStaticValue('string')
        }
    }
}

module.exports.POPM = {
    create: (data, version) => {
        const email = data.email
        let rating = Math.trunc(data.rating)
        let counter = Math.trunc(data.counter)
        if(!email) {
            return null
        }
        if(isNaN(rating) || rating < 0 || rating > 255) {
            rating = 0
        }
        if(isNaN(counter) || counter < 0) {
            counter = 0
        }

        return new ID3FrameBuilder("POPM")
            .appendNullTerminatedValue(email)
            .appendStaticNumber(rating, 1)
            .appendStaticNumber(counter, 4)
            .getBuffer()
    },
    read: (buffer, version) => {
        const reader = new ID3FrameReader(buffer)
        return {
            email: reader.consumeNullTerminatedValue('string'),
            rating: reader.consumeStaticValue('number', 1),
            counter: reader.consumeStaticValue('number')
        }
    }
}

module.exports.PRIV = {
    create: (data, version) => {
        if(!(data instanceof Array)) {
            data = [data]
        }

        return Buffer.concat(data.map(priv => new ID3FrameBuilder("PRIV")
            .appendNullTerminatedValue(priv.ownerIdentifier)
            .appendStaticValue(priv.data instanceof Buffer ? priv.data : Buffer.from(priv.data, "utf8"))
            .getBuffer()))
    },
    read: (buffer, version) => {
        const reader = new ID3FrameReader(buffer)
        return {
            ownerIdentifier: reader.consumeNullTerminatedValue('string'),
            data: reader.consumeStaticValue()
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
        if(chap.startOffsetBytes === 0xFFFFFFFF) delete chap.startOffsetBytes
        if(chap.endOffsetBytes === 0xFFFFFFFF) delete chap.endOffsetBytes
        return chap
    }
}

module.exports.CTOC = {
    create: (data, version, nodeId3) => {
        if(!(data instanceof Array)) {
            data = [data]
        }

        return Buffer.concat(data.map((toc, index) => {
            if(!toc || !toc.elementID) {
                return null
            }
            if(!(toc.elements instanceof Array)) {
                toc.elements = []
            }

            let ctocFlags = Buffer.alloc(1, 0)
            if(index === 0) {
                ctocFlags[0] += 2
            }
            if(toc.isOrdered) {
                ctocFlags[0] += 1
            }

            const builder = new ID3FrameBuilder("CTOC")
                .appendNullTerminatedValue(toc.elementID)
                .appendStaticValue(ctocFlags, 1)
                .appendStaticNumber(toc.elements.length, 1)
            toc.elements.forEach((el) => {
                builder.appendNullTerminatedValue(el)
            })
            if(toc.tags) {
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
        for(let i = 0; i < entries; i++) {
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
    create: (data, version) => {
        if(!(data instanceof Array)) {
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
    read: (buffer, version) => {
        const reader = new ID3FrameReader(buffer, 0)

        return {
            description: reader.consumeNullTerminatedValue('string'),
            url: reader.consumeStaticValue('string', null, 0x00)
        }
    }
}
