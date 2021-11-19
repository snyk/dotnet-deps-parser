// tslint:disable:max-line-length
// tslint:disable:object-literal-key-quotes
import { test } from 'tap';
import * as fs from 'fs';
import { buildDepTreeFromProjectFile, extractProps } from '../../lib';

/*
 ****** csproj ******
 */
test('.Net C# project with variable is parsed', async (t) => {
  const manifestFileContents = fs.readFileSync(
    `${__dirname}/../fixtures/dotnet-variables/Steeltoe.Extensions.Configuration.CloudFoundryAutofac.Test.csproj`,
    'utf-8',
  );
  const depTree = await buildDepTreeFromProjectFile(manifestFileContents);
  t.ok(depTree);
  t.ok(depTree.dependenciesWithUnknownVersions);
  t.equal(depTree.dependenciesWithUnknownVersions!.length, 4);
});

test('.Net C# project with variables is parsed fully when props are read too', async (t) => {
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
  t.ok(depTree);
  t.notOk(depTree.dependenciesWithUnknownVersions);
  t.deepEqual(
    depTree.dependencies,
    {
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
    },
    'depTree as expected full resolved',
  );
});

test('.Net oldstyle project with variable is parsed and versions resolved', async (t) => {
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

  t.ok(depTree);
  t.equal(
    depTree.dependenciesWithUnknownVersions!.length,
    7,
    '7 deps with no versions specified',
  );
  t.deepEqual(
    depTree.dependencies,
    {
      'Newtonsoft.Json': {
        depType: 'prod',
        dependencies: {},
        name: 'Newtonsoft.Json',
        version: '10.0.0.0',
      },
      Orleans: {
        depType: 'prod',
        dependencies: {},
        name: 'Orleans',
        version: '1.4.0.0',
      },
      'System.Console': {
        depType: 'prod',
        dependencies: {},
        name: 'System.Console',
        version: '4.0.0.0',
      },
      'nunit.framework': {
        depType: 'prod',
        dependencies: {},
        name: 'nunit.framework',
        version: '3.8.1.0',
      },
    },
    'deps resolved',
  );
});
