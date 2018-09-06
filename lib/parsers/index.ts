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

export async function getDependencyTree(manifestFile) {
  const packageList = manifestFile.packages.package;

  const depTree: PkgTree = {
    dependencies: {},
    hasDevDependencies: false,
    name: '',
    version: '',
  };

  packageList.map((dep) => {
    const depName = dep.$.id;
    depTree.dependencies[depName] = buildSubTree(dep);
  });

  return depTree;
}

function buildSubTree(dep): PkgTree {
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

export async  function parseManifestFile(manifestFileContents: string) {
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
