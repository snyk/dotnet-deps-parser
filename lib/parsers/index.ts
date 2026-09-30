import * as parseXML from 'xml2js';
import { isEmpty, set, uniq } from 'lodash';
import { OpenSourceEcosystems } from '@snyk/error-catalog-nodejs-public';
import {
  getAll,
  getAttr,
  getCaseInsensitive,
  hasKey,
} from './case-insensitive';

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
  dependenciesWithUnknownVersions?: string[];
}

export interface DependencyWithoutVersion {
  name: string;
  withoutVersion: true;
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
  name?: string;
}

export interface DependenciesDiscoveryResult {
  dependencies: { [dep: string]: PkgTree };
  hasDevDependencies: boolean;
  dependenciesWithUnknownVersions?: string[];
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

export function getDependencyTreeFromProjectJson(
  manifestFile: ProjectJsonManifest,
  includeDev: boolean = false,
) {
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
    const version =
      (depValue as ProjectJsonManifestDependency).version || depValue;
    const isDev = (depValue as ProjectJsonManifestDependency).type === 'build';
    depTree.hasDevDependencies = depTree.hasDevDependencies || isDev;
    if (isDev && !includeDev) {
      continue;
    }
    depTree.dependencies[depName] = buildSubTreeFromProjectJson(
      depName,
      version,
      isDev,
    );
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
  manifestFile,
  includeDev: boolean = false,
): Promise<PkgTree> {
  const depTree: PkgTree = {
    dependencies: {},
    hasDevDependencies: false,
    name: '',
    version: '',
  };

  const packageList = getAll(
    getCaseInsensitive(manifestFile, 'packages'),
    'package',
  );

  for (const dep of packageList) {
    const depName = getAttr(dep, 'id');
    const isDev = !!getAttr(dep, 'developmentDependency');
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
    name: getAttr(dep, 'id'),
    version: getAttr(dep, 'version'),
  };

  const targetFramework = getAttr(dep, 'targetFramework');
  if (targetFramework) {
    depSubTree.targetFrameworks = [targetFramework];
  }

  return depSubTree;
}

export async function getDependencyTreeFromProjectFile(
  manifestFile,
  includeDev: boolean = false,
  propsMap: PropsLookup = {},
): Promise<PkgTree> {
  const nameProperty =
    getProjectChildren(manifestFile, 'PropertyGroup')
      .filter((propertyGroup) => typeof propertyGroup !== 'string')
      .find((propertyGroup) => {
        return (
          hasKey(propertyGroup, 'PackageId') ||
          hasKey(propertyGroup, 'AssemblyName')
        );
      }) || {};

  const name =
    getCaseInsensitive(nameProperty, 'PackageId')?.[0] ||
    getCaseInsensitive(nameProperty, 'AssemblyName')?.[0] ||
    '';

  const packageReferenceDeps = await getDependenciesFromPackageReference(
    manifestFile,
    includeDev,
    propsMap,
  );

  // order matters, the order deps are parsed in needs to be preserved and first seen kept
  // so applying the packageReferenceDeps last to override the second parsed
  const depTree: PkgTree = {
    dependencies: {
      ...packageReferenceDeps.dependencies,
    },
    hasDevDependencies: packageReferenceDeps.hasDevDependencies,
    name,
    version: '',
  };
  if (packageReferenceDeps.dependenciesWithUnknownVersions) {
    depTree.dependenciesWithUnknownVersions =
      packageReferenceDeps.dependenciesWithUnknownVersions;
  }

  return depTree;
}

export async function getDependenciesFromPackageReference(
  manifestFile,
  includeDev: boolean = false,
  propsMap: PropsLookup,
): Promise<DependenciesDiscoveryResult> {
  let dependenciesResult: DependenciesDiscoveryResult = {
    dependencies: {},
    hasDevDependencies: false,
  };
  const packageGroups = getProjectChildren(manifestFile, 'ItemGroup').filter(
    (itemGroup) =>
      typeof itemGroup === 'object' && hasKey(itemGroup, 'PackageReference'),
  );

  if (!packageGroups.length) {
    return dependenciesResult;
  }

  for (const packageList of packageGroups) {
    dependenciesResult = processItemGroupForPackageReference(
      packageList,
      manifestFile,
      includeDev,
      dependenciesResult,
      propsMap,
    );
  }

  return dependenciesResult;
}

function processItemGroupForPackageReference(
  packageList,
  manifestFile,
  includeDev: boolean,
  dependenciesResult,
  propsMap: PropsLookup,
) {
  const targetFrameworks: string[] =
    (getAttr(packageList, 'Condition') ?? false)
      ? getConditionalFrameworks(getAttr(packageList, 'Condition'))
      : [];

  for (const dep of getAll(packageList, 'PackageReference')) {
    const depName = getAttr(dep, 'Include');
    if (!depName) {
      // PackageReference Update is not yet supported
      continue;
    }
    const isDev = !!getAttr(dep, 'developmentDependency');
    dependenciesResult.hasDevDependencies =
      dependenciesResult.hasDevDependencies || isDev;
    if (isDev && !includeDev) {
      continue;
    }
    const subDep = buildSubTreeFromPackageReference(
      dep,
      isDev,
      manifestFile,
      targetFrameworks,
      propsMap,
    );
    if ((subDep as DependencyWithoutVersion).withoutVersion) {
      dependenciesResult.dependenciesWithUnknownVersions =
        dependenciesResult.dependenciesWithUnknownVersions || [];
      dependenciesResult.dependenciesWithUnknownVersions.push(subDep.name);
    } else {
      dependenciesResult.dependencies[depName] = subDep as PkgTree;
    }
  }

  return dependenciesResult;
}

function buildSubTreeFromPackageReference(
  dep,
  isDev: boolean,
  manifestFile,
  targetFrameworks: string[],
  propsMap: PropsLookup,
): PkgTree | DependencyWithoutVersion {
  const version = extractDependencyVersion(dep, manifestFile, propsMap) || '';
  if (!isEmpty(version)) {
    const depSubTree: PkgTree = {
      depType: isDev ? DepType.dev : DepType.prod,
      dependencies: {},
      name: getAttr(dep, 'Include'),
      // Version could be in attributes or as child node.
      version,
    };

    if (targetFrameworks.length) {
      depSubTree.targetFrameworks = targetFrameworks;
    }

    return depSubTree;
  } else {
    return { name: getAttr(dep, 'Include'), withoutVersion: true };
  }
}

function extractDependencyVersion(dep, manifestFile, propsMap): string | null {
  const VARS_MATCHER = /^\$\((.*?)\)/;
  let version = getAttr(dep, 'Version') || getCaseInsensitive(dep, 'Version');
  if (Array.isArray(version)) {
    version = version[0];
  }
  const variableVersion = version && version.match(VARS_MATCHER);
  if (!variableVersion) {
    return version;
  }
  // version is a variable, extract it from manifest or props lookup
  const propertyName = variableVersion[1];
  const propertyMap = { ...propsMap, ...getPropertiesMap(manifestFile) };
  return getCaseInsensitive(propertyMap, propertyName) ?? null;
}

function getConditionalFrameworks(condition: string) {
  const regexp = /\(TargetFramework\)'\s?==\s? '((\w|\d|\.)*)'/gi;
  const frameworks: string[] = [];
  let match = regexp.exec(condition);

  while (match !== null) {
    frameworks.push(match[1]);
    match = regexp.exec(condition);
  }

  return frameworks;
}

export async function parseXmlFile(
  manifestFileContents: string,
): Promise<object> {
  return new Promise((resolve, reject) => {
    parseXML.parseString(manifestFileContents, (err, result) => {
      if (err) {
        const e = new OpenSourceEcosystems.UnparseableManifestError(
          'Manifest xml file parsing failed',
        );
        return reject(e);
      }
      return resolve(result);
    });
  });
}

export interface PropsLookup {
  [name: string]: string;
}

export function getPropertiesMap(propsContents: any): PropsLookup {
  const projectPropertyGroup = getProjectChildren(
    propsContents,
    'PropertyGroup',
  );
  const props: PropsLookup = {};
  if (!projectPropertyGroup.length) {
    return props;
  }

  for (const group of projectPropertyGroup) {
    // Skip empty property groups that are parsed as strings
    if (typeof group === 'string') {
      continue;
    }
    for (const key of Object.keys(group)) {
      set(props, key, group[key][0]);
    }
  }
  return props;
}

export function getTargetFrameworksFromProjectFile(manifestFile) {
  let targetFrameworksResult: string[] = [];

  // First, look in direct PropertyGroup elements
  const projectPropertyGroup = getProjectChildren(
    manifestFile,
    'PropertyGroup',
  );
  let propertyList: any = {};

  if (projectPropertyGroup) {
    try {
      propertyList =
        projectPropertyGroup
          .filter((propertyGroup) => typeof propertyGroup === 'object')
          .find((propertyGroup) => {
            return hasTargetFrameworkProperty(propertyGroup);
          }) || {};
    } catch (err) {
      propertyList = {};
    }
  }

  // If no target framework found in direct PropertyGroups, look inside Choose/When blocks
  if (isEmpty(propertyList)) {
    const chooseElements = getProjectChildren(manifestFile, 'Choose');
    for (const choose of chooseElements) {
      const whenElements = getAll(choose, 'When');
      for (const when of whenElements) {
        const whenPropertyGroups = getAll(when, 'PropertyGroup');
        try {
          const foundProperty = whenPropertyGroups
            .filter((propertyGroup) => typeof propertyGroup === 'object')
            .find((propertyGroup) => {
              return hasTargetFrameworkProperty(propertyGroup);
            });
          if (foundProperty && !isEmpty(foundProperty)) {
            propertyList = foundProperty;
            break;
          }
        } catch (err) {
          // Continue searching other When blocks
        }
      }
      if (!isEmpty(propertyList)) {
        break;
      }
    }
  }

  if (isEmpty(propertyList)) {
    return targetFrameworksResult;
  }
  const targetFrameworksProp = getCaseInsensitive(
    propertyList,
    'TargetFrameworks',
  );
  const targetFrameworkVersionProp = getCaseInsensitive(
    propertyList,
    'TargetFrameworkVersion',
  );
  let targetFrameworkProp = getCaseInsensitive(propertyList, 'TargetFramework');
  // TargetFrameworks is expected to be a list ; separated
  if (targetFrameworksProp) {
    for (const item of targetFrameworksProp) {
      targetFrameworksResult = [
        ...targetFrameworksResult,
        ...getTargetFrameworks(item),
      ];
    }
  }
  // TargetFrameworkVersion is expected to be a string containing only one item
  // TargetFrameworkVersion also implies .NETFramework, for convenience
  // return longer version
  if (targetFrameworkVersionProp) {
    targetFrameworksResult.push(
      `.NETFramework,Version=${targetFrameworkVersionProp[0]}`,
    );
  }
  // TargetFrameworks is expected to be a string
  if (targetFrameworkProp) {
    // sanity check
    if (Array.isArray(targetFrameworkProp)) {
      // mutate the array to effectively "ignore" conditions
      const frameworks = targetFrameworkProp.map((framework) => {
        if (
          framework &&
          typeof framework === 'object' &&
          Object.hasOwnProperty.call(framework, '_')
        ) {
          return framework._;
        }
        return framework;
      });
      targetFrameworkProp = frameworks
        .map((x) => x.trim())
        .filter((x) => !isEmpty(x));
    }

    targetFrameworksResult = [
      ...targetFrameworksResult,
      ...targetFrameworkProp,
    ];
  }

  return uniq(targetFrameworksResult);
}

// Extracts the SDK name for SDK-style projects, based on documentation at
// https://learn.microsoft.com/en-us/dotnet/core/project-sdk/overview.
export function getSdkFromProjectFile(manifestFile: any): string | undefined {
  const project = getCaseInsensitive(manifestFile, 'Project');
  const projectSdkAttribute: string | undefined = getAttr(project, 'Sdk');
  const topLevelSdkElement: string | undefined = getAttr(
    getAll(project, 'Sdk')[0],
    'Name',
  );

  return projectSdkAttribute || topLevelSdkElement;
}

function getTargetFrameworks(item: string | any) {
  if (typeof item === 'object' && Object.hasOwnProperty.call(item, '_')) {
    item = item._;
  }
  return item
    .split(';')
    .map((x) => x.trim())
    .filter((x) => !isEmpty(x));
}

export function getTargetFrameworksFromProjectConfig(manifestFile) {
  const targetFrameworksResult: string[] = [];
  const packages = getAll(
    getCaseInsensitive(manifestFile, 'packages'),
    'package',
  );

  for (const item of packages) {
    const targetFramework = getAttr(item, 'targetFramework');
    if (!targetFramework) {
      continue;
    }

    if (!targetFrameworksResult.includes(targetFramework)) {
      targetFrameworksResult.push(targetFramework);
    }
  }

  return targetFrameworksResult;
}

export function getTargetFrameworksFromProjectJson(manifestFile) {
  return Object.keys(manifestFile?.frameworks ?? {});
}

export function getTargetFrameworksFromProjectAssetsJson(manifestFile) {
  return Object.keys(manifestFile?.targets ?? {});
}

// Children of the root <Project> element with the given name, e.g. ItemGroup.
// Exported for use by lib/index.ts.
export function getProjectChildren(manifestFile: any, name: string): any[] {
  return getAll(getCaseInsensitive(manifestFile, 'Project'), name);
}

function hasTargetFrameworkProperty(propertyGroup: any): boolean {
  return (
    hasKey(propertyGroup, 'TargetFramework') ||
    hasKey(propertyGroup, 'TargetFrameworks') ||
    hasKey(propertyGroup, 'TargetFrameworkVersion')
  );
}
