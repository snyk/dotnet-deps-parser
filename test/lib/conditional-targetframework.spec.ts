import {
  extractTargetFrameworksFromFiles,
  extractTargetFrameworksFromProjectFile,
} from '../../lib';
import * as fs from 'fs';
import * as path from 'path';

describe('for manifest files with conditional target frameworks', () => {
  it('should correctly parse TargetFramework with condition', async () => {
    const conditionalManifestFileFullPath = path.resolve(
      `${__dirname}/../fixtures/dotnet-conditional-targetframework`,
      'conditional-frameworks.csproj',
    );
    const conditionalManifestFileContents = fs.readFileSync(
      conditionalManifestFileFullPath,
      'utf-8',
    );
    const conditionalTargetFrameworks =
      await extractTargetFrameworksFromProjectFile(
        conditionalManifestFileContents,
      );

    const regularManifestFileContents = fs.readFileSync(
      path.resolve(
        `${__dirname}/../fixtures/dotnet-conditional-targetframework`,
        'regular-frameworks.csproj',
      ),
      'utf-8',
    );
    const regularTargetFrameworks =
      await extractTargetFrameworksFromProjectFile(regularManifestFileContents);

    expect(conditionalTargetFrameworks).toBeTruthy();

    // we expect the parser to ignore the condition and yield the same output as if the condition is not there
    expect(regularTargetFrameworks).toEqual(conditionalTargetFrameworks);
  });

  it('should correctly parse TargetFrameworks with condition', async () => {
    const conditionalManifestFileFullPath = path.resolve(
      `${__dirname}/../fixtures/dotnet-conditional-targetframework`,
      'conditional-multitargetframeworks.csproj',
    );
    const conditionalManifestFileContents = fs.readFileSync(
      conditionalManifestFileFullPath,
      'utf-8',
    );
    const conditionalTargetFrameworks =
      await extractTargetFrameworksFromProjectFile(
        conditionalManifestFileContents,
      );

    const regularManifestFileContents = fs.readFileSync(
      path.resolve(
        `${__dirname}/../fixtures/dotnet-conditional-targetframework`,
        'regular-multitargetframeworks.csproj',
      ),
      'utf-8',
    );
    const regularTargetFrameworks =
      await extractTargetFrameworksFromProjectFile(regularManifestFileContents);

    expect(conditionalTargetFrameworks).toBeTruthy();

    // we expect the parser to ignore the condition and yield the same output as if the condition is not there
    expect(regularTargetFrameworks).toEqual(conditionalTargetFrameworks);
  });
});
