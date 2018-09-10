import 'source-map-support/register';
import * as fs from 'fs';
import * as path from 'path';
import * as _ from 'lodash';

import {PkgTree, DepType, parseManifestFile,
  getDependencyTreeFromPackagesConfig, getDependencyTreeFromPackageReference} from './parsers';

export {
  buildDepTree,
  buildDepTreeFromFiles,
  PkgTree,
  DepType,
};

async function buildDepTree(
    manifestFileContents: string,
    includeDev = false, originalFileName = 'packages.config'): Promise<PkgTree> {
  try {
    const manifestFile: any = await parseManifestFile(manifestFileContents);

    if (originalFileName === 'packages.config') {
      return getDependencyTreeFromPackagesConfig(manifestFile, includeDev);
    }

    if (originalFileName.endsWith('.csproj')) {
      return getDependencyTreeFromPackageReference(manifestFile, includeDev);
    }

    throw new Error(`Unsupported file ${originalFileName},
      'Please provide either packages.config or .csproj file.`);
  } catch (err) {
    throw err;
  }
}

function buildDepTreeFromFiles(
  root: string, manifestFilePath: string, includeDev = false) {
  if (!root || !manifestFilePath) {
    throw new Error('Missing required parameters for buildDepTreeFromFiles()');
  }
  const supportedFiles = /(.*packages\.config)|(.*\.csproj)/;
  if (!supportedFiles.test(manifestFilePath)) {
    throw new Error(`Unsupported file ${manifestFilePath},
    'Please provide either packages.config or .csproj file.`);
  }
  const manifestFileFullPath = path.resolve(root, manifestFilePath);
  if (!fs.existsSync(manifestFileFullPath)) {
    throw new Error(`Neither packages.config nor .csproj file found at location: ${manifestFileFullPath}`);
  }

  const manifestFileContents = fs.readFileSync(manifestFileFullPath, 'utf-8');

  return buildDepTree(manifestFileContents, includeDev, manifestFilePath);
}
