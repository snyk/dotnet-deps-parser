import 'source-map-support/register';
import * as fs from 'fs';
import * as path from 'path';
import * as _ from 'lodash';

import {PkgTree, DepType, ProjectJsonManifest, ProjectAssetsJsonManifest, ManifestFile} from './parsers/types';
import {parseManifestFile} from './parsers';

import {
  getDependencyTreeFromProjectJson,
  getTargetFrameworksFromProjectJson,
} from './parsers/project-json-parser';
import {
  getDependencyTreeFromPackagesConfig,
  getTargetFrameworksFromProjectConfig,
} from './parsers/packages-config-parser';
import {getDependencyTreeFromProjectFile,
  getTargetFrameworksFromProjectFile,
} from './parsers/project-file-parser';
import {
  getDependencyTreeFromProjectAssetsJson,
  getTargetFrameworksFromProjectAssetsJson,
} from './parsers/project-assets-json-parser';

const PROJ_FILE_EXTENSIONS = [
  '.csproj',
  '.vbproj',
  '.fsproj',
];

export {
  buildDepTreeFromPackagesConfig,
  buildDepTreeFromProjectFile,
  buildDepTreeFromProjectJson,
  buildDepTreeFromProjectAssetsJson,
  buildDepTreeFromFiles,
  extractTargetFrameworksFromFiles,
  extractTargetFrameworksFromProjectFile,
  extractTargetFrameworksFromProjectConfig,
  containsPackageReference,
  extractTargetFrameworksFromProjectJson,
  extractTargetFrameworksFromProjectAssetsJson,
  PkgTree,
  DepType,
};

function buildDepTreeFromProjectJson(manifestFile: ManifestFile, includeDev = false): PkgTree {
  // trimming required to address files with UTF-8 with BOM encoding
  const manifestFileContents: ProjectJsonManifest = JSON.parse(manifestFile.content.trim());
  return getDependencyTreeFromProjectJson(manifestFileContents, includeDev);
}

// TODO: Figure out what to do about devDeps
function buildDepTreeFromProjectAssetsJson(manifestFile: ManifestFile, targetFramework?: string): PkgTree {
  if (!targetFramework) {
    throw new Error('Missing targetFramework for project.assets.json');
  }
  // trimming required to address files with UTF-8 with BOM encoding
  const manifestFileContents: ProjectAssetsJsonManifest = JSON.parse(manifestFile.content.trim());
  return getDependencyTreeFromProjectAssetsJson(manifestFileContents, targetFramework);
}

async function buildDepTreeFromPackagesConfig(
    manifestFile: ManifestFile,
    includeDev = false): Promise<PkgTree> {
  const manifestFileContents: any = await parseManifestFile(manifestFile.content);
  return getDependencyTreeFromPackagesConfig(manifestFileContents, includeDev);
}

async function buildDepTreeFromProjectFile(
    manifestFile: ManifestFile,
    includeDev = false): Promise<PkgTree> {
  manifestFile.content = await parseManifestFile(manifestFile.content);
  return getDependencyTreeFromProjectFile(manifestFile, includeDev);
}

function buildDepTreeFromFiles(
  root: string, manifestFilePath: string, includeDev = false, targetFramework?: string) {
  if (!root || !manifestFilePath) {
    throw new Error('Missing required parameters for buildDepTreeFromFiles()');
  }

  const manifestFileFullPath = path.resolve(root, manifestFilePath);

  if (!fs.existsSync(manifestFileFullPath)) {
    throw new Error('No packages.config, project.json or project file found at ' +
      `location: ${manifestFileFullPath}`);
  }

  const manifestFileContents = fs.readFileSync(manifestFileFullPath, 'utf-8');
  const manifestFile: ManifestFile = {
    content: manifestFileContents,
    path: manifestFileFullPath,
  };
  const manifestFileExtension = path.extname(manifestFileFullPath);

  if (_.includes(PROJ_FILE_EXTENSIONS, manifestFileExtension)) {
    return buildDepTreeFromProjectFile(manifestFile, includeDev);
  } else if (_.endsWith(manifestFilePath, 'packages.config')) {
    return buildDepTreeFromPackagesConfig(manifestFile, includeDev);
  } else if (_.endsWith(manifestFilePath, 'project.json')) {
    return buildDepTreeFromProjectJson(manifestFile, includeDev);
  } else if (_.endsWith(manifestFilePath, 'project.assets.json')) {
    return buildDepTreeFromProjectAssetsJson(manifestFile, targetFramework);
  } else {
    throw new Error(`Unsupported file ${manifestFilePath}, Please provide ` +
      'either packages.config or project file.');
  }
}

