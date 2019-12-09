import * as _ from 'lodash';
import {
  DependenciesDiscoveryResult,
  DependencyWithoutVersion,
  DepType,
  ManifestFile,
  PkgTree,
  ReferenceInclude,
} from './types';
import {VersionProvenance} from '@snyk/dep-graph';

export async function getDependencyTreeFromProjectFile(
  manifestFile: ManifestFile,
  includeDev: boolean = false): Promise<PkgTree> {
  const nameProperty = _.get(manifestFile.content, 'Project.PropertyGroup', [])
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

  // order matters, the order deps are parsed in needs to be preserved and first seen kept
  // so applying the packageReferenceDeps last to override the second parsed
  const depTree: PkgTree = {
    dependencies: {
      ...referenceIncludeDeps.dependencies,
      ...packageReferenceDeps.dependencies,
    },
    hasDevDependencies: packageReferenceDeps.hasDevDependencies || referenceIncludeDeps.hasDevDependencies,
    name,
    version: '',
  };
  if (packageReferenceDeps.dependenciesWithUnknownVersions) {
    depTree.dependenciesWithUnknownVersions = packageReferenceDeps.dependenciesWithUnknownVersions;
  }

  return depTree;
}

async function getDependenciesFromPackageReference(manifestFile: ManifestFile, includeDev: boolean = false):
Promise <DependenciesDiscoveryResult> {
  let dependenciesResult: DependenciesDiscoveryResult = {
    dependencies: {},
    hasDevDependencies: false,
  };
  const packageGroups = _.get(manifestFile.content, 'Project.ItemGroup', [])
    .filter((itemGroup) => _.has(itemGroup, 'PackageReference'));

  if (!packageGroups.length) {
    return dependenciesResult;
  }

  for (const packageList of packageGroups) {
    dependenciesResult = processItemGroupForPackageReference(packageList, manifestFile, includeDev, dependenciesResult);
  }

  return dependenciesResult;
}

function processItemGroupForPackageReference(packageList, manifestFile: ManifestFile, includeDev, dependenciesResult) {
  const condition = _.get(packageList, '$.Condition', false);
  const targetFrameworks: string[] = condition ?
    getConditionalFrameworks(packageList.$.Condition) : [];

  for (const dep of packageList.PackageReference) {
    const depName = dep.$.Include;
    if (!depName) {
      // PackageReference Update is not yet supported
      continue;
    }
    const isDev = !!dep.$.developmentDependency;
    dependenciesResult.hasDevDependencies = dependenciesResult.hasDevDependencies || isDev;
    if (isDev && !includeDev) {
      continue;
    }
    const subDep = buildSubTreeFromPackageReference(
      condition, dep, isDev, manifestFile, targetFrameworks);
    if ((subDep as DependencyWithoutVersion).withoutVersion)  {
      dependenciesResult.dependenciesWithUnknownVersions = dependenciesResult.dependenciesWithUnknownVersions || [];
      dependenciesResult.dependenciesWithUnknownVersions.push(subDep.name);
    } else {
      dependenciesResult.dependencies[depName] = subDep as PkgTree;
    }
  }

  return dependenciesResult;
}

async function getDependenciesFromReferenceInclude(manifestFile: ManifestFile, includeDev: boolean = false):
Promise <DependenciesDiscoveryResult> {

  const referenceIncludeResult: DependenciesDiscoveryResult = {
    dependencies: {},
    hasDevDependencies: false,
  };

  const referenceIncludeList =
    _.get(manifestFile.content, 'Project.ItemGroup', [])
      .find((itemGroup) => _.has(itemGroup, 'Reference'));

  if (!referenceIncludeList) {
    return referenceIncludeResult;
  }

  const condition = _.get(referenceIncludeList, '$.Condition', false);
  const targetFrameworks: string[] = condition ? getConditionalFrameworks(referenceIncludeList.$.Condition) : [];

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

function buildSubTreeFromPackageReference(
  condition,
  dep,
  isDev: boolean,
  manifestFile: ManifestFile,
  targetFrameworks: string[]): PkgTree | DependencyWithoutVersion {

  const {version, versionProvenance} = extractDependencyVersion(condition, dep, manifestFile);

  if (version !== null && versionProvenance !== null) {

    const depSubTree: PkgTree = {
      depType: isDev ? DepType.dev : DepType.prod,
      dependencies: {},
      name: dep.$.Include,
      // Version could be in attributes or as child node.
      version,
      versionProvenance,
    };

    if (targetFrameworks.length) {
      depSubTree.targetFrameworks = targetFrameworks;
    }

    return depSubTree;
  } else {
    return {name: dep.$.Include, withoutVersion: true};
  }
}

function generateVersionProvenance(identifier, dep, manifestFile: ManifestFile, isVariable: boolean) {
  const name = isVariable ?
    `/Project/PropertyGroup/${identifier}` :
    `/Project/ItemGroup${identifier ? `[@Condition = "${identifier}"]` : ''}` +
    `/PackageReference[@Include = "${dep.$.Include}"][@Version = "${dep.$.Version || _.get(dep, 'Version.0')}"]'`;

  return {
    location: manifestFile.path,
    property: {
      name,
    },
    type: 'property',
  };
}

function extractDependencyVersion(condition, dep, manifestFile: ManifestFile)
: {version: string | null, versionProvenance: VersionProvenance | null} {
  const VARS_MATCHER = /^\$\((.*?)\)/;
  let version = dep.$.Version || _.get(dep, 'Version.0');
  let versionProvenance: VersionProvenance | null = generateVersionProvenance(condition, dep, manifestFile, false);
  const variableVersion = version && version.match(VARS_MATCHER);

  if (variableVersion) {
    // version is a variable, extract it from manifest
    const propertyName = variableVersion[1];
    // todo: are there other places the variable can be defined?
    // todo: add test with variable defined in PropertyGroup
    const versionProperty = _.get(manifestFile.content, 'Project.PropertyGroup', [])
      .find((propertyGroup) => _.has(propertyGroup, propertyName));
    version = _.get(versionProperty, `${propertyName}.0`, null);
    if (version) {
      versionProvenance = generateVersionProvenance(propertyName, dep, manifestFile, true);
    } else {
      versionProvenance = null;
    }
  }

  return {version, versionProvenance};
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
