import 'source-map-support/register';
import { PkgTree, DepType } from './parsers';
export { buildDepTree, buildDepTreeFromFiles, PkgTree, DepType, };
declare function buildDepTree(): Promise<PkgTree>;
declare function buildDepTreeFromFiles(root: string, manifestFilePaths: string[], includeDev?: boolean): Promise<PkgTree>;
