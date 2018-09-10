#!/usr/bin/env node_modules/.bin/ts-node
// Shebang is required, and file *has* to be executable: chmod +x file.test.js
// See: https://github.com/tapjs/node-tap/issues/313#issuecomment-250067741
// tslint:disable:max-line-length
// tslint:disable:object-literal-key-quotes
import {test} from 'tap';
import * as fs from 'fs';
import * as _ from 'lodash';
import {buildDepTreeFromFiles} from '../../lib';

const load = (filename) => JSON.parse(
  fs.readFileSync(`${__dirname}/../fixtures/${filename}`, 'utf8'),
);

test('.Net simple project tree generated as expected', async (t) => {
  const includeDev = false;
  const tree = await buildDepTreeFromFiles(
    `${__dirname}/../fixtures/dotnet-simple-project`,
    'packages.config',
    includeDev);
  const expectedTree = load('dotnet-simple-project/expected-tree.json');
  t.deepEqual(tree, expectedTree, 'trees are equal');
});

test('.Net movie-hunter-api tree generated as expected', async (t) => {
  const includeDev = false;
  const tree = await buildDepTreeFromFiles(
    `${__dirname}/../fixtures/dotnet-movie-hunter-api`,
    'packages.config',
    includeDev);
  const expectedTree = load('dotnet-movie-hunter-api/expected-tree.json');
  t.deepEqual(tree, expectedTree, 'trees are equal');
});

test('.Net dotnet-no-packages empty tree generated as expected', async (t) => {
  const includeDev = false;
  const tree = await buildDepTreeFromFiles(
    `${__dirname}/../fixtures/dotnet-no-packages`,
    'packages.config',
    includeDev);
  const expectedTree = load('dotnet-no-packages/expected-tree.json');
  t.deepEqual(tree, expectedTree, 'trees are equal');
});

test('.Net dotnet-empty-manifest returns empty tree', async (t) => {
  const includeDev = false;
  const tree = await buildDepTreeFromFiles(
    `${__dirname}/../fixtures/dotnet-empty-manifest`,
    'packages.config',
    includeDev);
  const expectedTree = load('dotnet-empty-manifest/expected-tree.json');
  t.deepEqual(tree, expectedTree, 'trees are equal');
});

test('.Net dotnet-invalid-manifest throws', async (t) => {
  const includeDev = false;
  t.rejects(buildDepTreeFromFiles(
    `${__dirname}/../fixtures/dotnet-invalid-manifest`,
    'packages.config',
    includeDev),
  );
});

test('.Net core simple project tree generated as expected', async (t) => {
  const includeDev = false;
  const tree = await buildDepTreeFromFiles(
    `${__dirname}/../fixtures/dotnet-core-simple-project`,
    'simple-project.csproj',
    includeDev);
  const expectedTree = load('dotnet-core-simple-project/expected-tree.json');
  t.deepEqual(tree, expectedTree, 'trees are equal');
});
