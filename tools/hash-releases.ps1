param(
  [Parameter(Mandatory=$false)]
  [string]$Path = "."
)

$files = Get-ChildItem -Path $Path -File -Recurse | Where-Object {
  $_.Extension -in '.zip','.exe','.msi'
}

if (-not $files) {
  Write-Host "No .zip, .exe, or .msi release files found in $Path"
  exit 1
}

$out = Join-Path (Resolve-Path $Path) 'SHA256SUMS.txt'
$lines = foreach ($file in $files) {
  $hash = (Get-FileHash -Algorithm SHA256 -Path $file.FullName).Hash.ToLower()
  $relative = Resolve-Path -Relative $file.FullName
  "$hash  $relative"
}

$lines | Set-Content -Encoding UTF8 $out
Write-Host "Wrote SHA-256 hashes to $out"
$lines | ForEach-Object { Write-Host $_ }
