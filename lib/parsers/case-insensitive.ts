// MSBuild, NuGet and dotnet treat XML element, attribute and property names
// case-insensitively, but xml2js preserves the case it reads. These helpers
// match names ourselves. An exact-case match always wins over a differently
// cased spelling of the same name.

export function findKey(obj: any, key: string): string | undefined {
  if (obj === null || typeof obj !== 'object') {
    return undefined;
  }
  if (Object.prototype.hasOwnProperty.call(obj, key)) {
    return key;
  }
  const lower = key.toLowerCase();
  return Object.keys(obj).find((k) => k.toLowerCase() === lower);
}

export function hasKey(obj: any, key: string): boolean {
  return findKey(obj, key) !== undefined;
}

export function getCaseInsensitive(obj: any, key: string): any {
  const found = findKey(obj, key);
  return found === undefined ? undefined : obj[found];
}

// Attribute lookup on an xml2js node, i.e. the `$` object.
export function getAttr(node: any, name: string): any {
  return getCaseInsensitive(node?.$, name);
}

// Child elements of one name. xml2js keys children by their exact spelling, so
// <ItemGroup> and <itemgroup> siblings land under separate keys; merge them.
export function getAll(obj: any, key: string): any[] {
  if (obj === null || typeof obj !== 'object') {
    return [];
  }
  const lower = key.toLowerCase();
  const exact = Object.prototype.hasOwnProperty.call(obj, key) ? [key] : [];
  const others = Object.keys(obj).filter(
    (k) => k !== key && k.toLowerCase() === lower,
  );
  return [...exact, ...others].reduce(
    (all: any[], k) => all.concat(obj[k] ?? []),
    [],
  );
}
