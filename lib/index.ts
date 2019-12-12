import 'source-map-support/register';
import * as fs from 'fs';
import * as path from 'path';
import * as _ from 'lodash';

import {PkgTree, DepType, parseXmlFile,
  getDependencyTreeFromPackagesConfig, getDependencyTreeFromProjectJson,
  getDependencyTreeFromProjectFile, ProjectJsonManifest,
  getTargetFrameworksFromProjectFile,
  getTargetFrameworksFromProjectConfig,
  getTargetFrameworksFromProjectJson,
  getTargetFrameworksFromProjectAssetsJson,
  getPropertiesMap,
  PropsLookup} from './parsers';

import {
  getDependencyTreeFromProjectAssetsJson,
  ProjectAssetsJsonManifest,
} from './parsers/project-assets-json-parser';
import { InvalidUserInputError } from './errors';

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
  extractProps,
  PkgTree,
  DepType,
};

function buildDepTreeFromProjectJson(manifestFileContents: string, includeDev = false): PkgTree {
  // trimming required to address files with UTF-8 with BOM encoding
  const manifestFile: ProjectJsonManifest = JSON.parse(manifestFileContents.trim());
  return getDependencyTreeFromProjectJson(manifestFile, includeDev);
}

// TODO: Figure out what to do about devDeps
function buildDepTreeFromProjectAssetsJson(manifestFileContents: string, targetFramework?: string): PkgTree {
  if (!targetFramework) {
    throw new Error('Missing targetFramework for project.assets.json');
  }
  // trimming required to address files with UTF-8 with BOM encoding
  const manifestFile: ProjectAssetsJsonManifest = JSON.parse(manifestFileContents.trim());
  return getDependencyTreeFromProjectAssetsJson(manifestFile, targetFramework);
}

async function buildDepTreeFromPackagesConfig(
    manifestFileContents: string,
    includeDev = false): Promise<PkgTree> {
  try {
    const manifestFile: any = await parseXmlFile(manifestFileContents);
    return getDependencyTreeFromPackagesConfig(manifestFile, includeDev);
  } catch (err) {
    if (err.name === 'InvalidUserInputError') {
      throw err;
    }
    throw new Error(`Extracting dependencies failed with error ${err.message}`);
  }
}

async function buildDepTreeFromProjectFile(
    manifestFileContents: string,
    includeDev = false): Promise<PkgTree> {
  try {
    const manifestFile: any = await parseXmlFile(manifestFileContents);
    return getDependencyTreeFromProjectFile(manifestFile, includeDev);
  } catch (err) {
    if (err.name === 'InvalidUserInputError') {
      throw err;
    }
    throw new Error(`Extracting dependencies failed with error ${err.message}`);
  }
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
  const manifestFileExtension = path.extname(manifestFileFullPath);

  if (_.includes(PROJ_FILE_EXTENSIONS, manifestFileExtension)) {
    return buildDepTreeFromProjectFile(manifestFileContents, includeDev);
  } else if (_.endsWith(manifestFilePath, 'packages.config')) {
    return buildDepTreeFromPackagesConfig(manifestFileContents, includeDev);
  } else if (_.endsWith(manifestFilePath, 'project.json')) {
    return buildDepTreeFromProjectJson(manifestFileContents, includeDev);
  } else if (_.endsWith(manifestFilePath, 'project.assets.json')) {
    return buildDepTreeFromProjectAssetsJson(manifestFileContents, targetFramework);
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
    const manifestFile: object = await parseXmlFile(manifestFileContents);
    return getTargetFrameworksFromProjectFile(manifestFile);
  } catch (err) {
    if (err.name === 'InvalidUserInputError') {
      throw err;
    }
    throw new Error(`Extracting target framework failed with error ${err.message}`);
  }
}

async function extractTargetFrameworksFromProjectConfig(
  manifestFileContents: string): Promise<string[]> {
  try {
    const manifestFile: object = await parseXmlFile(manifestFileContents);
    return getTargetFrameworksFromProjectConfig(manifestFile);
  } catch (err) {
    if (err.name === 'InvalidUserInputError') {
      throw err;
    }
    throw new Error(`Extracting target framework failed with error ${err.message}`);
  }
}

async function containsPackageReference(manifestFileContents: string) {
  try {
    const manifestFile: object = await parseXmlFile(manifestFileContents);

    const projectItems = _.get(manifestFile, 'Project.ItemGroup', []);
    const referenceIndex = _.findIndex(projectItems, (itemGroup) => _.has(itemGroup, 'PackageReference'));

    return referenceIndex !== -1;
  } catch (err) {
    if (err.name === 'InvalidUserInputError') {
      throw err;
    }
    throw new Error(`Extracting package reference failed with error ${err.message}`);
  }
}

async function extractTargetFrameworksFromProjectJson(
  manifestFileContents: string): Promise<string[]> {
  let manifestFile;
  try {
    // trimming required to address files with UTF-8 with BOM encoding
    manifestFile = JSON.parse(manifestFileContents.trim());
  } catch (err) {
    throw new InvalidUserInputError(`Failed to parse manifest as valid json: ${err}`);
  }
  return getTargetFrameworksFromProjectJson(manifestFile);
}

async function extractTargetFrameworksFromProjectAssetsJson(
  manifestFileContents: string): Promise<string[]> {
  let manifestFile;
  try {
    // trimming required to address files with UTF-8 with BOM encoding
    manifestFile = JSON.parse(manifestFileContents.trim());
  } catch (err) {
    throw new InvalidUserInputError(`Failed to parse manifest as valid json: ${err}`);
  }
  return getTargetFrameworksFromProjectAssetsJson(manifestFile);
}

async function extractProps(
  propsFileContents: string): Promise<PropsLookup> {
    try {
      const propsFile: object = await parseXmlFile(propsFileContents);

      if (!propsFile) {
        throw new InvalidUserInputError('xml file parsing failed');
      }
      return getPropertiesMap(propsFile);
    } catch (err) {
      if (err.name === 'InvalidUserInputError') {
        throw err;
      }
      throw new Error(`Extracting props failed with error ${err.message}`);
    }
}
