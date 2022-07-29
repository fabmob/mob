/* eslint-disable max-len */
import {S3Service} from '../../services';
import {expect, sinon} from '@loopback/testlab';
import {S3Client} from '@aws-sdk/client-s3';
import {Readable} from 'stream';
import {Express} from 'express';
import {ValidationError} from '../../validationError';
import {StatusCode} from '../../utils';

describe('S3Service ', async () => {
  let s3: S3Service;
  const deleteError: Error = new Error('Could not delete folder from S3');
  const downloadError: Error = new Error('Filename does not exist');
  const errorMessage = 'Error';
  const errorRejectMessage: Error = new Error('An error occurred: Error');

  const fileList: any[] = [
    {
      originalname: 'test1.txt',
      buffer: Buffer.from('test de buffer'),
      mimetype: 'image/png',
      fieldname: 'test',
      size: 4000,
      encoding: '7bit',
      stream: new Readable(),
      destination: 'string',
      filename: 'fileName',
      path: 'test',
    },
    {
      originalname: 'test2.txt',
      buffer: Buffer.from('test de buffer'),
      mimetype: 'image/png',
      fieldname: 'test',
      size: 4000,
      encoding: '7bit',
      stream: new Readable(),
      destination: 'string',
      filename: 'fileName',
      path: 'test',
    },
  ];

  const file = {
    originalname: 'test1.txt',
    buffer: Buffer.from('test de buffer'),
    mimetype: 'image/png',
    fieldname: 'test',
    size: 4000,
    encoding: '7bit',
    stream: new Readable(),
    destination: 'string',
    filename: 'fileName',
    path: 'test',
  };

  beforeEach(() => {
    s3 = new S3Service();
  });

  it('uploadFileListIntoBucket(bucketName, fileDirectory, fileList) success', async () => {
    const checkBucketExistsStub = sinon.stub(s3, 'checkBucketExists').resolves(true);
    const uploadFileListIntoBucketStub = sinon
      .stub(s3, 'uploadFile')
      .resolves(['test-directory/test1.txt', 'test-directory/test2.txt']);

    const result = await s3.uploadFileListIntoBucket(
      'test-bucket',
      'test-directory',
      fileList,
    );
    expect(result).to.deepEqual(['test-directory/test1.txt', 'test-directory/test2.txt']);
    uploadFileListIntoBucketStub.restore();
    checkBucketExistsStub.restore();
  });

  it('uploadFileListIntoBucket(bucketName, fileDirectory, fileList) bucket not created', async () => {
    const checkBucketExistsStub = sinon.stub(s3, 'checkBucketExists').resolves(false);
    const createBucketStub = sinon
      .stub(s3, 'createBucket')
      .resolves(mockCreateBucketResponse);
    const uploadFileListIntoBucketStub = sinon
      .stub(s3, 'uploadFile')
      .resolves(['test-directory/test1.txt', 'test-directory/test2.txt']);
    const result = await s3.uploadFileListIntoBucket(
      'test-bucket',
      'test-directory',
      fileList,
    );
    expect(result).to.deepEqual(['test-directory/test1.txt', 'test-directory/test2.txt']);
    createBucketStub.restore();
    uploadFileListIntoBucketStub.restore();
    checkBucketExistsStub.restore();
  });

  it('uploadFileListIntoBucket(bucketName, fileDirectory, fileList) error', async () => {
    const checkBucketExistsStub = sinon.stub(S3Client.prototype, 'send').resolves(true);
    const uploadFileListIntoBucketStubError = sinon
      .stub(s3, 'uploadFile')
      .rejects(errorMessage);
    try {
      await s3.uploadFileListIntoBucket('test-bucket', 'test-directory', fileList);
    } catch (error) {
      expect(error).to.deepEqual(errorRejectMessage);
      uploadFileListIntoBucketStubError.restore();
      checkBucketExistsStub.restore();
    }
  });

  it('checkBucketExists(bucketName) success', async () => {
    const checkBucketExistsStub = sinon.stub(S3Client.prototype, 'send').resolves(true);
    const result = await s3.checkBucketExists('test-bucket');
    expect(result).to.equal(true);
    checkBucketExistsStub.restore();
  });

  it('checkBucketExists(bucketName) error', async () => {
    const checkBucketExistsStub = sinon
      .stub(S3Client.prototype, 'send')
      .rejects(errorMessage);
    const result = await s3.checkBucketExists('test-bucket');
    expect(result).to.equal(false);
    checkBucketExistsStub.restore();
  });

  it('createBucket(bucketName) success', async () => {
    const createBucketStub = sinon
      .stub(S3Client.prototype, 'send')
      .resolves(mockCreateBucketResponse);
    const result = await s3.createBucket('test-bucket');
    expect(result).to.deepEqual(mockCreateBucketResponse);
    createBucketStub.restore();
  });

  it('createBucket(bucketName) error', async () => {
    const createBucketStub = sinon.stub(S3Client.prototype, 'send').rejects(errorMessage);
    try {
      await s3.createBucket('test-bucket');
    } catch (error) {
      expect(error).to.deepEqual(errorRejectMessage);
      createBucketStub.restore();
    }
  });

  it('uploadFile(bucketName, filePath, file) success', async () => {
    const uploadFileStub = sinon
      .stub(S3Client.prototype, 'send')
      .resolves(mockUploadFileResponse);
    const result = await s3.uploadFile(
      'test-bucket',
      'test2.txt',
      Buffer.from(
        'UEsDBBQABgAIAAAAIQBSlIoMAQIAADUQAAATAAgCW0NvbnRlbnRfVHlwZXNdLnhtbCCiBAIooAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADMl99u0zAUxu',
      ),
    );
    expect(result).to.deepEqual(mockUploadFileResponse);
    uploadFileStub.restore();
  });

  it('uploadFile(bucketName, filePath, file) error', async () => {
    const uploadFileStub = sinon.stub(S3Client.prototype, 'send').rejects(errorMessage);
    try {
      await s3.uploadFile('test-bucket', 'hello.txt', Buffer.from('test de buffer'));
    } catch (error) {
      expect(error).to.deepEqual(errorRejectMessage);
      uploadFileStub.restore();
    }
  });

  it('downloadFiles(bucket, fileDirectory, file) success', async () => {
    const downloadStub = sinon
      .stub(s3, 'downloadFileBuffer')
      .returns(mockDownloadFileResponse as any);

    const downloadResult = await s3.downloadFileBuffer(
      'testr-bucket',
      'testo-directory',
      'test4.txt',
    );
    expect(downloadResult).to.equal(mockDownloadFileResponse);
    downloadStub.restore();
  });

  it('downloadFiles(bucket, fileDirectory, file) error', async () => {
    const downloadFileStub = sinon.stub(S3Client.prototype, 'send').rejects(errorMessage);
    const expectedError = new ValidationError(
      'Filename does not exist',
      '/attachments',
      StatusCode.NotFound,
    );
    try {
      await s3.downloadFileBuffer('test-bucket', 'test-directory', 'test1.txt');
    } catch (err: any) {
      expect(err).to.deepEqual(expectedError);
      downloadFileStub.restore();
    }
  });

  it('deleteFolder(bucketName, filePath) success', async () => {
    const deleteFolderStub = sinon
      .stub(S3Client.prototype, 'send')
      .resolves(mockUploadFileResponse);
    const result = await s3.deleteObjectFile('test-bucket', 'test-directory');
    expect(result).to.deepEqual(mockUploadFileResponse);
    deleteFolderStub.restore();
  });

  it('deleteFolder(bucketName, filePath) error', async () => {
    const deleteFolderStub = sinon.stub(S3Client.prototype, 'send').rejects(deleteError);
    try {
      await s3.deleteObjectFile('test-bucke2t', 'test-directory2');
    } catch (error) {
      expect(error).to.deepEqual(deleteError);
      deleteFolderStub.restore();
    }
  });

  it('hasCorrectNumberOfFiles(fileList) success return true', () => {
    const hasCorrectNumberOfFiles = s3.hasCorrectNumberOfFiles(fileList);
    expect(hasCorrectNumberOfFiles).to.equal(true);
  });

  it('hasCorrectNumberOfFiles(fileList) success return false', () => {
    const fileListNbExceeded = [
      file,
      file,
      file,
      file,
      file,
      file,
      file,
      file,
      file,
      file,
      file,
    ];
    const hasCorrectNumberOfFiles = s3.hasCorrectNumberOfFiles(fileListNbExceeded);
    expect(hasCorrectNumberOfFiles).to.equal(false);
  });

  it('hasValidMimeType(fileList) success return true', () => {
    const hasValidMimeType = s3.hasValidMimeType(fileList);
    expect(hasValidMimeType).to.equal(true);
  });

  it('hasValidMimeType(fileList) success return false', () => {
    const originalMimeType = fileList[0].mimetype;
    fileList[0].mimetype = 'image/gif';
    const hasValidMimeType = s3.hasValidMimeType(fileList);
    expect(hasValidMimeType).to.equal(false);
    fileList[0].mimetype = originalMimeType;
  });

  it('hasValidFileSize(fileList) success return true', () => {
    const hasValidFileSize = s3.hasValidFileSize(fileList);
    expect(hasValidFileSize).to.equal(true);
  });

  it('hasValidFileSize(fileList) success return false', () => {
    const originalFileSize = fileList[0].size;
    fileList[0].size = 8000000;
    const hasValidFileSize = s3.hasValidFileSize(fileList);
    expect(hasValidFileSize).to.equal(false);
    fileList[0].size = originalFileSize;
  });

  const mockCreateBucketResponse = {
    $metadata: {
      httpStatusCode: 200,
      attempts: 1,
      totalRetryDelay: 0,
    },
    Location: '/test-bucket',
  };

  const mockUploadFileResponse = {
    $metadata: {
      httpStatusCode: 200,
      attempts: 1,
      totalRetryDelay: 0,
    },
    ETag: '"etag"',
  };

  const mockDownloadFileResponse = {
    $metadata: {
      httpStatusCode: 200,
      attempts: 1,
      totalRetryDelay: 0,
    },
    ETag: '"etag"',
  };
});
