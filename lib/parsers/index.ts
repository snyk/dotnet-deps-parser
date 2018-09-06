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

export function parseManifestFile(manifestFileContents: string) {
  let parsedResult = '';
  try {
    parseXML
      .parseString(manifestFileContents, (err, result) => {
        if (err) {
          throw err;
        }
        parsedResult = result;
      });
  } catch (e) {
    throw new Error(`Parsing failed with error ${e.message}`);
  }
  return parsedResult;
}
