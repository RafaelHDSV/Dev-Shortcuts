# Regenerate media/icon.png from media/icon.svg (same bolt path; explicit colors for PNG export).
# Edit media/icon.svg, then sync the <path d="..."> into media/icon-render.svg if you change the shape.
# Requires: npx @resvg/resvg-js-cli

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Push-Location $root
try {
    if (-not (Test-Path "media/icon-render.svg")) {
        Write-Error "Missing media/icon-render.svg"
    }
    npx --yes @resvg/resvg-js-cli media/icon-render.svg media/icon.png
    $bytes = (Get-Item "media/icon.png").Length
    Write-Host "Wrote media/icon.png ($bytes bytes)"
}
finally {
    Pop-Location
}
