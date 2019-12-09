import {VersionProvenance} from '@snyk/dep-graph';

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
  versionProvenance?: VersionProvenance;
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

export interface ManifestFile {
  path: string;
  content: any;
}
