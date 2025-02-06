// import * as path from 'path'
// import { assert } from 'chai'
// import * as sinon from 'sinon'

// import { action } from './pikku-nextjs.js'

// // Mocking external dependencies
// import * as fsPromises from 'fs/promises'
// import * as extractPikkuInformation from '../src/extract-pikku-information.js'
// import * as getFileImportRelativePath from '../src/utils.js'
// import * as nextjsWrapperGenerator from '../src/nextjs-wrapper-generator.js'

// import * as getPikkuConfig from '@pikku/core/pikku-config'

// describe('action function - generateNextJsWrapper arguments', () => {
//   let sandbox: sinon.SinonSandbox
//   let getPikkuConfigStub: sinon.SinonStub
//   let extractPikkuInformationStub: sinon.SinonStub
//   let getFileImportRelativePathStub: sinon.SinonStub
//   let generateNextJsWrapperStub: sinon.SinonStub
//   let processExitStub: sinon.SinonStub
//   let consoleErrorStub: sinon.SinonStub

//   beforeEach(() => {
//     sandbox = sinon.createSandbox()

//     // Stub external dependencies
//     getPikkuConfigStub = sandbox.stub(
//       getPikkuConfig,
//       'getPikkuConfig'
//     )
//     extractPikkuInformationStub = sandbox.stub(
//       extractPikkuInformation,
//       'extractPikkuInformation'
//     )
//     getFileImportRelativePathStub = sandbox.stub(
//       getFileImportRelativePath,
//       'getFileImportRelativePath'
//     )
//     generateNextJsWrapperStub = sandbox.stub(
//       nextjsWrapperGenerator,
//       'generateNextJsWrapper'
//     )

//     // Stub fs.promises methods to prevent actual file system operations
//     sandbox.stub(fsPromises, 'mkdir').resolves()
//     sandbox.stub(fsPromises, 'writeFile').resolves()

//     // Stub process.exit and console.error to prevent test from exiting and to capture errors
//     processExitStub = sandbox.stub(process, 'exit')
//     sandbox.stub(console, 'log')
//     consoleErrorStub = sandbox.stub(console, 'error')

//     // Default stubs for external functions
//     getPikkuConfigStub.resolves({
//       pikkuNextFile: 'nextFile.ts',
//       rootDir: 'rootDir',
//       routesFile: 'routes.ts',
//       configDir: 'configDir',
//       packageMappings: {},
//       schemaDirectory: 'schemas',
//     })

//     extractPikkuInformationStub.resolves({
//       pikkuConfigs: { 'configFile.ts': ['pikkuConfigVariable'] },
//       sessionServicesFactories: {
//         'sessionFactoryFile.ts': ['sessionFactoryVariable'],
//       },
//       singletonServicesFactories: {
//         'singletonFactoryFile.ts': ['singletonFactoryVariable'],
//       },
//     })

//     // Mock getFileImportRelativePath to return predictable paths
//     getFileImportRelativePathStub.callsFake(
//       (from: string, to: string, packageMappings: any) => {
//         return `./${to}`
//       }
//     )
//   })

//   afterEach(() => {
//     sandbox.restore()
//   })

//   it('should pass correct imports to generateNextJsWrapper', async () => {
//     await action({})

//     // Capture the arguments passed to generateNextJsWrapper
//     assert(
//       generateNextJsWrapperStub.calledOnce,
//       'generateNextJsWrapper should be called once'
//     )

//     const [
//       ,
//       ,
//       pikkuConfigImport,
//       singletonServicesImport,
//       sessionServicesImport,
//     ] = generateNextJsWrapperStub.firstCall.args

//     const expectedPikkuConfigImport = `import { pikkuConfigVariable } from './configFile.ts'`
//     const expectedSingletonServicesImport = `import { singletonFactoryVariable } from './singletonFactoryFile.ts'`
//     const expectedSessionServicesImport = `import { sessionFactoryVariable } from './sessionFactoryFile.ts'`

//     assert.strictEqual(
//       pikkuConfigImport,
//       expectedPikkuConfigImport,
//       'pikkuConfigImport should match expected import'
//     )
//     assert.strictEqual(
//       singletonServicesImport,
//       expectedSingletonServicesImport,
//       'singletonServicesImport should match expected import'
//     )
//     assert.strictEqual(
//       sessionServicesImport,
//       expectedSessionServicesImport,
//       'sessionServicesImport should match expected import'
//     )
//   })

//   it('should use provided pikkuConfigFile and pikkuConfigVariable', async () => {
//     const options = {
//       pikkuConfigFile: 'customConfigFile.ts',
//       pikkuConfigVariable: 'customPikkuConfigVariable',
//     }

//     await action(options)

//     assert(
//       generateNextJsWrapperStub.calledOnce,
//       'generateNextJsWrapper should be called once'
//     )

//     const [, , pikkuConfigImport] = generateNextJsWrapperStub.firstCall.args

