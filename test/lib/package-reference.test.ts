// tslint:disable:max-line-length
// tslint:disable:object-literal-key-quotes
import { test } from 'tap';
import * as fs from 'fs';
import { containsPackageReference } from '../../lib';

/*
 ****** csproj ******
 */
test('.Net C# project contains PackageReference as expected', async (t) => {
  const manifestFileContents = fs.readFileSync(
    `${__dirname}/../fixtures/dotnet-core-simple-project/simple-project.csproj`,
    'utf-8',
  );
  const hasPackageReference = await containsPackageReference(
    manifestFileContents,
  );
  t.true(hasPackageReference);
});

test('Project contains PackageReference as expected even if Reference Include present', async (t) => {
  const manifestFileContents = fs.readFileSync(
    `${__dirname}/../fixtures/old-and-new-package-format-proj/project.csproj`,
    'utf-8',
  );
  const hasPackageReference = await containsPackageReference(
    manifestFileContents,
  );
  t.true(hasPackageReference);
});

test('.Net C# project contains PackageReference with empty item group works as expected', async (t) => {
  const manifestFileContents = fs.readFileSync(
    `${__dirname}/../fixtures/dotnet-core-simple-project-empty-item-group/simple-project-empty-item-group.csproj`,
    'utf-8',
  );
  const hasPackageReference = await containsPackageReference(
    manifestFileContents,
  );
  t.true(hasPackageReference);
});

test('.Net C# project does not contain PackageReference as expected', async (t) => {
  const manifestFileContents = fs.readFileSync(
    `${__dirname}/../fixtures/dotnet-no-packagereference/project.csproj`,
    'utf-8',
  );
  const hasPackageReference = await containsPackageReference(
    manifestFileContents,
  );
  t.false(hasPackageReference);
});

/*
 ****** vbproj ******
 */
test('.Net Visual Basic project contains PackageReference as expected', async (t) => {
  const manifestFileContents = fs.readFileSync(
    `${__dirname}/../fixtures/dotnet-vb-simple-project/manifest.vbproj`,
    'utf-8',
  );
  const hasPackageReference = await containsPackageReference(
    manifestFileContents,
  );
  t.true(hasPackageReference);
});

test('.Net Visual Basic project does not contain PackageReference as expected', async (t) => {
  const manifestFileContents = fs.readFileSync(
    `${__dirname}/../fixtures/dotnet-no-packagereference/project.vbproj`,
    'utf-8',
  );
  const hasPackageReference = await containsPackageReference(
    manifestFileContents,
  );
  t.false(hasPackageReference);
});

/*
 ****** fsproj ******
 */
test('.Net F# project contains PackageReference as expected', async (t) => {
  const manifestFileContents = fs.readFileSync(
    `${__dirname}/../fixtures/dotnet-fs-simple-project/manifest.fsproj`,
    'utf-8',
  );
  const hasPackageReference = await containsPackageReference(
    manifestFileContents,
  );
  t.true(hasPackageReference);
});

test('.Net F# project does not contain PackageReference as expected', async (t) => {
  const manifestFileContents = fs.readFileSync(
    `${__dirname}/../fixtures/dotnet-no-packagereference/project.fsproj`,
    'utf-8',
  );
  const hasPackageReference = await containsPackageReference(
    manifestFileContents,
  );
  t.false(hasPackageReference);
});
