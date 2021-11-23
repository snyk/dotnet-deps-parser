import * as parsers from '../../lib/parsers/index';

describe('Tests for property group tag', () => {
  afterEach(() => jest.resetAllMocks());

  it('should not fail when there is an property group tag', async () => {
    jest
      .spyOn(parsers, 'getDependenciesFromPackageReference')
      .mockImplementation(() =>
        Promise.resolve({
          dependencies: {
            foo: {
              name: 'foo',
              version: '1.0.0',
              dependencies: {},
            },
          },
          hasDevDependencies: false,
        }),
      );

    const propertyGroup = [
      {
        RuntimeIdentifiers: ['win-x64;linux-x64'],
        TargetFramework: ['netcoreapp3.1'],
        AzureFunctionsVersion: ['v3'],
        UserSecretsId: ['d7b31cfb-0edc-44d5-8646-ca9de9592e1e'],
        CodeAnalysisRuleSet: ['../../Settings.StyleCop'],
        TreatWarningsAsErrors: ['false'],
        LangVersion: ['latest'],
        Nullable: ['enable'],
        ProjectGuid: ['{37e13009-759c-4c94-8aa2-91a9a8da7a13}'],
      },
      '\n\n  ',
    ];

    const mockManifestFile = {
      Project: {
        PropertyGroup: propertyGroup,
      },
    };

    expect(
      parsers.getDependencyTreeFromProjectFile(mockManifestFile),
    ).toBeTruthy();
  });

  it('should not fail when there is not an empty property group tag ', async () => {
    jest
      .spyOn(parsers, 'getDependenciesFromPackageReference')
      .mockImplementation(() =>
        Promise.resolve({
          dependencies: {
            foo: {
              name: 'foo',
              version: '1.0.0',
              dependencies: {},
            },
          },
          hasDevDependencies: false,
        }),
      );

    const propertyGroup = [
      {
        RuntimeIdentifiers: ['win-x64;linux-x64'],
        TargetFramework: ['netcoreapp3.1'],
        AzureFunctionsVersion: ['v3'],
        UserSecretsId: ['d7b31cfb-0edc-44d5-8646-ca9de9592e1e'],
        CodeAnalysisRuleSet: ['../../Settings.StyleCop'],
        TreatWarningsAsErrors: ['false'],
        LangVersion: ['latest'],
        Nullable: ['enable'],
        ProjectGuid: ['{37e13009-759c-4c94-8aa2-91a9a8da7a13}'],
      },
      {
        RuntimeIdentifiers: ['win-x64;linux-x64'],
        TargetFramework: ['netcoreapp3.1'],
      },
    ];

    const mockManifestFile = {
      Project: {
        PropertyGroup: propertyGroup,
      },
    };

    expect(
      parsers.getDependencyTreeFromProjectFile(mockManifestFile),
    ).toBeTruthy();
  });
});
