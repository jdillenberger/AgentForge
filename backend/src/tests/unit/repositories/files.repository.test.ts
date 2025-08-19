import { FilesRepository } from '../../../repositories/files.repository';
import { ValidationError, NotFoundError } from '../../../errors/app-errors';
import * as fs from 'fs/promises';
import * as path from 'path';

// Mock fs module
jest.mock('fs/promises');
jest.mock('path');

const mockFs = fs as jest.Mocked<typeof fs>;
const mockPath = path as jest.Mocked<typeof path>;

describe('FilesRepository', () => {
  let repository: FilesRepository;

  beforeEach(() => {
    repository = new FilesRepository();
    jest.clearAllMocks();
    
    // Mock path.join to return predictable paths
    mockPath.join.mockImplementation((...paths) => paths.join('/'));
    mockPath.dirname.mockImplementation((p) => p.substring(0, p.lastIndexOf('/')));
    mockPath.extname.mockImplementation((p) => {
      const lastDot = p.lastIndexOf('.');
      return lastDot > 0 ? p.substring(lastDot) : '';
    });
  });

  describe('createFile', () => {
    it('should create a new file successfully', async () => {
      const filename = 'test.md';
      const content = '# Test Content';
      const namespace = 'test';
      
      // Mock fs.access to throw ENOENT (file doesn't exist)
      mockFs.access.mockRejectedValue({ code: 'ENOENT' });
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue();
      
      await repository.createFile(filename, content, namespace);
      
      expect(mockFs.access).toHaveBeenCalledWith('/tmp/test-git-repo/test_/test.md');
      expect(mockFs.mkdir).toHaveBeenCalledWith('/tmp/test-git-repo/test_', { recursive: true });
      expect(mockFs.writeFile).toHaveBeenCalledWith('/tmp/test-git-repo/test_/test.md', content, 'utf-8');
    });

    it('should throw ValidationError if file already exists', async () => {
      const filename = 'existing.md';
      const content = '# Content';
      
      // Mock fs.access to succeed (file exists)
      mockFs.access.mockResolvedValue();
      
      await expect(repository.createFile(filename, content))
        .rejects
        .toThrow(ValidationError);
    });
  });

  describe('getFile', () => {
    it('should retrieve file content successfully', async () => {
      const filename = 'test.md';
      const content = '# Test Content';
      const stats = {
        size: content.length,
        mtime: new Date('2023-01-01'),
      } as any;
      
      mockFs.stat.mockResolvedValue(stats);
      mockFs.readFile.mockResolvedValue(content);
      
      const result = await repository.getFile(filename);
      
      expect(result).toEqual({
        name: filename,
        path: filename,
        content,
        size: content.length,
        lastModified: '2023-01-01T00:00:00.000Z',
        type: 'markdown',
      });
    });

    it('should throw NotFoundError if file does not exist', async () => {
      const filename = 'nonexistent.md';
      
      mockFs.stat.mockRejectedValue({ code: 'ENOENT' });
      
      await expect(repository.getFile(filename))
        .rejects
        .toThrow(NotFoundError);
    });
  });

  describe('updateFile', () => {
    it('should update existing file successfully', async () => {
      const filename = 'test.md';
      const content = '# Updated Content';
      
      mockFs.access.mockResolvedValue();
      mockFs.writeFile.mockResolvedValue();
      
      await repository.updateFile(filename, content);
      
      expect(mockFs.access).toHaveBeenCalledWith('/tmp/test-git-repo/test.md');
      expect(mockFs.writeFile).toHaveBeenCalledWith('/tmp/test-git-repo/test.md', content, 'utf-8');
    });

    it('should throw NotFoundError if file does not exist', async () => {
      const filename = 'nonexistent.md';
      const content = '# Content';
      
      mockFs.access.mockRejectedValue({ code: 'ENOENT' });
      
      await expect(repository.updateFile(filename, content))
        .rejects
        .toThrow(NotFoundError);
    });
  });

  describe('deleteFile', () => {
    it('should delete file successfully', async () => {
      const filename = 'test.md';
      
      mockFs.unlink.mockResolvedValue();
      
      await repository.deleteFile(filename);
      
      expect(mockFs.unlink).toHaveBeenCalledWith('/tmp/test-git-repo/test.md');
    });

    it('should throw NotFoundError if file does not exist', async () => {
      const filename = 'nonexistent.md';
      
      mockFs.unlink.mockRejectedValue({ code: 'ENOENT' });
      
      await expect(repository.deleteFile(filename))
        .rejects
        .toThrow(NotFoundError);
    });
  });

  describe('validatePath', () => {
    it('should reject paths with path traversal attempts', () => {
      expect(() => (repository as any).validatePath('../etc/passwd')).toThrow('Invalid file path');
      expect(() => (repository as any).validatePath('/etc/passwd')).toThrow('Invalid file path');
      expect(() => (repository as any).validatePath('test/./file.txt')).toThrow('Invalid file path');
    });

    it('should accept valid paths', () => {
      expect(() => (repository as any).validatePath('test.txt')).not.toThrow();
      expect(() => (repository as any).validatePath('folder/test.txt')).not.toThrow();
    });
  });
});