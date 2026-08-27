[CmdletBinding()]
param(
    [ValidateSet('List', 'Login', 'Wuling')]
    [string]$Mode = 'List',

    [Parameter(Mandatory = $true)]
    [ValidateNotNullOrEmpty()]
    [string]$StreamingAssets,

    [switch]$IncludeMainBundleScan
)

$ErrorActionPreference = 'Stop'
$workspaceRoot = Split-Path -Parent $PSScriptRoot
$toolDll = Join-Path $workspaceRoot 'research\tools\EndfieldStudio\AnimeStudio.Endfield.Cli\bin\Release\net9.0\endfield-dump.dll'

if (-not (Test-Path -LiteralPath $StreamingAssets -PathType Container)) {
    throw "StreamingAssets not found: $StreamingAssets"
}

if (-not (Test-Path -LiteralPath $toolDll -PathType Leaf)) {
    throw "Extractor is not built: $toolDll"
}

$env:DOTNET_ROLL_FORWARD = 'Major'

if ($Mode -eq 'List') {
    & dotnet $toolDll list --vfs $StreamingAssets
    exit $LASTEXITCODE
}

if ($Mode -eq 'Login') {
    $outputDir = Join-Path $workspaceRoot 'research\raw\ui-smoke\login'
    $scratchDir = Join-Path $workspaceRoot 'research\temp\initial-bundles'
    & dotnet $toolDll extract --vfs $StreamingAssets --block InitialBundle --out $outputDir --scratch $scratchDir --names '^login_(endfield_logo|deco|loading|popup|rightbtn|serverbtn)' --threads 4 --format png --png-fast --max-memory-mb 8192 --max-bundle-allocation-mb 256
    exit $LASTEXITCODE
}

if (-not $IncludeMainBundleScan) {
    throw 'Wuling mode scans the full main Bundle index. Re-run with -IncludeMainBundleScan after reviewing the command.'
}

$outputDir = Join-Path $workspaceRoot 'research\raw\ui-wuling\activity-guide'
$scratchDir = Join-Path $workspaceRoot 'research\temp\main-bundles'
& dotnet $toolDll extract --vfs $StreamingAssets --block Bundle --out $outputDir --scratch $scratchDir --names '^deco_guide_(wuling|xirang)' --threads 4 --format png --png-fast --max-memory-mb 8192 --max-bundle-allocation-mb 256
exit $LASTEXITCODE

