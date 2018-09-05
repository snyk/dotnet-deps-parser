import 'source-map-support/register';
import * as fs from 'fs';
import * as path from 'path';
import {PkgTree, DepType} from './parsers';

export {
  buildDepTree,
  buildDepTreeFromFiles,
  PkgTree,
  DepType,
};

async function buildDepTree(): Promise<PkgTree> {
  // TODO
  const depTree: PkgTree = {
    dependencies: {},
    hasDevDependencies: false,
    name: '',
    version: '',
  };
  return depTree;
}

async function buildDepTreeFromFiles(
  root: string, manifestFilePaths: string [], includeDev = false): Promise<PkgTree> {
  if (!root || !manifestFilePaths) {
    throw new Error('Missing required parameters for buildDepTreeFromFiles()');
  }
  // TODO

  return await buildDepTree();
}
