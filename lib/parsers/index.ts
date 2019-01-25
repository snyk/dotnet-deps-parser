import * as parseXML from 'xml2js';
import * as _ from 'lodash';
import {InvalidUserInputError} from '../errors';

export interface PkgTree {
  name: string;
  version: string;
  dependencies: {
    [dep: string]: PkgTree;
  };
  depType?: DepType;
  hasDevDependencies?: boolean;
  cyclic?: boolean;
  targetFrameworks?: string[];
}

export enum DepType {
  prod = 'prod',
  dev = 'dev',
}

export interface ReferenceInclude {
  Version?: string;
  Culture?: string;
  processorArchitecture?: string;
  PublicKeyToken?: string;
}

export interface DependenciesDiscoveryResult {
  dependencies: object;
  hasDevDependencies: boolean;
}

export enum ProjectJsonDepType {
  build = 'build',
  project = 'project',
  platform = 'platform',
  default = 'default',
}

export interface ProjectJsonManifestDependency {
  version: string;
  type?: ProjectJsonDepType;
}
export interface ProjectJsonManifest {
  dependencies: {
    [name: string]: ProjectJsonManifestDependency | string;
  };
}

export function getDependencyTreeFromProjectJson(manifestFile: ProjectJsonManifest, includeDev: boolean = false) {
  const depTree: PkgTree = {
    dependencies: {},
    hasDevDependencies: false,
    name: '',
    version: '',
  };

  for (const depName in manifestFile.dependencies) {
    if (!manifestFile.dependencies.hasOwnProperty(depName)) {
      continue;
    }
    const depValue = manifestFile.dependencies[depName];
    const version = (depValue as ProjectJsonManifestDependency).version || depValue;
    const isDev = (depValue as ProjectJsonManifestDependency).type === 'build';
    depTree.hasDevDependencies = depTree.hasDevDependencies || isDev;
    if (isDev && !includeDev) {
      continue;
    }
    depTree.dependencies[depName] = buildSubTreeFromProjectJson(depName, version, isDev);
  }
  return depTree;
}

function buildSubTreeFromProjectJson(name, version, isDev: boolean): PkgTree {
  const depSubTree: PkgTree = {
    depType: isDev ? DepType.dev : DepType.prod,
    dependencies: {},
    name,
    version,
  };

  return depSubTree;
}

export async function getDependencyTreeFromPackagesConfig(
  manifestFile, includeDev: boolean = false): Promise<PkgTree> {
  const depTree: PkgTree = {
    dependencies: {},
    hasDevDependencies: false,
    name: '',
    version: '',
  };

  const packageList = _.get(manifestFile, 'packages.package', []);

  for (const dep of packageList) {
    const depName = dep.$.id;
    const isDev = !!dep.$.developmentDependency;
    depTree.hasDevDependencies = depTree.hasDevDependencies || isDev;
    if (isDev && !includeDev) {
      continue;
    }
    depTree.dependencies[depName] = buildSubTreeFromPackagesConfig(dep, isDev);
  }

  return depTree;
}

function buildSubTreeFromPackagesConfig(dep, isDev: boolean): PkgTree {
  const depSubTree: PkgTree = {
    depType: isDev ? DepType.dev : DepType.prod,
    dependencies: {},
    name: dep.$.id,
    version: dep.$.version,
  };

  if (dep.$.targetFramework) {
    depSubTree.targetFrameworks = [dep.$.targetFramework];
  }

  return depSubTree;
}

export async function getDependencyTreeFromProjectFile(manifestFile, includeDev: boolean = false) {
  const nameProperty = _.get(manifestFile, 'Project.PropertyGroup', [])
    .find((propertyGroup) => {
      return _.has(propertyGroup, 'PackageId')
      || _.has(propertyGroup, 'AssemblyName');
    }) || {};

  const name = (nameProperty.PackageId && nameProperty.PackageId[0])
    || (nameProperty.AssemblyName && nameProperty.AssemblyName[0])
    || '';

  const packageReferenceDeps =
    await getDependenciesFromPackageReference(manifestFile, includeDev);
  const referenceIncludeDeps =
    await getDependenciesFromReferenceInclude(manifestFile, includeDev);

  const depTree: PkgTree = {
    dependencies: {
      ...packageReferenceDeps.dependencies,
      ...referenceIncludeDeps.dependencies,
    },
    hasDevDependencies: packageReferenceDeps.hasDevDependencies || referenceIncludeDeps.hasDevDependencies,
    name,
    version: '',
  };

  return depTree;
}

async function getDependenciesFromPackageReference(manifestFile, includeDev: boolean = false):
  Promise <DependenciesDiscoveryResult> {
  const dependenciesResult: DependenciesDiscoveryResult = {
    dependencies: {},
    hasDevDependencies: false,
  };
  const packageList = _.get(manifestFile, 'Project.ItemGroup', [])
    .find((itemGroup) => _.has(itemGroup, 'PackageReference'));

  if (!packageList) {
    return dependenciesResult;
  }

  const targetFrameworks: string[] = _.get(packageList, '$.Condition', false) ?
    getConditionalFrameworks(packageList.$.Condition) : [];

  for (const dep of packageList.PackageReference) {
    const depName = dep.$.Include;
    const isDev = !!dep.$.developmentDependency;
    dependenciesResult.hasDevDependencies = dependenciesResult.hasDevDependencies || isDev;
    if (isDev && !includeDev) {
      continue;
    }
    dependenciesResult.dependencies[depName] = buildSubTreeFromPackageReference(
      dep, isDev, manifestFile, targetFrameworks);
  }

  return dependenciesResult;
}

