import { readFileSync } from 'fs';
import { buildDepTreeFromProjectFile } from '../../lib';

describe('buildDepTreeFromProjectFile', () => {
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
