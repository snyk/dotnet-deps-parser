import * as fs from 'fs';
import { containsPackageReference } from '../../lib';

/*
 ****** csproj ******
 */
test('.Net C# project contains PackageReference as expected', async () => {
  const manifestFileContents = fs.readFileSync(
    `${__dirname}/../fixtures/dotnet-core-simple-project/simple-project.csproj`,
    'utf-8',
  );
  const hasPackageReference = await containsPackageReference(
    manifestFileContents,
  );
  expect(hasPackageReference).toBeTruthy();
});

test('Project contains PackageReference as expected even if Reference Include present', async () => {
  const manifestFileContents = fs.readFileSync(
    `${__dirname}/../fixtures/old-and-new-package-format-proj/project.csproj`,
    'utf-8',
  );
  const hasPackageReference = await containsPackageReference(
    manifestFileContents,
  );
  expect(hasPackageReference).toBeTruthy();
});

test('.Net C# project contains PackageReference with empty item group works as expected', async () => {
  const manifestFileContents = fs.readFileSync(
    `${__dirname}/../fixtures/dotnet-core-simple-project-empty-item-group/simple-project-empty-item-group.csproj`,
    'utf-8',
  );
  const hasPackageReference = await containsPackageReference(
    manifestFileContents,
  );
  expect(hasPackageReference).toBeTruthy();
});

test('.Net C# project does not contain PackageReference as expected', async () => {
  const manifestFileContents = fs.readFileSync(
    `${__dirname}/../fixtures/dotnet-no-packagereference/project.csproj`,
    'utf-8',
  );
  const hasPackageReference = await containsPackageReference(
    manifestFileContents,
  );
  expect(hasPackageReference).toBeFalsy();
});

/*
 ****** vbproj ******
 */
test('.Net Visual Basic project contains PackageReference as expected', async () => {
  const manifestFileContents = fs.readFileSync(
    `${__dirname}/../fixtures/dotnet-vb-simple-project/manifest.vbproj`,
    'utf-8',
  );
  const hasPackageReference = await containsPackageReference(
    manifestFileContents,
  );
  expect(hasPackageReference).toBeTruthy();
});

test('.Net Visual Basic project does not contain PackageReference as expected', async () => {
  const manifestFileContents = fs.readFileSync(
    `${__dirname}/../fixtures/dotnet-no-packagereference/project.vbproj`,
    'utf-8',
  );
  const hasPackageReference = await containsPackageReference(
    manifestFileContents,
  );
  expect(hasPackageReference).toBeFalsy();
});

/*
 ****** fsproj ******
 */
test('.Net F# project contains PackageReference as expected', async () => {
  const manifestFileContents = fs.readFileSync(
    `${__dirname}/../fixtures/dotnet-fs-simple-project/manifest.fsproj`,
    'utf-8',
  );
  const hasPackageReference = await containsPackageReference(
    manifestFileContents,
  );
  expect(hasPackageReference).toBeTruthy();
});

test('.Net F# project does not contain PackageReference as expected', async () => {
  const manifestFileContents = fs.readFileSync(
    `${__dirname}/../fixtures/dotnet-no-packagereference/project.fsproj`,
    'utf-8',
  );
  const hasPackageReference = await containsPackageReference(
    manifestFileContents,
  );
  expect(hasPackageReference).toBeFalsy();
});
