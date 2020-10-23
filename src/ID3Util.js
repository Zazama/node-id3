const iconv = require('iconv-lite')

const ENCODINGS = [
    'ISO-8859-1', 'UTF-16', 'UTF-16BE', 'UTF-8'
]

module.exports.SplitBuffer = class SplitBuffer {
    constructor(value = null, remainder = null) {
        this.value = value
        this.remainder = remainder
    }
}

module.exports.splitNullTerminatedBuffer = function(buffer, encodingByte = 0x00) {
    let termination = { start: -1, size: 0 }
    if(encodingByte === 0x01 || encodingByte === 0x02) {
        termination.start = buffer.indexOf(Buffer.from([0x00, 0x00]))
        termination.size = 2
        if(termination.start !== -1 && buffer.length > (termination.start + termination.size)) {
            if(buffer[termination.start + termination.size] === 0x00) {
                termination.start += 1
            }
        }
    } else {
        termination.start = buffer.indexOf(0x00)
        termination.size = 1
    }

    if(termination.start === -1) {
        return new this.SplitBuffer(null, buffer.slice(0))
    }
    else if(buffer.length <= termination.start + termination.length) {
        return new this.SplitBuffer(buffer.slice(0, termination.start), null)
    } else {
        return new this.SplitBuffer(buffer.slice(0, termination.start), buffer.slice(termination.start + termination.size))
    }
}

module.exports.terminationBuffer = function(encodingByte = 0x00) {
    if(encodingByte === 0x01 || encodingByte === 0x02) {
        return Buffer.alloc(2, 0x00)
    } else {
        return Buffer.alloc(1, 0x00)
    }
}

module.exports.encodingFromStringOrByte = function(encoding) {
    if(ENCODINGS.indexOf(encoding) !== -1) {
        return encoding
    } else if(encoding > -1 && encoding < ENCODINGS.length) {
        encoding = ENCODINGS[encoding]
    } else {
        encoding = ENCODINGS[0]
    }
    return encoding
}

module.exports.stringToEncodedBuffer = function(str, encodingByte) {
    return iconv.encode(str, this.encodingFromStringOrByte(encodingByte))
}

module.exports.bufferToDecodedString = function(buffer, encodingByte) {
    return iconv.decode(buffer, this.encodingFromStringOrByte(encodingByte)).replace(/\0/g, '')
}
