import * as _ from 'lodash';

export interface PkgTree {
  name: string;
  version: string;
  dependencies: {
    [dep: string]: PkgTree;
  };
  targetFrameworks?: string[];
}

export interface ProjectAssetsJsonManifest {
  targets: {
    [target: string]: {
      [name: string]: {
        type: string,
        dependencies?: {
          [deps: string]: string;
        };
      };
    },
  };
  project: {
    restore: {
      projectName: string,
    },
    version: string,
  };
}

function getProjectNameForProjectAssetsJson(manifestFile) {
  return _.get(manifestFile, ['project', 'restore', 'projectName'], {});
}

function getProjectVersionForProjectAssetsJson(manifestFile) {
  return _.get(manifestFile, ['project', 'version'], {});
}

function buildPackageTree(name, version) {
  const depTree: PkgTree = {
    dependencies: {},
    name,
    version,
  };
  return depTree;
}

// Currently the function getDependencyTreeFromProjectAssetsJson returns
// a two level deep flat list of 100% of dependencies.
// TODO: Get full tree

export function getDependencyTreeFromProjectAssetsJson(
  manifestFile: ProjectAssetsJsonManifest,
  targetFrameWork,
  ): PkgTree {
  const projectName = getProjectNameForProjectAssetsJson(manifestFile);
  const projectVersion = getProjectVersionForProjectAssetsJson(manifestFile);
  const depTree = buildPackageTree(projectName, projectVersion);

  const topLevelDeps = Object.keys(_.get(manifestFile, ['targets', targetFrameWork], {}));
  for (const topLevelDep of topLevelDeps) {
    const [topLevelDepName, topLevelDepVersion] = topLevelDep.split('/');
    const topLevelDepTree = buildPackageTree(topLevelDepName, topLevelDepVersion);

    const transitiveDeps = _.get(manifestFile, ['targets', targetFrameWork, topLevelDep, 'dependencies'], {});
    for (const transitiveDep of Object.keys(transitiveDeps)) {
      const transitiveDepVersion = transitiveDeps[transitiveDep];
      const transitiveDepTree = buildPackageTree(transitiveDep, transitiveDepVersion);
      topLevelDepTree.dependencies[transitiveDep] = transitiveDepTree;
    }
    depTree.dependencies[topLevelDepName] = topLevelDepTree;
  }
  return depTree;
}
