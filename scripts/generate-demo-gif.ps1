# Regenerate media/demo.gif from media/demo.mp4 (first 22s, ~800px wide).
# Requires ffmpeg on PATH: winget install Gyan.FFmpeg

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$mp4 = Join-Path $root "media\demo.mp4"
$gif = Join-Path $root "media\demo.gif"

if (-not (Test-Path $mp4)) {
    Write-Error "Missing $mp4"
}

$vf = "fps=10,scale=800:-1:flags=lanczos,split[s0][s1];[s0]palettegen=stats_mode=diff[p];[s1][p]paletteuse=dither=bayer:bayer_scale=5"

ffmpeg -y -i $mp4 -t 22 -vf $vf -loop 0 $gif
Write-Host "Wrote $gif ($((Get-Item $gif).Length) bytes)"
