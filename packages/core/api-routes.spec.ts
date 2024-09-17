import { expect } from 'chai'
import * as sinon from 'sinon'
import * as fs from 'fs/promises'
import * as routeLoader from './api-routes'
import { CoreAPIRoute } from './routes'

describe('verifyRoutes', () => {
  it('should not throw an error for unique routes', () => {
    const routes: Array<CoreAPIRoute<unknown, unknown>> = [
      { type: 'get', route: '/api/v1/resource' },
      { type: 'post', route: '/api/v1/resource' },
      { type: 'delete', route: '/api/v1/resource/:id' },
    ] as any

    expect(() => routeLoader.verifyRoutes(routes)).to.not.throw()
  })

  it('should throw an error for duplicate routes', () => {
    const routes: Array<CoreAPIRoute<unknown, unknown>> = [
      { type: 'get', route: '/api/v1/resource' },
      { type: 'get', route: '/api/v1/resource' },
    ] as any

    expect(() => routeLoader.verifyRoutes(routes)).to.throw(
      'Duplicate route: {"type":"get","route":"/api/v1/resource"}'
    )
  })

  it('should handle different HTTP methods separately', () => {
    const routes: Array<CoreAPIRoute<unknown, unknown>> = [
      { type: 'get', route: '/api/v1/resource' },
      { type: 'post', route: '/api/v1/resource' },
    ] as any

    expect(() => routeLoader.verifyRoutes(routes)).to.not.throw()
  })

  it('should throw an error for duplicate routes with different methods', () => {
    const routes: Array<CoreAPIRoute<unknown, unknown>> = [
      { type: 'get', route: '/api/v1/resource' },
      { type: 'get', route: '/api/v1/resource' },
      { type: 'post', route: '/api/v1/resource' },
      { type: 'post', route: '/api/v1/resource' },
    ] as any

    expect(() => routeLoader.verifyRoutes(routes)).to.throw(
      'Duplicate route: {"type":"get","route":"/api/v1/resource"}'
    )
  })

  it('should normalize routes with parameters', () => {
    const routes: Array<CoreAPIRoute<unknown, unknown>> = [
      { type: 'get', route: '/api/v1/resource/:id' },
      { type: 'get', route: '/api/v1/resource/:name' },
    ] as any

    expect(() => routeLoader.verifyRoutes(routes)).to.throw(
      'Duplicate route: {"type":"get","route":"/api/v1/resource/:name"}'
    )
  })

  it('should not throw an error for unique normalized routes', () => {
    const routes: Array<CoreAPIRoute<unknown, unknown>> = [
      { type: 'get', route: '/api/v1/resource/:id' },
      { type: 'post', route: '/api/v1/resource/:id' },
    ] as any

    expect(() => routeLoader.verifyRoutes(routes)).to.not.throw()
  })
})

