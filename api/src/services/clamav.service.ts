import {BindingScope, injectable} from '@loopback/core';
import {Readable} from 'stream';
import {Express} from 'express';
import NodeClam from 'clamscan';

import {ValidationError} from '../validationError';
import {logger, ResourceName, StatusCode} from '../utils';
import {ClamAvConfig} from '../config';
@injectable({scope: BindingScope.TRANSIENT})
export class ClamavService {
  private clamScan: NodeClam;

  private clamAvConfig: ClamAvConfig;

  constructor() {
    this.clamAvConfig = new ClamAvConfig();
  }

  /**
   * Init ClamAv Socket
   */
  private async initClamAvSocket() {
    try {
      this.clamScan = await new NodeClam().init(
        this.clamAvConfig.getClamAvConfiguration(),
      );
    } catch (err) {
      logger.error(`${ClamAvConfig.name} - INIT - ${err}`);
      throw new ValidationError(
        'Error init',
        '/antivirus',
        StatusCode.InternalServerError,
        ResourceName.Antivirus,
      );
    }
  }

  /**
   * Call clamAv to scan if the file is corrupted
   * @param file
   * @returns Promise<Boolean>
   */
  async fileScan(file: Express.Multer.File): Promise<Boolean> {
    try {
      logger.info(`${ClamavService.name} - ${this.fileScan.name} - ${file.originalname}`);

      const stream = Readable.from(file.buffer.toString());

      const scanResult = await this.clamScan.scanStream(stream);

      logger.info(
        `${ClamavService.name} - Scan result ${file.originalname} - ${scanResult.isInfected}`,
      );

      return scanResult.isInfected;
    } catch (err) {
      logger.error(`${ClamavService.name} - ${this.fileScan.name} - ${err}`);
      throw new ValidationError(
        'Error during file scan',
        '/antivirus',
        StatusCode.InternalServerError,
        ResourceName.Antivirus,
      );
    }
  }

  /**
   * Loop through the files to check if at least one of them is corrupted
   * @param fileList
   * @returns boolean
   */
  async checkCorruptedFiles(fileList: Express.Multer.File[]): Promise<boolean> {
    try {
      await this.initClamAvSocket();

      logger.info(`${ClamavService.name} - ${this.checkCorruptedFiles.name}`);

      let isSafe = true;

      for (const file of fileList) {
        const res = await this.fileScan(file);
        if (res) {
          isSafe = false;
          break;
        }
      }
      return isSafe;
    } catch (err) {
      logger.error(`${ClamavService.name} - ${this.checkCorruptedFiles.name} - ${err}`);
      throw new ValidationError(
        'Error during file list check',
        '/antivirus',
        StatusCode.InternalServerError,
        ResourceName.Antivirus,
      );
    }
  }
}
