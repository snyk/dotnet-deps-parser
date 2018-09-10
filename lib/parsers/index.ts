import * as parseXML from 'xml2js';
import * as _ from 'lodash';
export interface Dep {
  name: string;
  version: string;
  dev?: boolean;
}

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

export async function getDependencyTreeFromPackagesConfig(manifestFile) {
  const depTree: PkgTree = {
    dependencies: {},
    hasDevDependencies: false,
    name: '',
    version: '',
  };

  const packageList = _.get(manifestFile, 'packages.package', []);

  packageList.map((dep) => {
    const depName = dep.$.id;
    depTree.dependencies[depName] = buildSubTreeFromPackagesConfig(dep);
  });

  return depTree;
}

function buildSubTreeFromPackagesConfig(dep): PkgTree {
  const depType = (dep.$.developmentDependency && !!dep.$.developmentDependency)
  ? DepType.dev
  : DepType.prod;

  const depSubTree: PkgTree = {
    depType,
    dependencies: {},
    name: dep.$.id,
    version: dep.$.version,
  };

  return depSubTree;
}

export async function getDependencyTreeFromPackageReference(manifestFile) {
  const packageList = _.get(manifestFile, 'Project.ItemGroup', [])
    .find((itemGroup) => _.has(itemGroup, 'PackageReference'));

  const depTree: PkgTree = {
    dependencies: {},
    hasDevDependencies: false,
    name: '',
    version: '',
  };

  if (!packageList) {
    return depTree;
  }

  for (const dep of packageList.PackageReference) {
    const depName = dep.$.Include;
    depTree.dependencies[depName] = buildSubTreeFromPackageReference(dep);
  }

  return depTree;
}

function buildSubTreeFromPackageReference(dep): PkgTree {

  const depSubTree: PkgTree = {
    depType: DepType.prod,
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
  })
  .catch((err) => {
    throw new Error(`Parsing failed with error ${err.message}`);
  });
}
