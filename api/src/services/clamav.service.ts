import {BindingScope, injectable} from '@loopback/core';
import {Readable} from 'stream';
import {Express} from 'express';
import NodeClam from 'clamscan';

import {InternalServerError} from '../validationError';
import {Logger} from '../utils';
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
      this.clamScan = await new NodeClam().init(this.clamAvConfig.getClamAvConfiguration());
      Logger.info(ClamavService.name, this.initClamAvSocket.name, 'Clamscan init');
    } catch (err) {
      throw new InternalServerError(ClamavService.name, this.initClamAvSocket.name, err);
    }
  }

  /**
   * Call clamAv to scan if the file is corrupted
   * @param file
   * @returns Promise<Boolean>
   */
  async fileScan(file: Express.Multer.File): Promise<Boolean> {
    try {
      const stream = Readable.from(file.buffer.toString());
      const scanResult = await this.clamScan.scanStream(stream);
      Logger.debug(
        ClamavService.name,
        this.fileScan.name,
        `Scan result ${file.originalname}`,
        scanResult.isInfected,
      );
      return scanResult.isInfected;
    } catch (err) {
      throw new InternalServerError(ClamavService.name, this.initClamAvSocket.name, err);
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
      throw new InternalServerError(ClamavService.name, this.checkCorruptedFiles.name, err);
    }
  }
}
