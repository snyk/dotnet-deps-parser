import 'source-map-support/register';
import * as fs from 'fs';
import * as path from 'path';
import * as _ from 'lodash';

import {PkgTree, DepType, parseManifestFile,
  getDependencyTreeFromPackagesConfig, getDependencyTreeFromProjectJson,
  getDependencyTreeFromProjectFile, ProjectJsonManifest} from './parsers';

const PROJ_FILE_EXTENSION = [
  '.csproj',
  '.vbproj',
  '.fsproj',
];

export {
  buildDepTreeFromPackagesConfig,
  buildDepTreeFromProjectFile,
  buildDepTreeFromProjectJson,
  buildDepTreeFromFiles,
  PkgTree,
  DepType,
};

function buildDepTreeFromProjectJson(manifestFileContents: string, includeDev = false): PkgTree {
  try {
    // trimming required to address files with UTF-8 with BOM encoding
    const manifestFile: ProjectJsonManifest = JSON.parse(manifestFileContents.trim());
    return getDependencyTreeFromProjectJson(manifestFile, includeDev);
  } catch (err) {
    throw new Error(`Building dependency tree failed with error: ${err.message}`);
  }
}

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

async function buildDepTreeFromProjectFile(
    manifestFileContents: string,
    includeDev = false): Promise<PkgTree> {
  try {
    const manifestFile: any = await parseManifestFile(manifestFileContents);
    return getDependencyTreeFromProjectFile(manifestFile, includeDev);
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
    throw new Error('Neither packages.config nor project file found at ' +
      `location: ${manifestFileFullPath}`);
  }

  const manifestFileContents = fs.readFileSync(manifestFileFullPath, 'utf-8');
  const manifestFileExtension = path.extname(manifestFileFullPath);

  if (_.includes(PROJ_FILE_EXTENSION, manifestFileExtension)) {
    return buildDepTreeFromProjectFile(manifestFileContents, includeDev);
  } else if (_.endsWith(manifestFilePath, 'packages.config')) {
    return buildDepTreeFromPackagesConfig(manifestFileContents, includeDev);
  } else if (_.endsWith(manifestFilePath, 'project.json')) {
    return buildDepTreeFromProjectJson(manifestFileContents, includeDev);
  } else {
    throw new Error(`Unsupported file ${manifestFilePath}, Please provide ` +
      'either packages.config or project file.');
  }
}
