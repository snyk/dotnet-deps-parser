#!/usr/bin/env node_modules/.bin/ts-node
// Shebang is required, and file *has* to be executable: chmod +x file.test.js
// See: https://github.com/tapjs/node-tap/issues/313#issuecomment-250067741
// tslint:disable:max-line-length
// tslint:disable:object-literal-key-quotes
import {test} from 'tap';
import * as fs from 'fs';
import {extractTargetFrameworksFromFiles} from '../../lib';

const load = (filename) => JSON.parse(
  fs.readFileSync(`${__dirname}/../fixtures/${filename}`, 'utf8'),
);

test('.Net Visual Basic project target framework extracted as expected', async (t) => {
    const targetFrameworks = await extractTargetFrameworksFromFiles(
        `${__dirname}/../fixtures/dotnet-vb-simple-project`,
        'manifest.vbproj');
    t.deepEqual(targetFrameworks, ['.NETFramework,Version=v4.6.1'], 'targetFramework array is as expected');
});

test('.Net F# project target framework extracted as expected', async (t) => {
  const targetFrameworks = await extractTargetFrameworksFromFiles(
    `${__dirname}/../fixtures/dotnet-fs-simple-project`,
    'manifest.fsproj');
  t.deepEqual(targetFrameworks, ['netcoreapp2.1'], 'targetFramework array is as expected');
});

/*
****** csproj ******
*/

test('.Net .csproj simple project target framework extracted as expected', async (t) => {
  const targetFrameworks = await extractTargetFrameworksFromFiles(
    `${__dirname}/../fixtures/dotnet-core-simple-project`,
    'simple-project.csproj');
  t.deepEqual(targetFrameworks, ['netcoreapp1.1', 'netcoreapp1.2'], 'targetFramework array is as expected');
});

test('.Net .csproj dotnet-empty-manifest target framework extracted', async (t) => {
  const targetFrameworks = await extractTargetFrameworksFromFiles(
    `${__dirname}/../fixtures/dotnet-empty-manifest`,
    'empty-manifest.csproj');
  t.deepEqual(targetFrameworks, [], 'targetFramework array is as expected');
});

/*
****** fsproj ******
*/

test('.Net .fsproj simple project target framework extracted as expected', async (t) => {
  const targetFrameworks = await extractTargetFrameworksFromFiles(
    `${__dirname}/../fixtures/dotnet-fs-simple-project`,
    'manifest.fsproj');
  t.deepEqual(targetFrameworks, ['netcoreapp2.1'], 'targetFramework array is as expected');
});

/*
****** packages.config ******
*/

test('.Net packages.config single target framework extracted as expected', async (t) => {
  const targetFrameworks = await extractTargetFrameworksFromFiles(
    `${__dirname}/../fixtures/dotnet-simple-project`,
    'packages.config');
  t.deepEqual(targetFrameworks, ['net46'], 'targetFramework array is as expected');
});

test('.Net packages.config multiple target frameworks extracted as expected', async (t) => {
  const targetFrameworks = await extractTargetFrameworksFromFiles(
    `${__dirname}/../fixtures/dotnet-multiple-target-frameworks`,
    'packages.config');
  t.deepEqual(targetFrameworks, ['net46', 'net451'], 'targetFramework array is as expected');
});

test('.Net packages.config dotnet-empty-manifest target framework extracted', async (t) => {
  const targetFrameworks = await extractTargetFrameworksFromFiles(
    `${__dirname}/../fixtures/dotnet-empty-manifest`,
    'packages.config');
  t.deepEqual(targetFrameworks, [], 'targetFramework array is as expected');
});

/*
****** project.json ******
*/

test('.Net project.json single target framework extracted as expected', async (t) => {
  const targetFrameworks = await extractTargetFrameworksFromFiles(
    `${__dirname}/../fixtures/dotnet-project-json`,
    'standard-project.json');
  t.deepEqual(targetFrameworks, ['netcoreapp1.0'], 'targetFramework array is as expected');
});

test('.Net project.json multiple target frameworks extracted as expected', async (t) => {
  const targetFrameworks = await extractTargetFrameworksFromFiles(
    `${__dirname}/../fixtures/dotnet-project-json`,
    'utf-8-with-bom-project.json');
  t.deepEqual(targetFrameworks, ['netcoreapp1.0', 'net451'], 'targetFramework array is as expected');
});

/*
****** project.assets.json ******
*/

test('.Net project.assets.json single target framework extracted as expected', async (t) => {
  const targetFrameworks = await extractTargetFrameworksFromFiles(
    `${__dirname}/../fixtures/dotnet-project-assets`,
    'project.assets.json');
  t.deepEqual(targetFrameworks, ['.NETCoreApp,Version=v2.0'], 'targetFramework array is as expected');
});

test('.Net project.assets.json multiple target frameworks extracted as expected', async (t) => {
  const targetFrameworks = await extractTargetFrameworksFromFiles(
    `${__dirname}/../fixtures/dotnet-project-assets-multiple-target-frameworks`,
    'project.assets.json');
  t.deepEqual(targetFrameworks, ['.NETCoreApp,Version=v1.0', '.NETCoreApp,Version=v2.2'], 'targetFramework array is as expected');
});

test('.Net project.assets.json dotnet-empty-project-assets target framework extracted', async (t) => {
  const targetFrameworks = await extractTargetFrameworksFromFiles(
    `${__dirname}/../fixtures/dotnet-empty-project-assets`,
    'project.assets.json');
  t.deepEqual(targetFrameworks, [], 'targetFramework array is as expected');
});

test('.Net project.assest.json is not valid json', async (t) => {
  try {
    const targetFrameworks = await extractTargetFrameworksFromFiles(
      `${__dirname}/../fixtures/dotnet-invalid-project-assets`,
      'project.assets.json');
    t.fail(targetFrameworks, 'Should throw an error for failing to extract the target framework');
  } catch (err) {
    t.match(err.message, 'Extracting target framework failed with error', 'Correct error message');
  }
});
