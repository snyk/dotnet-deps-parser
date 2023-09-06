import { extractTargetSdkFromGlobalJson } from '../../lib';
import * as fs from 'fs';
import * as path from 'path';

describe('for global.json target SDKs', () => {
  it.each([
    {
      fixturePath: path.resolve(
        `${__dirname}/../fixtures/dotnet-core-global-json`,
        'global.json',
      ),
      expected: '6.0.203',
    },
  ])(
    'should correctly parse TargetFramework with condition',
    async ({ fixturePath, expected }) => {
      const globalJson = fs.readFileSync(fixturePath, 'utf-8');

      const targetSdk = extractTargetSdkFromGlobalJson(globalJson);

      expect(globalJson).toBeTruthy();
      expect(targetSdk).toEqual(expected);
    },
  );
});
