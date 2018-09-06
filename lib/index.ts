import 'source-map-support/register';
import * as fs from 'fs';
import * as path from 'path';
import * as _ from 'lodash';

import {PkgTree, DepType, parseManifestFile, getDependencyTree} from './parsers';

export {
  buildDepTree,
  buildDepTreeFromFiles,
  PkgTree,
  DepType,
};

async function buildDepTree(
    manifestFileContents: string,
    includeDev = false): Promise<PkgTree> {
  const manifestFile: any = parseManifestFile(manifestFileContents);

  if (!manifestFile || !(manifestFile.packages && manifestFile.packages.package)) {
    const depTree: PkgTree = {
      dependencies: {},
      hasDevDependencies: false,
      name: '',
      version: '',
    };
    return depTree;
  }

  return getDependencyTree(manifestFile);
}

function buildDepTreeFromFiles(
  root: string, manifestFilePath: string, includeDev = false) {
  if (!root || !manifestFilePath) {
    throw new Error('Missing required parameters for buildDepTreeFromFiles()');
  }
  if (!manifestFilePath.endsWith('packages.config')) {
    throw new Error(`Unsupported file ${manifestFilePath},
    'Please provide a packages.config file.`);
  }
  const manifestFileFullPath = path.resolve(root, manifestFilePath);
  if (!fs.existsSync(manifestFileFullPath)) {
    throw new Error(`Target file packages.config not found at location: ${manifestFileFullPath}`);
  }

  const manifestFileContents = fs.readFileSync(manifestFileFullPath, 'utf-8');

  return buildDepTree(manifestFileContents, includeDev);
}
