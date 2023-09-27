// tslint:disable:max-line-length
// tslint:disable:object-literal-key-quotes
import {
  extractTargetFrameworksFromFiles,
  isSupportedByV2GraphGeneration,
} from '../../lib';

describe('Target framework tests', () => {
  it.concurrent(
    '.Net Visual Basic project target framework extracted as expected',
    async () => {
      const targetFrameworks = await extractTargetFrameworksFromFiles(
        `${__dirname}/../fixtures/dotnet-vb-simple-project`,
        'manifest.vbproj',
      );
      expect(targetFrameworks).toEqual(['.NETFramework,Version=v4.6.1']);
    },
  );

  it.concurrent(
    '.Net F# project target framework extracted as expected',
    async () => {
      const targetFrameworks = await extractTargetFrameworksFromFiles(
        `${__dirname}/../fixtures/dotnet-fs-simple-project`,
        'manifest.fsproj',
      );
      expect(targetFrameworks).toEqual(['netcoreapp2.1']);
    },
  );

  /*
   ****** csproj ******
   */

  it.concurrent(
    '.Net .csproj simple project target framework extracted as expected',
    async () => {
      const targetFrameworks = await extractTargetFrameworksFromFiles(
        `${__dirname}/../fixtures/dotnet-core-simple-project`,
        'simple-project.csproj',
      );
      expect(targetFrameworks).toEqual(['netcoreapp1.1', 'netcoreapp1.2']);
    },
  );

  it.concurrent(
    '.Net .csproj simple project target framework with attributes extracted as expected',
    async () => {
      const targetFrameworks = await extractTargetFrameworksFromFiles(
        `${__dirname}/../fixtures/dotnet-core-simple-project-complex-target-frameworks`,
        'simple-project.csproj',
      );

      expect(targetFrameworks).toEqual(['netcoreapp1.1', 'netcoreapp1.2']);
    },
  );

  it.concurrent(
    '.Net .csproj dotnet-empty-manifest target framework extracted',
    async () => {
      const targetFrameworks = await extractTargetFrameworksFromFiles(
        `${__dirname}/../fixtures/dotnet-empty-manifest`,
        'empty-manifest.csproj',
      );
      expect(targetFrameworks).toEqual([]);
    },
  );

  it.concurrent(
    '.Net .csproj multiple target frameworks extracted as expected',
    async () => {
      const targetFrameworks = await extractTargetFrameworksFromFiles(
        `${__dirname}/../fixtures/dotnet-multiple-target-frameworks`,
        'multi-target.csproj',
      );

      expect(targetFrameworks).toEqual(['netstandard2.0', 'net462']);
    },
  );

  /*
   ****** fsproj ******
   */

  it.concurrent(
    '.Net .fsproj simple project target framework extracted as expected',
    async () => {
      const targetFrameworks = await extractTargetFrameworksFromFiles(
        `${__dirname}/../fixtures/dotnet-fs-simple-project`,
        'manifest.fsproj',
      );

      expect(targetFrameworks).toEqual(['netcoreapp2.1']);
    },
  );

  /*
   ****** packages.config ******
   */

  it.concurrent(
    '.Net packages.config single target framework extracted as expected',
    async () => {
      const targetFrameworks = await extractTargetFrameworksFromFiles(
        `${__dirname}/../fixtures/dotnet-simple-project`,
        'packages.config',
      );

      expect(targetFrameworks).toEqual(['net46']);
    },
  );

  it.concurrent(
    '.Net packages.config multiple target frameworks extracted as expected',
    async () => {
      const targetFrameworks = await extractTargetFrameworksFromFiles(
        `${__dirname}/../fixtures/dotnet-multiple-target-frameworks`,
        'packages.config',
      );

      expect(targetFrameworks).toEqual(['net46', 'net451']);
    },
  );

  it.concurrent(
    '.Net packages.config dotnet-empty-manifest target framework extracted',
    async () => {
      const targetFrameworks = await extractTargetFrameworksFromFiles(
        `${__dirname}/../fixtures/dotnet-empty-manifest`,
        'packages.config',
      );
      expect(targetFrameworks).toEqual([]);
    },
  );

  /*
   ****** project.json ******
   */

  it.concurrent(
    '.Net project.json single target framework extracted as expected',
    async () => {
      const targetFrameworks = await extractTargetFrameworksFromFiles(
        `${__dirname}/../fixtures/dotnet-project-json`,
        'standard-project.json',
      );

      expect(targetFrameworks).toEqual(['netcoreapp1.0']);
    },
  );

  it.concurrent(
    '.Net project.json multiple target frameworks extracted as expected',
    async () => {
      const targetFrameworks = await extractTargetFrameworksFromFiles(
        `${__dirname}/../fixtures/dotnet-project-json`,
        'utf-8-with-bom-project.json',
      );
      expect(targetFrameworks).toEqual(['netcoreapp1.0', 'net451']);
    },
  );

  /*
   ****** project.assets.json ******
   */

  it.concurrent(
    '.Net project.assets.json single target framework extracted as expected',
    async () => {
      const targetFrameworks = await extractTargetFrameworksFromFiles(
        `${__dirname}/../fixtures/dotnet-project-assets`,
        'project.assets.json',
      );
      expect(targetFrameworks).toEqual(['.NETCoreApp,Version=v2.0']);
    },
  );

  it.concurrent(
    '.Net project.assets.json multiple target frameworks extracted as expected',
    async () => {
      const targetFrameworks = await extractTargetFrameworksFromFiles(
        `${__dirname}/../fixtures/dotnet-project-assets-multiple-target-frameworks`,
        'project.assets.json',
      );

      expect(targetFrameworks).toEqual([
        '.NETCoreApp,Version=v1.0',
        '.NETCoreApp,Version=v2.2',
      ]);
    },
  );

  it.concurrent(
    '.Net project.assets.json dotnet-empty-project-assets target framework extracted',
    async () => {
      const targetFrameworks = await extractTargetFrameworksFromFiles(
        `${__dirname}/../fixtures/dotnet-empty-project-assets`,
        'project.assets.json',
      );
      expect(targetFrameworks).toEqual([]);
    },
  );

  it.concurrent('.Net project.assets.json is not valid json', async () => {
    try {
      const targetFrameworks = await extractTargetFrameworksFromFiles(
        `${__dirname}/../fixtures/dotnet-invalid-project-assets`,
        'project.assets.json',
      );

      fail('Should throw an error for failing to extract the target framework');
    } catch (err: any) {
      expect(err.message).toBe('Unable to parse manifest file');
    }
  });

  it.each([
    {
      targetFramework: '',
      expected: false,
    },
    {
      targetFramework: 'foobar',
      expected: false,
    },
    // Windows Store
    {
      targetFramework: 'netcore45',
      expected: false,
    },
    // .NET Standard
    {
      targetFramework: 'netstandard1.5',
      expected: true,
    },
    // .NET Core
    {
      targetFramework: 'netcoreapp3.1',
      expected: true,
    },
    // .NET >= 5
    {
      targetFramework: 'net7.0',
      expected: true,
    },
    // .NET Framework < 5
    {
      targetFramework: 'net403',
      expected: false,
    },
    // .NET Framework < 5
    {
      targetFramework: 'net48',
      expected: false,
    },
  ])(
    'accepts or rejects specific target frameworks for runtime assembly parsing when targetFramework is: $targetFramework.original',
    ({ targetFramework, expected }) => {
      expect(isSupportedByV2GraphGeneration(targetFramework)).toEqual(expected);
    },
  );
});