//     const expectedImport = `import { customPikkuConfigVariable } from './customConfigFile.ts'`
//     assert.strictEqual(
//       pikkuConfigImport,
//       expectedImport,
//       'pikkuConfigImport should use provided file and variable'
//     )
//   })

//   it('should handle missing pikkuConfigs and exit', async () => {
//     // Modify the stub to simulate missing pikkuConfigs
//     extractPikkuInformationStub.resolves({
//       pikkuConfigs: {},
//       sessionServicesFactories: {
//         'sessionFactoryFile.ts': ['sessionFactoryVariable'],
//       },
//       singletonServicesFactories: {
//         'singletonFactoryFile.ts': ['singletonFactoryVariable'],
//       },
//     })

//     await action({})

//     assert(consoleErrorStub.calledWithMatch('Found errors:'))
//     assert(consoleErrorStub.calledWithMatch('No PikkuConfig object found'))
//     assert(
//       processExitStub.calledWith(1),
//       'process.exit should be called with 1'
//     )
//     assert.isFalse(
//       generateNextJsWrapperStub.called,
//       'generateNextJsWrapper should not be called when there is an error'
//     )
//   })

//   it('should generate correct import paths with packageMappings', async () => {
//     // Provide packageMappings in the pikkuConfig
//     getPikkuConfigStub.resolves({
//       pikkuNextFile: 'nextFile.ts',
//       rootDir: 'rootDir',
//       routesFile: 'routes.ts',
//       configDir: 'configDir',
//       packageMappings: {
//         'configFile.ts': '@configs/configFile',
//         'singletonFactoryFile.ts': '@factories/singletonFactory',
//         'sessionFactoryFile.ts': '@factories/sessionFactory',
//       },
//       schemaDirectory: 'schemas',
//     })

//     // Modify getFileImportRelativePath to consider packageMappings
//     getFileImportRelativePathStub.callsFake(
//       (from: string, to: string, packageMappings: any) => {
//         const mappedPackage = packageMappings[to]
//         return mappedPackage || `./${path.relative(path.dirname(from), to)}`
//       }
//     )

//     await action({})

//     assert(
//       generateNextJsWrapperStub.calledOnce,
//       'generateNextJsWrapper should be called once'
//     )

//     const [
//       ,
//       ,
//       pikkuConfigImport,
//       singletonServicesImport,
//       sessionServicesImport,
//     ] = generateNextJsWrapperStub.firstCall.args

//     const expectedPikkuConfigImport = `import { pikkuConfigVariable } from '@configs/configFile'`
//     const expectedSingletonServicesImport = `import { singletonFactoryVariable } from '@factories/singletonFactory'`
//     const expectedSessionServicesImport = `import { sessionFactoryVariable } from '@factories/sessionFactory'`

//     assert.strictEqual(
//       pikkuConfigImport,
//       expectedPikkuConfigImport,
//       'pikkuConfigImport should use package mapping'
//     )
//     assert.strictEqual(
//       singletonServicesImport,
//       expectedSingletonServicesImport,
//       'singletonServicesImport should use package mapping'
//     )
//     assert.strictEqual(
//       sessionServicesImport,
//       expectedSessionServicesImport,
//       'sessionServicesImport should use package mapping'
//     )
//   })

//   it('should use provided singletonServicesFactoryFile and singletonServicesFactoryVariable', async () => {
//     const options = {
//       singletonServicesFactoryFile: 'customSingletonFactoryFile.ts',
//       singletonServicesFactoryVariable: 'customSingletonFactoryVariable',
//     }

//     await action(options)

//     assert(
//       generateNextJsWrapperStub.calledOnce,
//       'generateNextJsWrapper should be called once'
//     )

//     const [, , , singletonServicesImport] =
//       generateNextJsWrapperStub.firstCall.args

//     const expectedImport = `import { customSingletonFactoryVariable } from './customSingletonFactoryFile.ts'`
//     assert.strictEqual(
//       singletonServicesImport,
//       expectedImport,
//       'singletonServicesImport should use provided file and variable'
//     )
//   })

//   it('should use provided sessionServicesFactoryFile and sessionServicesFactoryVariable', async () => {
//     const options = {
//       sessionServicesFactoryFile: 'customSessionFactoryFile.ts',
//       sessionServicesFactoryVariable: 'customSessionFactoryVariable',
//     }

//     await action(options)

//     assert(
//       generateNextJsWrapperStub.calledOnce,
//       'generateNextJsWrapper should be called once'
//     )

//     const [, , , , sessionServicesImport] =
//       generateNextJsWrapperStub.firstCall.args

//     const expectedImport = `import { customSessionFactoryVariable } from './customSessionFactoryFile.ts'`
//     assert.strictEqual(
//       sessionServicesImport,
//       expectedImport,
//       'sessionServicesImport should use provided file and variable'
//     )
//   })
// })