describe('Route Loader', () => {
  let fsReaddirStub: sinon.SinonStub
  let fsLstatStub: sinon.SinonStub
  let importStub: sinon.SinonStub

  beforeEach(() => {
    fsReaddirStub = sinon.stub(fs, 'readdir')
    fsLstatStub = sinon.stub(fs, 'lstat')
    importStub = sinon.stub(routeLoader, 'importFile')
  })

  afterEach(() => {
    sinon.restore()
  })

  describe('loadRoutesFromDirectory', () => {
    it('should load routes from a directory', async () => {
      fsReaddirStub.returns(
        Promise.resolve(['file1.ts', 'file2.ts', 'file3.d.ts'])
      )
      fsLstatStub.returns(Promise.resolve({ isDirectory: () => false }))
      importStub
        .withArgs('/root/file1.ts')
        .returns(Promise.resolve({ routes: [{ route: '/route1' }] }))
      importStub
        .withArgs('/root/file2.ts')
        .returns(Promise.resolve({ routes: [{ route: '/route2' }] }))

      const result = await routeLoader.loadRoutesFromDirectory('/root')

      expect(result.filesWithRoutes).to.deep.equal([
        '/root/file1.ts',
        '/root/file2.ts',
      ])
      expect(result.apiRoutes).to.deep.equal([
        { route: '/route1' },
        { route: '/route2' },
      ])
    })

    it('should handle nested directories', async () => {
      fsReaddirStub
        .withArgs('/root')
        .returns(Promise.resolve(['dir1', 'file1.ts']))
      fsReaddirStub
        .withArgs('/root/dir1')
        .returns(Promise.resolve(['file2.ts']))
      fsLstatStub
        .withArgs('/root/dir1')
        .returns(Promise.resolve({ isDirectory: () => true }))
      fsLstatStub
        .withArgs('/root/file1.ts')
        .returns(Promise.resolve({ isDirectory: () => false }))
      fsLstatStub
        .withArgs('/root/dir1/file2.ts')
        .returns(Promise.resolve({ isDirectory: () => false }))
      importStub
        .withArgs('/root/file1.ts')
        .returns(Promise.resolve({ routes: [{ route: '/route1' }] }))
      importStub
        .withArgs('/root/dir1/file2.ts')
        .returns(Promise.resolve({ routes: [{ route: '/route2' }] }))

      const result = await routeLoader.loadRoutesFromDirectory('/root')

      expect(result.filesWithRoutes).to.deep.equal([
        '/root/file1.ts',
        '/root/dir1/file2.ts',
      ])
      expect(result.apiRoutes).to.deep.equal([
        { route: '/route1' },
        { route: '/route2' },
      ])
    })

    it('should ignore node_modules directory', async () => {
      fsReaddirStub.returns(Promise.resolve(['node_modules', 'file1.ts']))
      fsLstatStub
        .withArgs('/root/node_modules')
        .returns(Promise.resolve({ isDirectory: () => true }))
      fsLstatStub
        .withArgs('/root/file1.ts')
        .returns(Promise.resolve({ isDirectory: () => false }))
      importStub
        .withArgs('/root/file1.ts')
        .returns(Promise.resolve({ routes: [{ route: '/route1' }] }))

      const result = await routeLoader.loadRoutesFromDirectory('/root')

      expect(result.filesWithRoutes).to.deep.equal(['/root/file1.ts'])
      expect(result.apiRoutes).to.deep.equal([{ route: '/route1' }])
    })

    it('should ignore .d.ts and .test.ts files', async () => {
      fsReaddirStub.returns(
        Promise.resolve(['file1.ts', 'file2.d.ts', 'file3.test.ts'])
      )
      fsLstatStub.returns(Promise.resolve({ isDirectory: () => false }))
      importStub
        .withArgs('/root/file1.ts')
        .returns(Promise.resolve({ routes: [{ route: '/route1' }] }))

      const result = await routeLoader.loadRoutesFromDirectory('/root')

      expect(result.filesWithRoutes).to.deep.equal(['/root/file1.ts'])
      expect(result.apiRoutes).to.deep.equal([{ route: '/route1' }])
    })
  })

  describe('loadRoutes', () => {
    it('should load routes from multiple directories', async () => {
      const loadRoutesFromDirectoryStub = sinon.stub(
        routeLoader,
        'loadRoutesFromDirectory'
      )
      loadRoutesFromDirectoryStub.withArgs('/root/dir1').returns(
        Promise.resolve({
          filesWithRoutes: ['/root/dir1/file1.ts'],
          apiRoutes: [{ route: '/route1', type: 'get' }],
        }) as any
      )
      loadRoutesFromDirectoryStub.withArgs('/root/dir2').returns(
        Promise.resolve({
          filesWithRoutes: ['/root/dir2/file2.ts'],
          apiRoutes: [{ route: '/route2', type: 'post' }],
        }) as any
      )

      const result = await routeLoader.loadRoutes('/root', ['dir1', 'dir2'])

      expect(result.filesWithRoutes).to.deep.equal([
        '/root/dir1/file1.ts',
        '/root/dir2/file2.ts',
      ])
      expect(result.apiRoutes).to.deep.equal([
        { route: '/route1', type: 'get' },
        { route: '/route2', type: 'post' },
      ])
    })

    it('should handle empty route directories', async () => {
      const loadRoutesFromDirectoryStub = sinon.stub(
        routeLoader,
        'loadRoutesFromDirectory'
      )
      loadRoutesFromDirectoryStub.returns(
        Promise.resolve({
          filesWithRoutes: [],
          apiRoutes: [],
        })
      )

      const result = await routeLoader.loadRoutes('/root', ['dir1', 'dir2'])

      expect(result.filesWithRoutes).to.deep.equal([])
      expect(result.apiRoutes).to.deep.equal([])
    })
  })
})
