import {Readable} from 'stream';

/**
 * function to convert ReadableStream to a string related to the download method.
 * @param stream stream file streamed
 * @returns Promise<string>
 */

export const streamToString = async (stream: Readable): Promise<string> => {
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    stream.on('start', resolve);
    stream.on('data', chunk => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('binary')));
  });
};
