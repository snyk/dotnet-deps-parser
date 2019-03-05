#!/usr/bin/env node_modules/.bin/ts-node
// Shebang is required, and file *has* to be executable: chmod +x file.test.js
// See: https://github.com/tapjs/node-tap/issues/313#issuecomment-250067741
// tslint:disable:max-line-length
// tslint:disable:object-literal-key-quotes
import { test } from 'tap';
import * as fs from 'fs';
import { buildDepTreeFromProjectFile } from '../../lib';

/*
****** csproj ******
*/
test('.Net C# project with variable is parsed', async (t) => {
  const manifestFileContents = fs.readFileSync(`${__dirname}/../fixtures/dotnet-variables/Steeltoe.Extensions.Configuration.CloudFoundryAutofac.Test.csproj`, 'utf-8');
  const depTree = await buildDepTreeFromProjectFile(manifestFileContents);
  t.ok(depTree);
  t.ok(depTree.dependenciesWithUnknownVersions);
  t.equal(depTree.dependenciesWithUnknownVersions!.length, 4);
});

