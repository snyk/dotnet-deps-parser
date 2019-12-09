import * as parseXML from 'xml2js';
import {InvalidUserInputError} from '../errors';

export async function parseManifestFile(manifestFileContents: string) {
  return new Promise((resolve, reject) => {
    parseXML
    .parseString(manifestFileContents, (err, result) => {
      if (err) {
        const e = new InvalidUserInputError('manifest parsing failed');
        return reject(e);
      }
      return resolve(result);
    });
  });
}
