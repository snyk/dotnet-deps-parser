import { test } from 'tap';
import * as fs from 'fs';
import { extractProps } from '../../lib';
import { InvalidUserInputError } from '../../lib/errors';

test('.props file is parsed', async (t) => {
  const propsFileContents = fs.readFileSync(
    `${__dirname}/../fixtures/dotnet-with-props/Packages.props`,
    'utf-8',
  );
  const result = await extractProps(propsFileContents);
  const expected = {
    XunitVersion: '1.2.3',
    StyleCopVersion: '1.1.0',
    TestSdkVersion: '3.3.*',
    XunitStudioVersion: '1.1.1-beta*',
  };
  t.same(result, expected, 'should return map of packages with versions');
});

test('.props file is not parsed due to invalid xml', async (t) => {
  const invalidUserInputError = new InvalidUserInputError(
    'xml file parsing failed',
  );
  t.rejects(
    extractProps('</>'),
    invalidUserInputError,
    'rejects with invalid xml error',
  );
});

test('empty .props file is parsed', async (t) => {
  const props = await extractProps(
    '<?xml version="1.0" encoding="utf-8"?><Project></Project></xml>',
  );
  t.same(props, {}, 'no props found in empty file');
});

test('empty .props file is not parsed due to invalid xml', async (t) => {
  const invalidUserInputError = new InvalidUserInputError(
    'xml file parsing failed',
  );
  t.rejects(
    extractProps('</>'),
    invalidUserInputError,
    'rejects with invalid xml error',
  );
});