async function getDependenciesFromReferenceInclude(manifestFile, includeDev: boolean = false):
  Promise <DependenciesDiscoveryResult> {

  const referenceIncludeResult: DependenciesDiscoveryResult = {
    dependencies: {},
    hasDevDependencies: false,
  };

  const referenceIncludeList =
    _.get(manifestFile, 'Project.ItemGroup', [])
    .find((itemGroup) => _.has(itemGroup, 'Reference'));

  if (!referenceIncludeList) {
    return referenceIncludeResult;
  }

  const targetFrameworks: string[] = _.get(referenceIncludeList, '$.Condition', false) ?
   getConditionalFrameworks(referenceIncludeList.$.Condition) : [];

  for (const item of referenceIncludeList.Reference) {
    const propertiesList = item.$.Include.split(',').map((i) => i.trim());
    const [depName, ...depInfoArray] = propertiesList;
    const depInfo: ReferenceInclude = {};

    for (const itemValue of depInfoArray) {
      const propertyValuePair = itemValue.split('=');
      depInfo[propertyValuePair[0]] = propertyValuePair[1];
    }

    const dependency: PkgTree = {
      // TODO: correctly identify what makes the dep be dev only
      depType: DepType.prod,
      dependencies: {},
      name: depName,
      version: depInfo.Version || '',
    };

    if (targetFrameworks.length) {
      dependency.targetFrameworks = targetFrameworks;
    }

    referenceIncludeResult.dependencies[depName] = dependency;
  }
  return referenceIncludeResult;
}

function buildSubTreeFromPackageReference(dep, isDev: boolean, manifestFile, targetFrameworks: string[]):
  PkgTree {

  const depSubTree: PkgTree = {
    depType: isDev ? DepType.dev : DepType.prod,
    dependencies: {},
    name: dep.$.Include,
    // Version could be in attributes or as child node.
    version: extractDependencyVersion(dep, manifestFile),
  };

  if (targetFrameworks.length) {
    depSubTree.targetFrameworks = targetFrameworks;
  }

  return depSubTree;
}

function extractDependencyVersion(dep, manifestFile) {
  const VARS_MATCHER = /^\$\((.*?)\)/;
  const version = dep.$.Version || _.get(dep, 'Version.0');
  const variableVersion = version && version.match(VARS_MATCHER);

  if (!variableVersion) {
    return version;
  }
  // version is a variable, extract it from manifest
  const propertyName = variableVersion[1];
  const versionProperty = _.get(manifestFile, 'Project.PropertyGroup', [])
  .find((propertyGroup) => _.has(propertyGroup, propertyName));

  return versionProperty[propertyName][0];
}

function getConditionalFrameworks(condition: string) {
  const regexp = /\(TargetFramework\)'\s?==\s? '((\w|\d|\.)*)'/g;
  const frameworks: string[] = [];
  let match = regexp.exec(condition);

  while (match !== null) {
    frameworks.push(match[1]);
    match = regexp.exec(condition);
  }

  return frameworks;
}

export async function parseManifestFile(manifestFileContents: string) {
  return new Promise((resolve, reject) => {
    parseXML
    .parseString(manifestFileContents, (err, result) => {
      if (err) {
        const e = new InvalidUserInputError('manifest parsing failed');
        return reject(e);
      }
      return resolve(result);
    });
  });
}

export function getTargetFrameworksFromProjectFile(manifestFile) {
  let targetFrameworksResult: string[] = [];
  const projectPropertyGroup = _.get(manifestFile, 'Project.PropertyGroup', []);

  if (!projectPropertyGroup ) {
    return targetFrameworksResult;
  }
  const propertyList = projectPropertyGroup
    .find((propertyGroup) => {
        return _.has(propertyGroup, 'TargetFramework')
        || _.has(propertyGroup, 'TargetFrameworks')
        || _.has(propertyGroup, 'TargetFrameworkVersion');
      }) || {};

  if (_.isEmpty(propertyList)) {
    return targetFrameworksResult;
  }
  // TargetFrameworks is expected to be a list ; separated
  if (propertyList.TargetFrameworks) {
    for (const item of propertyList.TargetFrameworks) {
      targetFrameworksResult = [...targetFrameworksResult, ...item.split(';')];
    }
  }
  // TargetFrameworkVersion is expected to be a string containing only one item
  // TargetFrameworkVersion also implies .NETFramework, for convenience
  // return longer version
  if (propertyList.TargetFrameworkVersion) {
    targetFrameworksResult.push(`.NETFramework,Version=${propertyList.TargetFrameworkVersion[0]}`);
  }
  // TargetFrameworks is expected to be a string
  if (propertyList.TargetFramework) {
    targetFrameworksResult = [...targetFrameworksResult, ...propertyList.TargetFramework];
  }

  return _.uniq(targetFrameworksResult);
}

export function getTargetFrameworksFromProjectConfig(manifestFile) {
  const targetFrameworksResult: string[] = [];
  const packages = _.get(manifestFile, 'packages.package', []);

  for (const item of packages) {
    const targetFramework = item.$.targetFramework;
    if (!targetFramework) {
      continue;
    }

    if (!_.includes(targetFrameworksResult, targetFramework)) {
      targetFrameworksResult.push(targetFramework);
    }
  }

  return targetFrameworksResult;
}
