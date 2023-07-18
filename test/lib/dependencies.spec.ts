import * as fs from 'fs';
import { buildDepTreeFromFiles, buildDepTreeFromProjectFile } from '../../lib';
import { getDependencyTreeFromProjectAssetsJson } from '../../lib/parsers/project-assets-json-parser';
import { OpenSourceEcosystems } from '@snyk/error-catalog-nodejs-public';

const load = (filename) =>
  JSON.parse(fs.readFileSync(`${__dirname}/../fixtures/${filename}`, 'utf8'));

test('.Net Visual Basic project tree generated as expected', async () => {
  const tree = await buildDepTreeFromFiles(
    `${__dirname}/../fixtures/dotnet-vb-simple-project`,
    'manifest.vbproj',
    false,
  );
  const expectedTree = load('dotnet-vb-simple-project/expected-tree.json');
  expect(tree).toEqual(expectedTree);
});

test('.Net Visual Basic project tree generated as expected', async () => {
  const tree = await buildDepTreeFromFiles(
    `${__dirname}/../fixtures/old-and-new-package-format-proj`,
    'project.csproj',
    false,
  );
  expect(tree.dependencies['Microsoft.Azure.WebJobs.ServiceBus'].version).toBe(
    '2.2.0',
  );
});

test('.Net F# project tree generated as expected', async () => {
  const tree = await buildDepTreeFromFiles(
    `${__dirname}/../fixtures/dotnet-fs-simple-project`,
    'manifest.fsproj',
    false,
  );
  const expectedTree = load('dotnet-fs-simple-project/expected-tree.json');
  expect(tree).toEqual(expectedTree);
});

test('.Net F# project dependencies with PackageReference Update is skipped', async () => {
  const tree = await buildDepTreeFromFiles(
    `${__dirname}/../fixtures/dotnet-fs-package-reference-update`,
    'example.fsproj',
    false,
  );
  const expectedTree = load(
    'dotnet-fs-package-reference-update/expected-tree.json',
  );
  expect(expectedTree).toEqual(tree);
});

test('.Net simple project tree generated as expected', async () => {
  const includeDev = false;
  const tree = await buildDepTreeFromFiles(
    `${__dirname}/../fixtures/dotnet-simple-project`,
    'packages.config',
    includeDev,
  );
  const expectedTree = load('dotnet-simple-project/expected-tree.json');
  expect(tree).toEqual(expectedTree);
});

test('.Net movie-hunter-api tree generated as expected', async () => {
  const includeDev = false;
  const tree = await buildDepTreeFromFiles(
    `${__dirname}/../fixtures/dotnet-movie-hunter-api`,
    'packages.config',
    includeDev,
  );
  const expectedTree = load('dotnet-movie-hunter-api/expected-tree.json');
  expect(tree).toEqual(expectedTree);
});

test('.Net dotnet-no-packages empty tree generated as expected', async () => {
  const includeDev = false;
  const tree = await buildDepTreeFromFiles(
    `${__dirname}/../fixtures/dotnet-no-packages`,
    'packages.config',
    includeDev,
  );
  const expectedTree = load('dotnet-no-packages/expected-tree.json');
  expect(tree).toEqual(expectedTree);
});

test('.Net dotnet-empty-manifest returns empty tree', async () => {
  const includeDev = false;
  const tree = await buildDepTreeFromFiles(
    `${__dirname}/../fixtures/dotnet-empty-manifest`,
    'packages.config',
    includeDev,
  );
  const expectedTree = load('dotnet-empty-manifest/expected-tree.json');
  expect(tree).toEqual(expectedTree);
});

test('.Net dotnet-invalid-manifest throws', async () => {
  const unparsableManifestError =
    new OpenSourceEcosystems.UnparseableManifestError(
      'Manifest xml file parsing failed',
    );

  const includeDev = false;
  expect(
    buildDepTreeFromFiles(
      `${__dirname}/../fixtures/dotnet-invalid-manifest`,
      'packages.config',
      includeDev,
    ),
  ).rejects.toStrictEqual(unparsableManifestError);
});

test('.Net dotnet-simple-project-with-devDeps tree generated as expected', async () => {
  const includeDev = false;
  const tree = await buildDepTreeFromFiles(
    `${__dirname}/../fixtures/dotnet-simple-project-with-devDeps`,
    'packages.config',
    includeDev,
  );
  const expectedTree = load(
    'dotnet-simple-project-with-devDeps/expected-tree-without-dev.json',
  );
  expect(tree).toEqual(expectedTree);
});

test('.Net dotnet-simple-project-with-devDeps tree generated as expected', async () => {
  const includeDev = true;
  const tree = await buildDepTreeFromFiles(
    `${__dirname}/../fixtures/dotnet-simple-project-with-devDeps`,
    'packages.config',
    includeDev,
  );
  const expectedTree = load(
    'dotnet-simple-project-with-devDeps/expected-tree.json',
  );
  expect(tree).toEqual(expectedTree);
});

