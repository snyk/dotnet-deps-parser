import 'source-map-support/register';
import * as fs from 'fs';
import * as path from 'path';
import { OpenSourceEcosystems } from '@snyk/error-catalog-nodejs-public';

import {
  DepType,
  getDependencyTreeFromPackagesConfig,
  getDependencyTreeFromProjectFile,
  getDependencyTreeFromProjectJson,
  getPropertiesMap,
  getTargetFrameworksFromProjectAssetsJson,
  getTargetFrameworksFromProjectConfig,
  getTargetFrameworksFromProjectFile,
  getTargetFrameworksFromProjectJson,
  parseXmlFile,
  PkgTree,
  ProjectJsonManifest,
  PropsLookup,
} from './parsers';

import {
  getDependencyTreeFromProjectAssetsJson,
  ProjectAssetsJsonManifest,
} from './parsers/project-assets-json-parser';

const PROJ_FILE_EXTENSIONS = ['.csproj', '.vbproj', '.fsproj'];

export {
  buildDepTreeFromPackagesConfig,
  buildDepTreeFromProjectFile,
  buildDepTreeFromProjectJson,
  buildDepTreeFromProjectAssetsJson,
  buildDepTreeFromFiles,
  containsPackageReference,
  extractTargetFrameworksFromFiles,
  extractTargetFrameworksFromProjectFile,
  extractTargetFrameworksFromProjectConfig,
  extractTargetFrameworksFromProjectJson,
  extractTargetFrameworksFromProjectAssetsJson,
  extractTargetSdkFromGlobalJson,
  extractProps,
  isSupportedByV2GraphGeneration,
  PkgTree,
  DepType,
};

function buildDepTreeFromProjectJson(
  manifestFileContents: string,
  includeDev = false,
): PkgTree {
  // trimming required to address files with UTF-8 with BOM encoding
  const manifestFile: ProjectJsonManifest = JSON.parse(
    manifestFileContents.trim(),
  );
  return getDependencyTreeFromProjectJson(manifestFile, includeDev);
}

// TODO: Figure out what to do about devDeps
function buildDepTreeFromProjectAssetsJson(
  manifestFileContents: string,
  targetFramework?: string,
): PkgTree {
  if (!targetFramework) {
    throw new OpenSourceEcosystems.MissingPayloadError(
      'Missing targetFramework for project.assets.json',
    );
  }
  // trimming required to address files with UTF-8 with BOM encoding
  const manifestFile: ProjectAssetsJsonManifest = JSON.parse(
    manifestFileContents.trim(),
  );
  return getDependencyTreeFromProjectAssetsJson(manifestFile, targetFramework);
}

async function buildDepTreeFromPackagesConfig(
  manifestFileContents: string,
  includeDev = false,
): Promise<PkgTree> {
  const manifestFile: any = await parseXmlFile(manifestFileContents);
  return getDependencyTreeFromPackagesConfig(manifestFile, includeDev);
}

async function buildDepTreeFromProjectFile(
  manifestFileContents: string,
  includeDev = false,
  propsMap: PropsLookup = {},
): Promise<PkgTree> {
  const manifestFile: any = await parseXmlFile(manifestFileContents);
  return getDependencyTreeFromProjectFile(manifestFile, includeDev, propsMap);
}

function buildDepTreeFromFiles(
  root: string,
  manifestFilePath: string,
  includeDev = false,
  targetFramework?: string,
) {
  if (!root || !manifestFilePath) {
    throw new OpenSourceEcosystems.MissingPayloadError(
      'Missing required parameters for building dependency tree from files',
    );
  }

  const manifestFileFullPath = path.resolve(root, manifestFilePath);

  if (!fs.existsSync(manifestFileFullPath)) {
    throw new OpenSourceEcosystems.CannotGetFileFromSourceError(
      'No packages.config, project.json or project file found',
      {
        location: manifestFileFullPath,
      },
    );
  }

  const manifestFileContents = fs.readFileSync(manifestFileFullPath, 'utf-8');
  const manifestFileExtension = path.extname(manifestFileFullPath);

  if (PROJ_FILE_EXTENSIONS.includes(manifestFileExtension)) {
    return buildDepTreeFromProjectFile(manifestFileContents, includeDev);
  } else if (manifestFilePath.endsWith('packages.config')) {
    return buildDepTreeFromPackagesConfig(manifestFileContents, includeDev);
  } else if (manifestFilePath.endsWith('project.json')) {
    return buildDepTreeFromProjectJson(manifestFileContents, includeDev);
  } else if (manifestFilePath.endsWith('project.assets.json')) {
    return buildDepTreeFromProjectAssetsJson(
      manifestFileContents,
      targetFramework,
    );
  } else {
    throw new OpenSourceEcosystems.UnsupportedManifestFileError(
      'Unsupported file, please provide ' +
        'either packages.config or project file.',
      {
        location: manifestFilePath,
      },
    );
  }
}

