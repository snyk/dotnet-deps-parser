import { readFileSync } from 'fs';
import { buildDepTreeFromProjectFile } from '../../lib';

describe('manifest contains <PackageReference> tag without a Version element', () => {
  it('should return such package in dependenciesWithUnknownVersions', async () => {
    const manifestPath = `${__dirname}/../fixtures/missing-package-reference-version/project.csproj`;
    const manifestFileContents = readFileSync(manifestPath, 'utf-8');

    const depTree = await buildDepTreeFromProjectFile(
      manifestFileContents,
      false,
    );

    expect(depTree).toEqual({
      dependencies: {
        log4net: {
          depType: 'prod',
          dependencies: {},
          name: 'log4net',
          version: '2.0.8',
        },
        'MySql.Data': {
          depType: 'prod',
          dependencies: {},
          name: 'MySql.Data',
          version: '8.0.12',
        },
      },
      dependenciesWithUnknownVersions: ['Microsoft.AspNetCore.App'],
      hasDevDependencies: false,
      name: '',
      version: '',
    });
  });
});

describe('manifest contains <PackageReference> tag with version injected via build property', () => {
  it('should return such package in dependenciesWithInjectedPropVersion', async () => {
    const manifestPath = `${__dirname}/../fixtures/injected-prop-package-reference-version/project.csproj`;
    const manifestFileContents = readFileSync(manifestPath, 'utf-8');

    const depTree = await buildDepTreeFromProjectFile(
      manifestFileContents,
      false,
    );

    expect(depTree).toEqual({
      dependencies: {
        log4net: {
          depType: 'prod',
          dependencies: {},
          name: 'log4net',
          version: '2.0.8',
        },
        'MySql.Data': {
          depType: 'prod',
          dependencies: {},
          name: 'MySql.Data',
          version: '8.0.12',
        },
      },
      dependenciesWithInjectedPropVersion: ['Microsoft.AspNetCore.App'],
      hasDevDependencies: false,
      name: '',
      version: '',
    });
  });
});
