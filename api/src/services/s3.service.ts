import {injectable, BindingScope} from '@loopback/core';

import {
  CreateBucketCommand,
  PutObjectCommand,
  S3Client,
  HeadBucketCommand,
  GetObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
  _Object,
  DeleteObjectsCommandOutput,
} from '@aws-sdk/client-s3'; // ES Modules import
import {logger, streamToString, StatusCode} from '../utils';
import {Readable} from 'stream';
import {Express} from 'express';
import {S3Config} from '../config';
import {ValidationError} from '../validationError';

export interface FileToUpload {
  fileName: string;
  buffer: Buffer;
}

@injectable({scope: BindingScope.TRANSIENT})
export class S3Service extends S3Config {
  private s3Client: S3Client;

  private NB_MAX_UPLOAD_FILE = 10;

  private ALLOWED_MIME_TYPE_LIST = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/pdf',
    'application/octet-stream',
  ];

  private ALLOWED_FILE_SIZE = 10000000;

  constructor() {
    super();
    this.s3Client = new S3Client(this.getConfiguration());
  }

  /**
   * Upload multiple files into the same bucket
   * @param bucketName string
   * @param fileDirectory string
   * @param fileList Express.Multer.File[]
   * @returns
   */
  async uploadFileListIntoBucket(
    bucketName: string,
    fileDirectory: string,
    fileList: Express.Multer.File[],
  ): Promise<string[]> {
    try {
      // Create bucket if it does not exist
      if (!(await this.checkBucketExists(bucketName))) {
        await this.createBucket(bucketName);
      }
      // Upload all files
      return await Promise.all(
        fileList.map(async (file: Express.Multer.File) => {
          await this.uploadFile(
            bucketName,
            `${fileDirectory}/${file.originalname}`,
            Buffer.from(file.buffer),
          );
          return `${fileDirectory}/${file.originalname}`;
        }),
      );
    } catch (error) {
      logger.error(`uploadFileListIntoBucket : ${error}`);
      throw new Error(`An error occurred: ${error}`);
    }
  }

  /**
   * Check if bucket exists in S3
   * S3 return $metadata if exists but throw an error if not
   * @param bucketName
   * @returns Boolean
   */
  async checkBucketExists(bucketName: string): Promise<Boolean> {
    try {
      await this.s3Client.send(
        new HeadBucketCommand({
          Bucket: bucketName,
        }),
      );
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Create bucket with parameter as name
   * @param bucketName string
   * @returns Promise<Object>
   */
  async createBucket(bucketName: string): Promise<Object> {
    try {
      return await this.s3Client.send(
        new CreateBucketCommand({
          Bucket: bucketName,
        }),
      );
    } catch (error) {
      throw new Error(`An error occurred: ${error}`);
    }
  }

  /**
   * Upload a file
   * @param bucketName string
   * @param filePath string
   * @param file Buffer
   * @returns Promise<Object>
   */

  async uploadFile(bucketName: string, filePath: string, file: Buffer): Promise<Object> {
    try {
      return await this.s3Client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: filePath,
          Body: file,
          ContentEncoding: 'base64',
        }),
      );
    } catch (error) {
      throw new Error(`An error occurred: ${error}`);
    }
  }

  /**
   * function to delete folder from minio
   * @param bucketName string
   * @param filePath string
   * @returns Promise<Object>
   */

  async deleteObjectFile(
    bucketName: string,
    filePath: string,
  ): Promise<DeleteObjectsCommandOutput | undefined | string> {
    const listParams = {
      Bucket: bucketName,
      Prefix: filePath,
    };

    const justifObjects = await this.s3Client.send(new ListObjectsV2Command(listParams));

    if (justifObjects.Contents?.length === 0) return;

    const deleteParams = {
      Bucket: bucketName,
      Delete: {Objects: [] as any},
    };

    justifObjects.Contents?.forEach((content: _Object) => {
      deleteParams.Delete.Objects.push({Key: content.Key});
    });

    try {
      return await this.s3Client.send(new DeleteObjectsCommand(deleteParams));
    } catch (error) {
      throw new Error(`Could not delete folder from S3`);
    }
  }

  /**
   * to get the downloadable file buffer of the file
   * @param fileDirectory key of the file to be fetched
   * @param bucket name of the bucket containing the file
   * @param file specific file
   * @returns Promise<Object>
   */

  async downloadFileBuffer(
    bucket: string,
    fileDirectory: string,
    file: string,
  ): Promise<{}> {
    try {
      const getParams: {Bucket: string; Key: string} = {
        Bucket: bucket,
        Key: `${fileDirectory}/${file}`,
      };

      const downloadResult = await this.s3Client.send(new GetObjectCommand(getParams));
      // We destructure our body that contains base64 from here
      const {Body} = downloadResult;

      const bodyContents = await streamToString(Body as Readable);
      return bodyContents;
    } catch (error) {
      throw new ValidationError(
        'Filename does not exist',
        '/attachments',
        StatusCode.NotFound,
      );
    }
  }

  /**
   * Check Number max of files exceeded
   * NB_MAX_UPLOAD_FILE is defined in this service
   * @param fileList Express.Multer.File
   */
  hasCorrectNumberOfFiles(fileList: Express.Multer.File[]): Boolean {
    return fileList.length <= this.NB_MAX_UPLOAD_FILE;
  }

  /**
   * Check if all files have a valid mimeType
   * ALLOWED_MIME_TYPE_LIST is defined in this service
   * @param fileList Express.Multer.File
   */
  hasValidMimeType(fileList: Express.Multer.File[]): Boolean {
    return fileList.every((file: Express.Multer.File) =>
      this.ALLOWED_MIME_TYPE_LIST.includes(file.mimetype),
    );
  }

  /**
   * Check if all files have a valid file size
   * ALLOWED_FILE_SIZE is defined in this service
   * @param fileList Express.Multer.File
   */
  hasValidFileSize(fileList: Express.Multer.File[]): Boolean {
    return fileList.every(
      (file: Express.Multer.File) => file.size <= this.ALLOWED_FILE_SIZE,
    );
  }
}
