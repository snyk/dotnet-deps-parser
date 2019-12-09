import * as _ from 'lodash';
import {DepType, PkgTree} from './types';

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
