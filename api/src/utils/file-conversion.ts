import pdf from 'html-pdf';
import ejs from 'ejs';
import path from 'path';
import {InternalServerError} from '../validationError';

/**
 * Generate PDF Buffer from HTML
 * @param html string
 * @returns Buffer
 */
export const generatePdfBufferFromHtml = async (html: string): Promise<Buffer> => {
  return new Promise<Buffer>((resolve, reject) => {
    // Ignore ssl errors to show images in pdf
    pdf.create(html, {phantomArgs: ['--ignore-ssl-errors=yes']}).toBuffer(async (err, buffer) => {
      if (err) reject(new InternalServerError('file-conversion', generatePdfBufferFromHtml.name, err));
      resolve(buffer);
    });
  });
};

/**
 * Generate Template has HTML with ejs.renderFile
 * @param templateName string
 * @param data Object
 * @returns string
 */
export const generateTemplateAsHtml = async (
  templateName: string,
  data?: Object | undefined,
): Promise<string> => {
  try {
    return await ejs.renderFile(
      path.join(__dirname, `../services/templates/${templateName}.ejs`),
      data ?? {},
    );
  } catch (err) {
    throw new InternalServerError('file-conversion', generateTemplateAsHtml.name, err);
  }
};
