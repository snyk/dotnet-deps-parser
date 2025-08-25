import { extractTargetFrameworksFromProjectFile } from '../../lib';
import * as fs from 'fs';
import * as path from 'path';

describe('for manifest files with conditional target frameworks', () => {
  it.each([
    {
      conditional: path.resolve(
        `${__dirname}/../fixtures/dotnet-conditional-targetframework`,
        'conditional-frameworks.csproj',
      ),
      regular: path.resolve(
        `${__dirname}/../fixtures/dotnet-conditional-targetframework`,
        'regular-frameworks.csproj',
      ),
    },
    {
      conditional: path.resolve(
        `${__dirname}/../fixtures/dotnet-conditional-targetframework`,
        'conditional-multitargetframeworks.csproj',
      ),
      regular: path.resolve(
        `${__dirname}/../fixtures/dotnet-conditional-targetframework`,
        'regular-multitargetframeworks.csproj',
      ),
    },
  ])(
    'should correctly parse TargetFramework with condition',
    async ({ conditional, regular }) => {
      const conditionalManifestFileContents = fs.readFileSync(
        conditional,
        'utf-8',
      );
      const conditionalTargetFrameworks =
        await extractTargetFrameworksFromProjectFile(
          conditionalManifestFileContents,
        );

      const regularManifestFileContents = fs.readFileSync(regular, 'utf-8');
      const regularTargetFrameworks =
        await extractTargetFrameworksFromProjectFile(
          regularManifestFileContents,
        );

      expect(conditionalTargetFrameworks).toBeTruthy();

      // we expect the parser to ignore the condition and yield the same output as if the condition is not there
      expect(regularTargetFrameworks).toEqual(conditionalTargetFrameworks);
    },
  );

  it('should correctly parse TargetFramework from Directory.build.props with Choose/When conditions', async () => {
    const directoryBuildPropsPath = path.resolve(
      `${__dirname}/../fixtures/dotnet-directory-build-props`,
      'Directory.Build.props',
    );

    const manifestFileContents = fs.readFileSync(
      directoryBuildPropsPath,
      'utf-8',
    );

    const targetFrameworks =
      await extractTargetFrameworksFromProjectFile(manifestFileContents);

    expect(targetFrameworks).toBeTruthy();
    expect(targetFrameworks).toEqual(['net9.0']);
  });
});
