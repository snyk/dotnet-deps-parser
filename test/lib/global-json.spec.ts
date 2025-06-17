import { extractSdkAndRollForwardPolicyFromGlobalJson } from '../../lib';
import * as fs from 'fs';
import * as path from 'path';

describe('global.json parsing', () => {
  it.each([
    {
      fixturePath: path.resolve(
        `${__dirname}/../fixtures/dotnet-core-global-json`,
        'global_normal.json',
      ),
      expected: {
        sdk: '6.0.203',
        rollForward: 'latestFeature',
      },
    },
    {
      fixturePath: path.resolve(
        `${__dirname}/../fixtures/dotnet-core-global-json`,
        'global_with_comments.json',
      ),
      expected: {
        sdk: '7.0.100',
        rollForward: undefined,
      },
    },
    {
      fixturePath: path.resolve(
        `${__dirname}/../fixtures/dotnet-core-global-json`,
        'global_no_version.json',
      ),
      expected: {
        sdk: undefined,
        rollForward: 'latestMajor',
      },
    },
  ])(
    'should correctly parse SDK and rollForward',
    async ({ fixturePath, expected }) => {
      const globalJson = fs.readFileSync(fixturePath, 'utf-8');

      const targetSdk =
        extractSdkAndRollForwardPolicyFromGlobalJson(globalJson);

      expect(globalJson).toBeTruthy();
      expect(targetSdk).toEqual(expected);
    },
  );
});
