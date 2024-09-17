import { expect } from 'chai';
import sinon from 'sinon';
import { promises } from 'fs';
import { loadRoutes } from './api-routes';

describe('API Routes', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('loadAPIFilePaths', () => {
    it('should recursively load all API file paths from the specified directory', async () => {
      const readdirStub = sinon.stub(promises, 'readdir').resolves(['file1.ts', 'file2.ts']);
      const lstatStub = sinon.stub(promises, 'lstat').resolves({ isDirectory: () => false } as any);

      const result = await loadRoutes('/some/dir', []);

      expect(readdirStub.calledOnceWith('/some/dir')).to.be.true;
      expect(lstatStub.calledTwice).to.be.true;
      expect(result).to.deep.equal(['/some/dir/file1.ts', '/some/dir/file2.ts']);
    });

    it('should skip node_modules directory', async () => {
      const readdirStub = sinon.stub(promises, 'readdir').resolves(['node_modules']);
      const lstatStub = sinon.stub(promises, 'lstat').resolves({ isDirectory: () => true } as any);

      const result = await loadRoutes('/some/dir', []);

      expect(readdirStub.calledOnceWith('/some/dir')).to.be.true;
      expect(lstatStub.calledOnce).to.be.true;
      expect(result).to.deep.equal([]);
    });
  });
});