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
export declare enum DepType {
    prod = "prod",
    dev = "dev"
}
export declare function getTopLevelDeps(): Dep[];