function extractTargetFrameworksFromFiles(
  root: string, manifestFilePath: string, includeDev = false) {
  if (!root || !manifestFilePath) {
    throw new Error('Missing required parameters for extractTargetFrameworksFromFiles()');
  }

  const manifestFileFullPath = path.resolve(root, manifestFilePath);

  if (!fs.existsSync(manifestFileFullPath)) {
    throw new Error('No project file found at ' +
      `location: ${manifestFileFullPath}`);
  }

  const manifestFileContents = fs.readFileSync(manifestFileFullPath, 'utf-8');
  const manifestFileExtension = path.extname(manifestFileFullPath);

  if (_.includes(PROJ_FILE_EXTENSIONS, manifestFileExtension)) {
    return extractTargetFrameworksFromProjectFile(manifestFileContents);
  } else if (_.endsWith(manifestFilePath, 'packages.config')) {
    return extractTargetFrameworksFromProjectConfig(manifestFileContents);
  } else if (_.endsWith(manifestFilePath, 'project.json')) {
    return extractTargetFrameworksFromProjectJson(manifestFileContents);
  } else if (_.endsWith(manifestFilePath, 'project.assets.json')) {
    return extractTargetFrameworksFromProjectAssetsJson(manifestFileContents);
  } else {
    throw new Error(`Unsupported file ${manifestFilePath}, Please provide ` +
      'a project *.csproj, *.vbproj, *.fsproj or packages.config file.');
  }
}

async function extractTargetFrameworksFromProjectFile(
  manifestFileContents: string): Promise<string[]> {
  try {
    const manifestFile: any = await parseManifestFile(manifestFileContents);
    return getTargetFrameworksFromProjectFile(manifestFile);
  } catch (err) {
    throw new Error(`Extracting target framework failed with error ${err.message}`);
  }
}

async function extractTargetFrameworksFromProjectConfig(
  manifestFileContents: string): Promise<string[]> {
  try {
    const manifestFile: any = await parseManifestFile(manifestFileContents);
    return getTargetFrameworksFromProjectConfig(manifestFile);
  } catch (err) {
    throw new Error(`Extracting target framework failed with error ${err.message}`);
  }
}

async function containsPackageReference(manifestFileContents: string) {

  const manifestFile: any = await parseManifestFile(manifestFileContents);

  const projectItems = _.get(manifestFile, 'Project.ItemGroup', []);
  const referenceIndex = _.findIndex(projectItems, (itemGroup) => _.has(itemGroup, 'PackageReference'));

  return referenceIndex !== -1;
}

async function extractTargetFrameworksFromProjectJson(
  manifestFileContents: string): Promise<string[]> {
  try {
    // trimming required to address files with UTF-8 with BOM encoding
    const manifestFile = JSON.parse(manifestFileContents.trim());
    return getTargetFrameworksFromProjectJson(manifestFile);
  } catch (err) {
    throw new Error(`Extracting target framework failed with error ${err.message}`);
  }
}

async function extractTargetFrameworksFromProjectAssetsJson(
  manifestFileContents: string): Promise<string[]> {
    try {
      // trimming required to address files with UTF-8 with BOM encoding
      const manifestFile = JSON.parse(manifestFileContents.trim());
      return getTargetFrameworksFromProjectAssetsJson(manifestFile);
    } catch (err) {
      throw new Error(`Extracting target framework failed with error ${err.message}`);
    }
}
