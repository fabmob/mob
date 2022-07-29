import {BindingScope, injectable} from '@loopback/core';
import axios from 'axios';
import FormData from 'form-data';
import {Readable} from 'stream';
import {Express} from 'express';

import {ValidationError} from '../validationError';
import {ResourceName, StatusCode} from '../utils';
import {ClamAvConfig} from '../config';

@injectable({scope: BindingScope.TRANSIENT})
export class ClamavService extends ClamAvConfig {
  private clamAvConfig: ClamAvConfig;

  constructor() {
    super();
    this.clamAvConfig = new ClamAvConfig();
  }
  /**
   * Call Scan WS with axios to scan if the file is corrupted
   * @param file
   * @returns json
   */
  async fileScan(file: Express.Multer.File): Promise<any> {
    try {
      const form = new FormData();
      const stream = Readable.from(file.buffer.toString());
      form.append('FILES', stream);
      const formHeaders = form.getHeaders();
      const {data} = await axios.post(this.clamAvConfig.getScanUrl(), form, {
        headers: {...formHeaders},
      });
      return data.data.result[0];
    } catch (err) {
      throw new ValidationError(
        'Antivirus server not found',
        '/antivirus',
        StatusCode.NotFound,
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
    let isSafe = true;
    for (const file of fileList) {
      const res = await this.fileScan(file);
      if (res.is_infected) {
        isSafe = false;
        break;
      }
    }
    return isSafe;
  }
}
