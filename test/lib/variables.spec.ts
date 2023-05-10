import * as fs from 'fs';
import { buildDepTreeFromProjectFile, extractProps } from '../../lib';

/*
 ****** csproj ******
 */
test('.Net C# project with variable is parsed', async () => {
  const manifestFileContents = fs.readFileSync(
    `${__dirname}/../fixtures/dotnet-variables/Steeltoe.Extensions.Configuration.CloudFoundryAutofac.Test.csproj`,
    'utf-8',
  );
  const depTree = await buildDepTreeFromProjectFile(manifestFileContents);
  expect(depTree).toBeTruthy();
  expect(depTree.dependenciesWithUnknownVersions).toBeTruthy();
  expect(depTree.dependenciesWithUnknownVersions!.length).toBe(4);
});

test('.Net C# project with variables is parsed fully when props are read too', async () => {
  const propsFileContents = fs.readFileSync(
    `${__dirname}/../fixtures/dotnet-with-props/Packages.props`,
    'utf-8',
  );
  const manifestFileContents = fs.readFileSync(
    `${__dirname}/../fixtures/dotnet-with-props/example.fsproj`,
    'utf-8',
  );
  const props = await extractProps(propsFileContents);

  const depTree = await buildDepTreeFromProjectFile(
    manifestFileContents,
    false,
    props,
  );
  expect(depTree).toBeTruthy();
  expect(depTree.dependenciesWithUnknownVersions).toBeFalsy();
  expect(depTree.dependencies).toEqual({
    'Microsoft.NET.Test.Sdk': {
      depType: 'prod',
      dependencies: {},
      name: 'Microsoft.NET.Test.Sdk',
      version: '3.3.*',
    },
    'StyleCop.Analyzers': {
      depType: 'prod',
      dependencies: {},
      name: 'StyleCop.Analyzers',
      version: '1.1.0',
    },
    xunit: {
      depType: 'prod',
      dependencies: {},
      name: 'xunit',
      version: '1.2.3',
    },
    'xunit.runner.visualstudio': {
      depType: 'prod',
      dependencies: {},
      name: 'xunit.runner.visualstudio',
      version: '1.1.1-beta*',
    },
  });
});

test('.Net oldstyle project with variable is parsed and versions resolved', async () => {
  const manifestFileContents = fs.readFileSync(
    `${__dirname}/../fixtures/dotnet-no-packagereference/project.csproj`,
    'utf-8',
  );
  const propsFileContents = fs.readFileSync(
    `${__dirname}/../fixtures/dotnet-no-packagereference/Packages.props`,
    'utf-8',
  );
  const props = await extractProps(propsFileContents);
  const depTree = await buildDepTreeFromProjectFile(
    manifestFileContents,
    false,
    props,
  );

  expect(depTree).toBeTruthy();
  expect(depTree.dependencies).toEqual({});
});
