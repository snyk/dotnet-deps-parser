import { readFileSync } from 'fs';
import { buildDepTreeFromProjectFile } from '../../lib';

describe('buildDepTreeFromProjectFile', () => {
  describe('manifest file edge-cases', () => {
    it('should parse properly no version', async () => {
      const manifestFileContents = readFileSync(
        `${__dirname}/../fixtures/dotnet-core-simple-project-no-version-and-version-star/foobar-no-ver.csproj`,
        'utf8',
      );

      const depTree = await buildDepTreeFromProjectFile(manifestFileContents);

      expect(depTree.dependenciesWithUnknownVersions).toBeTruthy();
      expect(depTree.dependenciesWithUnknownVersions?.length).toBe(1);
      expect(
        depTree.dependenciesWithUnknownVersions?.find(
          (el) => el === 'Newtonsoft.Json',
        ),
      ).toBeTruthy();
    });

    it('should parse properly version as star', async () => {
      const manifestFileContents = readFileSync(
        `${__dirname}/../fixtures/dotnet-core-simple-project-no-version-and-version-star/foobar-star-ver.csproj`,
        'utf8',
      );

      const depTree = await buildDepTreeFromProjectFile(manifestFileContents);
      const dep = depTree.dependencies['Microsoft.AspNetCore.App'];
      expect(dep).toBeTruthy();
      expect(dep.version).toBe('*');
    });
  });

  describe('project file contains only reference assemblies', () => {
    it('should not consider reference assemblies as dependencies', async () => {
      const manifestFileContents = readFileSync(
        `${__dirname}/../fixtures/reference-assemblies/project.csproj`,
        'utf8',
      );

      const depTree = await buildDepTreeFromProjectFile(manifestFileContents);

      expect(depTree).toEqual({
        dependencies: {},
        hasDevDependencies: false,
        name: 'InfoCaster.Umbraco.UrlTracker',
        version: '',
      });
    });
  });

  describe('project file contains reference assemlies and PackageRefernce', () => {
    it('should consider only PackageReference for its dependencies', async () => {
      const manifestFileContents = readFileSync(
        `${__dirname}/../fixtures/reference-assemblies-with-package-reference/project.csproj`,
        'utf8',
      );

      const depTree = await buildDepTreeFromProjectFile(manifestFileContents);

      expect(depTree).toEqual({
        dependencies: {
          'MySql.Data': {
            depType: 'prod',
            dependencies: {},
            name: 'MySql.Data',
            version: '8.0.12',
          },
          log4net: {
            depType: 'prod',
            dependencies: {},
            name: 'log4net',
            version: '2.0.8',
          },
        },
        hasDevDependencies: false,
        name: 'InfoCaster.Umbraco.UrlTracker',
        version: '',
      });
    });
  });
});
