import 'source-map-support/register';
import * as fs from 'fs';
import * as path from 'path';
import * as _ from 'lodash';

import {PkgTree, DepType, parseManifestFile,
  getDependencyTreeFromPackagesConfig, getDependencyTreeFromCsproj} from './parsers';

export {
  buildDepTreeFromPackagesConfig,
  buildDepTreeFromCsproj,
  buildDepTreeFromFiles,
  PkgTree,
  DepType,
};

async function buildDepTreeFromPackagesConfig(
    manifestFileContents: string,
    includeDev = false): Promise<PkgTree> {
  try {
    const manifestFile: any = await parseManifestFile(manifestFileContents);
    return getDependencyTreeFromPackagesConfig(manifestFile, includeDev);
  } catch (err) {
    throw new Error(`Building dependency tree failed with error: ${err.message}`);
  }
}

async function buildDepTreeFromCsproj(
    manifestFileContents: string,
    includeDev = false): Promise<PkgTree> {
  try {
    const manifestFile: any = await parseManifestFile(manifestFileContents);
    return getDependencyTreeFromCsproj(manifestFile, includeDev);
  } catch (err) {
    throw new Error(`Building dependency tree failed with error ${err.message}`);
  }
}

function buildDepTreeFromFiles(
  root: string, manifestFilePath: string, includeDev = false) {
  if (!root || !manifestFilePath) {
    throw new Error('Missing required parameters for buildDepTreeFromFiles()');
  }

  const manifestFileFullPath = path.resolve(root, manifestFilePath);
  if (!fs.existsSync(manifestFileFullPath)) {
    throw new Error(`Neither packages.config nor .csproj file found at location: ${manifestFileFullPath}`);
  }

  const manifestFileContents = fs.readFileSync(manifestFileFullPath, 'utf-8');

  if (manifestFilePath.endsWith('.csproj')) {
    return buildDepTreeFromCsproj(manifestFileContents, includeDev);
  } else if (manifestFilePath.endsWith('packages.config')) {
    return buildDepTreeFromPackagesConfig(manifestFileContents, includeDev);
  } else {
    throw new Error(`Unsupported file ${manifestFilePath},
    'Please provide either packages.config or .csproj file.`);
  }
}