test('.Net packages.config with multiple target frameworks tree generated as expected', async () => {
  const includeDev = false;
  const tree = await buildDepTreeFromFiles(
    `${__dirname}/../fixtures/dotnet-multiple-target-frameworks`,
    'packages.config',
    includeDev,
  );
  const expectedTree = load(
    'dotnet-multiple-target-frameworks/expected-tree-net46.json',
  );
  expect(tree).toEqual(expectedTree);
});

/*
 ****** csproj ******
 */

test('.Net .csproj simple project tree generated as expected', async () => {
  const includeDev = false;
  const tree = await buildDepTreeFromFiles(
    `${__dirname}/../fixtures/dotnet-core-simple-project`,
    'simple-project.csproj',
    includeDev,
  );
  const expectedTree = load('dotnet-core-simple-project/expected-tree.json');
  expect(tree).toEqual(expectedTree);
});

test('.Net .csproj simple project tree generated as expected for variable package versions', async () => {
  const includeDev = false;
  const tree = await buildDepTreeFromFiles(
    `${__dirname}/../fixtures/dotnet-core-variable-version`,
    'manifest.csproj',
    includeDev,
  );
  const expectedTree = load('dotnet-core-variable-version/expected-tree.json');
  expect(tree).toEqual(expectedTree);
});

test('.Net .csproj dotnet-no-packages empty tree generated as expected', async () => {
  const includeDev = false;
  const tree = await buildDepTreeFromFiles(
    `${__dirname}/../fixtures/dotnet-no-packages`,
    'no-packages.csproj',
    includeDev,
  );
  const expectedTree = load('dotnet-no-packages/expected-tree.json');
  expect(tree).toEqual(expectedTree);
});

test('.Net .csproj dotnet-empty-manifest returns empty tree', async () => {
  const includeDev = false;
  const tree = await buildDepTreeFromFiles(
    `${__dirname}/../fixtures/dotnet-empty-manifest`,
    'empty-manifest.csproj',
    includeDev,
  );
  const expectedTree = load('dotnet-empty-manifest/expected-tree.json');
  expect(tree).toEqual(expectedTree);
});

test('.Net .csproj core dotnet-invalid-manifest throws', async () => {
  const unparsableManifestError =
    new OpenSourceEcosystems.UnparseableManifestError(
      'Manifest xml file parsing failed',
    );

  const includeDev = false;
  expect(
    buildDepTreeFromFiles(
      `${__dirname}/../fixtures/dotnet-invalid-manifest`,
      'invalid.csproj',
      includeDev,
    ),
  ).rejects.toStrictEqual(unparsableManifestError);
});

test('.Net dotnet-simple-project-with-devDeps with includeDev=false tree generated as expected', async () => {
  const includeDev = false;
  const tree = await buildDepTreeFromFiles(
    `${__dirname}/../fixtures/dotnet-simple-project-with-devDeps`,
    'simple-project-with-dev.csproj',
    includeDev,
  );
  const expectedTree = load(
    'dotnet-simple-project-with-devDeps/expected-tree-from-csproj-without-dev.json',
  );
  expect(tree).toEqual(expectedTree);
});

test('.Net dotnet-simple-project-with-devDeps tree generated as expected', async () => {
  const includeDev = true;
  const tree = await buildDepTreeFromFiles(
    `${__dirname}/../fixtures/dotnet-simple-project-with-devDeps`,
    'simple-project-with-dev.csproj',
    includeDev,
  );
  const expectedTree = load(
    'dotnet-simple-project-with-devDeps/expected-tree-from-csproj.json',
  );
  expect(tree).toEqual(expectedTree);
});

test('.Net .csproj with conditional framework dependencies project tree generated as expected', async () => {
  const includeDev = false;
  const tree = await buildDepTreeFromFiles(
    `${__dirname}/../fixtures/dotnet-conditional-frameworks`,
    'conditional-frameworks.csproj',
    includeDev,
  );
  const expectedTree = load('dotnet-conditional-frameworks/expected-tree.json');
  expect(tree).toEqual(expectedTree);
});

/*
 ****** project.json ******
 */

test('.Net project.json standard project tree generated as expected', async () => {
  const includeDev = true;
  const tree = await buildDepTreeFromFiles(
    `${__dirname}/../fixtures/dotnet-project-json`,
    'standard-project.json',
    includeDev,
  );
  const expectedTree = load('dotnet-project-json/expected-tree.json');
  expect(tree).toEqual(expectedTree);
});

test('.Net project.json utf-8 with BOM project tree generated as expected', async () => {
  const includeDev = true;
  const tree = await buildDepTreeFromFiles(
    `${__dirname}/../fixtures/dotnet-project-json`,
    'utf-8-with-bom-project.json',
    includeDev,
  );
  const expectedTree = load('dotnet-project-json/expected-tree.json');
  expect(tree).toEqual(expectedTree);
});

