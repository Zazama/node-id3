import fs = require('fs')
import { Promises } from '../../index'
import chai = require('chai')
import chaiAsPromised = require('chai-as-promised')
import { unlinkIfExistSync } from '../../src/util-file'
const { expect } = chai
chai.use(chaiAsPromised)

describe('NodeID3.Promises', function () {
    const nonExistingFile = {
        path: "hopefully-non-existing-file.mp3",
        name: "path on non-existing file"
    }
    const existingFile = {
        path: "promise-test-file.mp3",
        name: "path on existing file"
    }
    beforeEach(function() {
        unlinkIfExistSync(nonExistingFile.path)
        fs.writeFileSync(existingFile.path, Buffer.alloc(0))
    })
    afterEach(function() {
        unlinkIfExistSync(nonExistingFile.path)
        unlinkIfExistSync(existingFile.path)
    })
    type TestCase = [
        string,
        {path: string, name: string},
        (path: string) => Promise<unknown>
    ]
    const successfulTestCases: TestCase[] = [
        ["read()", existingFile, path => Promises.read(path)],
        ["write()", existingFile, path => Promises.write({}, path)],
        ["write()", nonExistingFile, path => Promises.write({}, path)],
        ["update()", existingFile, path => Promises.update({}, path)],
        ["removeTags()", existingFile, path => Promises.removeTags(path)]
    ]
    successfulTestCases.forEach(([funcName, fileCase, operation]) => {
        describe(`${funcName} with ${fileCase.name}`, function() {
            it('should resolve', function() {
                return expect(
                    operation(fileCase.path)
                ).to.eventually.be.fulfilled
            })
        })
    })
    const failingTestCases: TestCase[] = [
        ["read()", nonExistingFile, path => Promises.read(path)],
        ["update()", nonExistingFile, path => Promises.update({}, path)],
        ["removeTags()", nonExistingFile, path => Promises.removeTags(path)]
    ]
    failingTestCases.forEach(([funcName, fileCase, operation]) => {
        describe(`${funcName} with ${fileCase.name}`, function() {
            it('should reject', function() {
                return expect(
                    operation(fileCase.path)
                ).to.eventually.be.rejectedWith(Error)
            })
        })
    })
})
