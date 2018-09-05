"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var path = require("path");
function parseLockFile(root, targetFilePath, lockFilePath, options) {
    if (!root || !lockFilePath || !lockFilePath) {
        throw new Error('Missing required parameters for parseLockFile()');
    }
    // TODO: validate only valid options were passed in
    var targetFileFullPath = path.resolve(root, targetFilePath);
    var lockFileFullPath = path.resolve(root, lockFilePath);
    if (!fs.existsSync(targetFilePath)) {
        throw new Error("Target file package.json not found at location: " + targetFileFullPath);
    }
    if (!fs.existsSync(lockFilePath)) {
        throw new Error("LockFile package-lock.json not found at location: " + lockFileFullPath);
    }
    var targetFile = fs.readFileSync(targetFilePath);
    var lockFile = fs.readFileSync(lockFilePath);
    return buildDepTree(targetFile, lockFile, options);
}
exports.default = parseLockFile;
function buildDepTree(targetFileRaw, lockFileRaw, options) {
    var lockFile = JSON.parse(lockFileRaw);
    var targetFile = JSON.parse(targetFileRaw);
    if (!targetFile.dependencies) {
        throw new Error("No 'dependencies' property in package.json");
    }
    if (!lockFile.dependencies) {
        throw new Error("No 'dependencies' property in package-lock.json");
    }
    var depTree = {
        dependencies: {},
        name: targetFile.name || undefined,
        version: targetFile.version || undefined,
    };
    var parentDepList = targetFile.dependencies;
    var fullDepList = lockFile.dependencies;
    var parentDepsMap = Object.keys(parentDepList).reduce(function (acc, depName) {
        var version = parentDepList[depName];
        var name = depName + "@" + version;
        acc[name] = {
            name: depName,
            version: version,
        };
        return acc;
    }, {});
    var depsMap = Object.keys(fullDepList).reduce(function (acc, dep) {
        var version = fullDepList[dep];
        var name = dep + "@" + version;
        acc[name] = dep;
        return acc;
    }, {});
    for (var dep in depsMap) {
        if (depsMap.hasOwnProperty(dep)) {
            var subTree = buildSubTreeRecursive(dep, new Set(), depsMap);
            if (subTree) {
                depTree.dependencies[subTree.name] = subTree;
            }
        }
    }
    return depTree;
}
function buildSubTreeRecursive(dep, ancestors, depsMap) {
    var newAncestors = (new Set(ancestors)).add(dep);
    // TODO
    var tree = {
        name: depsMap[dep].name,
        version: depsMap[dep].version,
    };
    return tree;
}
//# sourceMappingURL=index.js.map