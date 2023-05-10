import * as fs from 'fs';
import { extractProps } from '../../lib';
import { InvalidUserInputError } from '../../lib/errors';

test('.props file is parsed', async () => {
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
  expect(result).toEqual(expected);
});

test('.props file is not parsed due to invalid xml', async () => {
  const invalidUserInputError = new InvalidUserInputError(
    'xml file parsing failed',
  );
  expect(extractProps('</>')).rejects.toStrictEqual(invalidUserInputError);
});

test('empty .props file is parsed', async () => {
  const props = await extractProps(
    '<?xml version="1.0" encoding="utf-8"?><Project></Project></xml>',
  );
  expect(props).toEqual({});
});

test('empty .props file is not parsed due to invalid xml', async () => {
  const invalidUserInputError = new InvalidUserInputError(
    'xml file parsing failed',
  );
  expect(extractProps('</>')).rejects.toStrictEqual(invalidUserInputError);
});
