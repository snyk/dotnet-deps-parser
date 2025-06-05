import {
  extractTargetFrameworksFromFiles,
  extractProjectSdkFromProjectFile,
  isSupportedByV2GraphGeneration,
  isSupportedByV3GraphGeneration,
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
    '.Net .csproj dotnet-empty-property-group target framework extracted',
    async () => {
      const targetFrameworks = await extractTargetFrameworksFromFiles(
        `${__dirname}/../fixtures/dotnet-empty-property-group`,
        'empty-property-group.csproj',
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

  it.concurrent(
    '.Net packages.config dotnet-empty-property-group target framework extracted',
    async () => {
      const targetFrameworks = await extractTargetFrameworksFromFiles(
        `${__dirname}/../fixtures/dotnet-empty-property-group`,
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
      await extractTargetFrameworksFromFiles(
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
      expected: false,
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
    // .NET Framework < 5 with dot
    {
      targetFramework: 'net4.8',
      expected: false,
    },
  ])(
    'accepts or rejects specific target frameworks for runtime assembly parsing when targetFramework is: $targetFramework.original',
    ({ targetFramework, expected }) => {
      expect(isSupportedByV2GraphGeneration(targetFramework)).toEqual(expected);
    },
  );
});

describe('SDK project type tests', () => {
  it.each([
    {
      description: 'Project Sdk attribute - Web',
      manifest: `
      <Project Sdk="Microsoft.NET.Sdk.Web">
      </Project>
      `,
      expectedProjectSdk: 'Microsoft.NET.Sdk.Web',
    },
    {
      description: 'Project Sdk attribute - MSBuild',
      manifest: `
      <Project Sdk="MSBuild.Sdk.Extras/2.0.54">
      </Project>
      `,
      expectedProjectSdk: 'MSBuild.Sdk.Extras/2.0.54',
    },
    {
      description: 'Top level Sdk element - MSTest',
      manifest: `
      <Project>
        <Sdk Name="MSTest.Sdk/3.8.3" />
      </Project>
      `,
      expectedProjectSdk: 'MSTest.Sdk/3.8.3',
    },
    {
      description:
        'Additive Sdk elements (project attribute takes precedence) - Aspire',
      manifest: `
      <Project Sdk="Microsoft.NET.Sdk">
        <Sdk Name="Aspire.AppHost.Sdk" Version="9.0.0" />
        <ItemGroup>
          <PackageReference Include="Aspire.Hosting.AppHost" Version="9.0.0"/>
        </ItemGroup>
      </Project>
      `,
      expectedProjectSdk: 'Microsoft.NET.Sdk',
    },
    {
      description: 'Custom csproj not using and SDK',
      manifest: `
      <?xml version="1.0" encoding="utf-8"?>
      <Project ToolsVersion="15.0" DefaultTargets="Build" xmlns="http://schemas.microsoft.com/developer/msbuild/2003">
        <Import Project="$(MSBuildExtensionsPath)\\$(MSBuildToolsVersion)\\Microsoft.Common.props" Condition="Exists('$(MSBuildExtensionsPath)\\$(MSBuildToolsVersion)\\Microsoft.Common.props')" />
        <PropertyGroup>
          <Configuration Condition=" '$(Configuration)' == '' ">Debug</Configuration>
          <Platform Condition=" '$(Platform)' == '' ">AnyCPU</Platform>
          <ProjectGuid>{A1B2C3D4-E5F6-7890-1234-567890ABCDEF}</ProjectGuid>
          <OutputType>Exe</OutputType>
          <AppDesignerFolder>Properties</AppDesignerFolder>
          <RootNamespace>MyLegacyNetFxApp</RootNamespace>
          <AssemblyName>MyLegacyNetFxApp</AssemblyName>
          <TargetFrameworkVersion>v4.6.2</TargetFrameworkVersion>
          <FileAlignment>512</FileAlignment>
          <AutoGenerateBindingRedirects>true</AutoGenerateBindingRedirects>
          <Deterministic>true</Deterministic>
        </PropertyGroup>
        <PropertyGroup Condition=" '$(Configuration)|$(Platform)' == 'Debug|AnyCPU' ">
          <PlatformTarget>AnyCPU</PlatformTarget>
          <DebugSymbols>true</DebugSymbols>
          <DebugType>full</DebugType>
          <Optimize>false</Optimize>
          <OutputPath>bin\\Debug\\</OutputPath>
          <DefineConstants>DEBUG;TRACE</DefineConstants>
          <ErrorReport>prompt</ErrorReport>
          <WarningLevel>4</WarningLevel>
        </PropertyGroup>
        <Import Project="$(MSBuildToolsPath)\\Microsoft.CSharp.targets" />
      </Project>
      `,
      expectedProjectSdk: undefined,
    },
    {
      description: 'Unsupported SDK - Godot',
      manifest: `
      <Project Sdk="Godot.NET.Sdk/4.3.0">
      </Project>
      `,
      expectedProjectSdk: 'Godot.NET.Sdk/4.3.0',
    },
    {
      description: 'Unsupported SDK - Uno',
      manifest: `
      <Project Sdk="Uno.Sdk/6.0.96">
      </Project>
      `,
      expectedProjectSdk: 'Uno.Sdk/6.0.96',
    },
  ])(
    '.Net .csproj is SDK-style project: $description',
    async ({ manifest, expectedProjectSdk }) => {
      const projectSdk = await extractProjectSdkFromProjectFile(manifest);
      expect(projectSdk).toEqual(expectedProjectSdk);
    },
  );

  it.each([
    // No target framework, no way to restore the project.
    {
      targetFramework: '',
      projectSdk: 'Microsoft.NET.Sdk',
      expected: false,
    },
    // .NET Core with NET SDK.
    {
      targetFramework: 'netcoreapp3.1',
      projectSdk: 'Microsoft.NET.Sdk',
      expected: true,
    },
    // .NET Standard.
    {
      targetFramework: 'netstandard1.5',
      projectSdk: 'Microsoft.NET.Sdk',
      expected: true,
    },
    // .NET >= 5
    {
      targetFramework: 'net7.0',
      projectSdk: 'Microsoft.NET.Sdk',
      expected: true,
    },
    // .NET Framework 3.5
    {
      targetFramework: 'net35',
      projectSdk: 'Microsoft.NET.Sdk',
      expected: true,
    },
    // .NET Framework 4
    {
      targetFramework: 'net481',
      projectSdk: 'Microsoft.NET.Sdk',
      expected: true,
    },
    // Uno SDK with any supported .NET framework.
    {
      targetFramework: 'net9.0',
      projectSdk: 'Uno.Sdk/6.0.96',
      expected: true,
    },
    // Unsupported Godot SDK, as it generated project.assets.json in a subfolder of .godot and requires mono.
    {
      targetFramework: 'net9.0',
      projectSdk: 'Godot.NET.Sdk/4.3.0',
      expected: false,
    },
    // Missing SDK is unsupported, as it defines how and where msbuild generates project.assets.json.
    {
      targetFramework: 'net9.0',
      projectSdk: undefined,
      expected: false,
    },
  ])(
    'is v3 graph generation supported for: $targetFramework + $projectSdk',
    async ({ targetFramework, projectSdk, expected }) => {
      expect(
        isSupportedByV3GraphGeneration(targetFramework, projectSdk),
      ).toEqual(expected);
    },
  );
});
