import * as parseXML from 'xml2js';
import * as _ from 'lodash';

export interface PkgTree {
  name: string;
  version: string;
  dependencies: {
    [dep: string]: PkgTree;
  };
  depType?: DepType;
  hasDevDependencies?: boolean;
  cyclic?: boolean;
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

export async function getDependencyTreeFromPackagesConfig(manifestFile, includeDev: boolean = false) {
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

  return depSubTree;
}

export async function getDependencyTreeFromCsproj(manifestFile, includeDev: boolean = false) {
  const nameProperty = _.get(manifestFile, 'Project.PropertyGroup', [])
    .find((propertyGroup) => {
      return _.has(propertyGroup, 'PackageId')
      || _.has(propertyGroup, 'AssemblyName');
    }) || {};

  const name = (nameProperty.PackageId && nameProperty.PackageId[0])
    || (nameProperty.AssemblyName && nameProperty.AssemblyName[0])
    || '';

  const depTree: PkgTree = {
    dependencies: {},
    hasDevDependencies: false,
    name,
    version: '',
  };

  const packageReferenceDepTree = await getDependencyTreeFromPackageReference(manifestFile, includeDev, depTree);
  const combinedDepTree: PkgTree = {
    // TODO: also combine the TargetFrameworks dep tree into here
    ...packageReferenceDepTree,
  };

  combinedDepTree.dependencies = {
    ...combinedDepTree.dependencies,
    ...(await getDependenciesListFromReferenceInclude(manifestFile)),
  };

  return combinedDepTree;
}

export async function getDependencyTreeFromPackageReference(manifestFile, includeDev: boolean = false, depTree) {
  const packageList = _.get(manifestFile, 'Project.ItemGroup', [])
    .find((itemGroup) => _.has(itemGroup, 'PackageReference'));

  if (!packageList) {
    return depTree;
  }

  for (const dep of packageList.PackageReference) {
    const depName = dep.$.Include;
    const isDev = !!dep.$.developmentDependency;
    depTree.hasDevDependencies = depTree.hasDevDependencies || isDev;
    if (isDev && !includeDev) {
      continue;
    }
    depTree.dependencies[depName] = buildSubTreeFromPackageReference(dep, isDev);
  }

  return depTree;
}

export async function getDependenciesListFromReferenceInclude(manifestFile) {
  const referenceIncludeDependencies = {};
  const referenceIncludeList = _.get(manifestFile, 'Project.ItemGroup', [])
  .find((itemGroup) => _.has(itemGroup, 'Reference'));

  if (!referenceIncludeList) {
    return referenceIncludeDependencies;
  }

  for (const item of referenceIncludeList.Reference) {
    const propertiesList = item.$.Include.split(',').map((i) => i.trim());
    const [depName, ...depInfoArray] = propertiesList;
    const depInfoRaw =
      _.keyBy(depInfoArray, (prop) => prop.split('=')[0]);

    const depInfo: ReferenceInclude = {};
    for (const property of Object.keys(depInfoRaw)) {
      depInfo[property] = depInfoRaw[property].split('=')[1];
    }

    const dependency: PkgTree = {
      // TODO: correctly identify what makes the dep be dev only
      depType: DepType.prod,
      dependencies: {},
      name: depName,
      version: depInfo.Version || '',
    };

    referenceIncludeDependencies[depName] = dependency;
  }
  return referenceIncludeDependencies;
}

function buildSubTreeFromPackageReference(dep, isDev: boolean): PkgTree {

  const depSubTree: PkgTree = {
    depType: isDev ? DepType.dev : DepType.prod,
    dependencies: {},
    name: dep.$.Include,
    version: dep.$.Version,
  };

  return depSubTree;
}

export async function parseManifestFile(manifestFileContents: string) {
  return new Promise((resolve, reject) => {
    parseXML
      .parseString(manifestFileContents, (err, result) => {
        if (err) {
          return reject(err);
        }
        return resolve(result);
      });
  });
}