// The V2 project aimed at removing virtually all of this reinvention of the wheel logic in favor of utilization of
// the `dotnet` cli itself, publicly referred to as just 'V2', is done iteratively. Since this package is shared with
// both internal and external packages that all make up parts of the V2 project, we add the shared logic here.
// Further, at least to keep project development iterative, don't support needle and haystack'ing dependency JSON
// for target frameworks other than .NET 5+ and .NET Core, as other frameworks generates vastly other types of
// .json graphs, requiring a whole other parsing strategy to extract tne runtime dependencies.
// For a list of version naming currently available, see
// https://learn.microsoft.com/en-us/dotnet/standard/frameworks#supported-target-frameworks
function isSupportedByV2GraphGeneration(targetFramework: string): boolean {
  // Everything that does not start with 'net' is already game over. E.g. Windows Phone (wp) or silverlight (sl) etc.
  if (!targetFramework.startsWith('net')) {
    return false;
  }

  // - .NET Core: netcoreappN.N, - EOL from Microsoft
  if (targetFramework.startsWith('netcoreapp')) {
    return false;
  }

  // What's left is:
  // - .NET 5+ netN.N, (supported)
  // - .NET Standard: netstandardN.N (supported) and
  // - .NET Framework: netNNN (unsupported)
  // So if there's a dot, we're good.
  if (targetFramework.includes('.')) {
    return true;
  }

  // Otherwise it's something before .NET 5 and we're out
  return false;
}

function extractTargetFrameworksFromFiles(
  root: string,
  manifestFilePath: string,
  includeDev = false,
) {
  if (!root || !manifestFilePath) {
    throw new OpenSourceEcosystems.MissingPayloadError(
      'Missing required parameters for extractTargetFrameworksFromFiles()',
    );
  }

  const manifestFileFullPath = path.resolve(root, manifestFilePath);
  if (!fs.existsSync(manifestFileFullPath)) {
    throw new OpenSourceEcosystems.CannotGetFileFromSourceError(
      'No project file found',
      {
        location: manifestFileFullPath,
      },
    );
  }

  const manifestFileContents = fs.readFileSync(manifestFileFullPath, 'utf-8');
  const manifestFileExtension = path.extname(manifestFileFullPath);

  if (PROJ_FILE_EXTENSIONS.includes(manifestFileExtension)) {
    return extractTargetFrameworksFromProjectFile(manifestFileContents);
  } else if (manifestFilePath.endsWith('packages.config')) {
    return extractTargetFrameworksFromProjectConfig(manifestFileContents);
  } else if (manifestFilePath.endsWith('project.json')) {
    return extractTargetFrameworksFromProjectJson(manifestFileContents);
  } else if (manifestFilePath.endsWith('project.assets.json')) {
    return extractTargetFrameworksFromProjectAssetsJson(manifestFileContents);
  } else {
    throw new OpenSourceEcosystems.UnsupportedManifestFileError(
      'Unsupported file, please provide ' +
        'a project *.csproj, *.vbproj, *.fsproj or packages.config file.',
      {
        location: manifestFilePath,
      },
    );
  }
}

async function extractTargetFrameworksFromProjectFile(
  manifestFileContents: string,
): Promise<string[]> {
  const manifestFile: object = await parseXmlFile(manifestFileContents);
  return getTargetFrameworksFromProjectFile(manifestFile);
}

async function extractTargetFrameworksFromProjectConfig(
  manifestFileContents: string,
): Promise<string[]> {
  const manifestFile: object = await parseXmlFile(manifestFileContents);
  return getTargetFrameworksFromProjectConfig(manifestFile);
}

async function containsPackageReference(manifestFileContents: string) {
  const manifestFile: any = await parseXmlFile(manifestFileContents);

  const projectItems: any[] = manifestFile?.Project?.ItemGroup ?? [];
  const referenceIndex = projectItems.findIndex(
    (itemGroup) =>
      typeof itemGroup === 'object' && 'PackageReference' in itemGroup,
  );

  return referenceIndex !== -1;
}

async function extractTargetFrameworksFromProjectJson(
  manifestFileContents: string,
): Promise<string[]> {
  let manifestFile;
  try {
    // trimming required to address files with UTF-8 with BOM encoding
    manifestFile = JSON.parse(manifestFileContents.trim());
  } catch (err: any) {
    throw new OpenSourceEcosystems.UnparseableManifestError(
      'Failed to parse manifest file',
    );
  }
  return getTargetFrameworksFromProjectJson(manifestFile);
}

async function extractTargetFrameworksFromProjectAssetsJson(
  manifestFileContents: string,
): Promise<string[]> {
  let manifestFile;
  try {
    // trimming required to address files with UTF-8 with BOM encoding
    manifestFile = JSON.parse(manifestFileContents.trim());
  } catch (err: any) {
    throw new OpenSourceEcosystems.UnparseableManifestError(
      'Failed to parse manifest file',
    );
  }
  return getTargetFrameworksFromProjectAssetsJson(manifestFile);
}

function extractTargetSdkFromGlobalJson(
  manifestFileContents: string,
): string | undefined {
  try {
    // Remove /* */ comments from the JSON string (if any)
    // It's allowed: https://learn.microsoft.com/en-us/dotnet/core/tools/global-json#comments-in-globaljson
    const jsonWithoutComments = manifestFileContents.replace(
      /\/\*[\s\S]*?\*\/|\/\/.*$/gm,
      '',
    );
    const globalJsonAsObj = JSON.parse(jsonWithoutComments);
    return globalJsonAsObj?.sdk?.version;
  } catch (err: any) {
    throw new Error(
      `Extracting target framework failed with error ${err.message}`,
    );
  }
}

async function extractProps(propsFileContents: string): Promise<PropsLookup> {
  const propsFile: object = await parseXmlFile(propsFileContents);

  if (!propsFile) {
    throw new OpenSourceEcosystems.MissingPayloadError('Empty xml file');
  }
  return getPropertiesMap(propsFile);
}
