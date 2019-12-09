import {DepType, PkgTree, ProjectJsonManifest, ProjectJsonManifestDependency} from './types';
import * as _ from 'lodash';

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

export function getTargetFrameworksFromProjectJson(manifestFile) {
  return Object.keys(_.get(manifestFile, 'frameworks', {}));
}
