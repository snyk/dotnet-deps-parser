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

export function getTopLevelDeps(): Dep[] {
  const dependencies: Dep [] = [];

  return dependencies;
}