test('.Net project.json with no packages empty tree generated as expected', async () => {
  const includeDev = false;
  const tree = await buildDepTreeFromFiles(
    `${__dirname}/../fixtures/dotnet-no-packages`,
    'no-packages-project.json',
    includeDev,
  );
  const expectedTree = load('dotnet-no-packages/expected-tree.json');
  expect(tree).toEqual(expectedTree);
});

/*
 ****** project.assets.json ******
 */

test('getDependencyTreeFromProjectAssetsJson yields one pkgtree for single target framework with one dependency', async () => {
  const projectAssetsJson = {
    project: {
      restore: {
        projectName: 'sample2',
      },
      version: '1.0.0',
    },
    targets: {
      '.NETsomeversion': {
        'Microsoft.NETSomething.Dep/2.2.0': {
          type: 'package',
        },
      },
    },
  };
  const tree = getDependencyTreeFromProjectAssetsJson(
    projectAssetsJson,
    '.NETsomeversion',
  );
  const expectedTree = {
    dependencies: {
      'Microsoft.NETSomething.Dep': {
        dependencies: {},
        name: 'Microsoft.NETSomething.Dep',
        version: '2.2.0',
      },
    },
    name: 'sample2',
    version: '1.0.0',
  };
  expect(tree).toEqual(expectedTree);
});

test('getDependencyTreeFromProjectAssetsJson yields one pkgtree for single target framework with multiple dependencies', async () => {
  const projectAssetsJson = {
    project: {
      restore: {
        projectName: 'sample2',
      },
      version: '1.0.0',
    },
    targets: {
      '.NETsomeversion': {
        'Microsoft.NETSomething.Dep/2.2.0': {
          type: 'package',
        },
        'Microsoft.NETblah.Dep/2.2.0': {
          type: 'package',
        },
      },
    },
  };
  const tree = getDependencyTreeFromProjectAssetsJson(
    projectAssetsJson,
    '.NETsomeversion',
  );
  const expectedTree = {
    dependencies: {
      'Microsoft.NETSomething.Dep': {
        dependencies: {},
        name: 'Microsoft.NETSomething.Dep',
        version: '2.2.0',
      },
      'Microsoft.NETblah.Dep': {
        dependencies: {},
        name: 'Microsoft.NETblah.Dep',
        version: '2.2.0',
      },
    },
    name: 'sample2',
    version: '1.0.0',
  };
  expect(tree).toEqual(expectedTree);
});

test('getDependencyTreeFromProjectAssetsJson yields one pkgtree for single target framework for one dependency with transitive dependencies', async () => {
  const projectAssetsJson = {
    project: {
      restore: {
        projectName: 'sample2',
      },
      version: '1.0.0',
    },
    targets: {
      '.NETsomeversion': {
        'Microsoft.NETSomething.Dep/2.2.0': {
          dependencies: {
            'System.Blah': '4.0.0',
            'System.BlahOne': '4.1.0',
            'System.BlahTwo': '4.2.0',
          },
          type: 'package',
        },
      },
    },
  };
  const tree = getDependencyTreeFromProjectAssetsJson(
    projectAssetsJson,
    '.NETsomeversion',
  );
  const expectedTree = {
    dependencies: {
      'Microsoft.NETSomething.Dep': {
        dependencies: {
          'System.Blah': {
            dependencies: {},
            name: 'System.Blah',
            version: '4.0.0',
          },
          'System.BlahOne': {
            dependencies: {},
            name: 'System.BlahOne',
            version: '4.1.0',
          },
          'System.BlahTwo': {
            dependencies: {},
            name: 'System.BlahTwo',
            version: '4.2.0',
          },
        },
        name: 'Microsoft.NETSomething.Dep',
        version: '2.2.0',
      },
    },
    name: 'sample2',
    version: '1.0.0',
  };
  expect(tree).toEqual(expectedTree);
});

test('.Net project.assets.json single target framework tree generated as expected', async () => {
  const includeDev = false;
  const tree = await buildDepTreeFromFiles(
    `${__dirname}/../fixtures/dotnet-project-assets-for-deps`,
    'project.assets.json',
    includeDev,
    '.NETCoreApp,Version=v2.2',
  );
  const expectedTree = load(
    'dotnet-project-assets-for-deps/expected-tree.json',
  );
  expect(tree).toEqual(expectedTree);
});

test('.Net oldstyle project with variable is parsed and unknown skipped', async () => {
  const manifestFileContents = fs.readFileSync(
    `${__dirname}/../fixtures/dotnet-no-packagereference/project.csproj`,
    'utf-8',
  );
  const depTree = await buildDepTreeFromProjectFile(manifestFileContents);

  expect(depTree).toBeTruthy();
  expect(depTree.dependencies).toEqual({});
});
