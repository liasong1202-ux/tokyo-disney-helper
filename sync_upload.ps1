$srcDir = 'C:\Users\USER\.gemini\antigravity\scratch\tokyo_disney_helper'
$destDir = 'C:\tokyo_disney_upload'

if (Test-Path $destDir) {
    Remove-Item -Path $destDir -Recurse -Force
}
New-Item -ItemType Directory -Path $destDir -Force | Out-Null

# Copy only project essentials
Get-ChildItem -Path $srcDir | Where-Object { 
    $_.Name -notmatch '^(node_modules|\.git|dist_old)$' -and
    $_.Name -notmatch '^screenshot_.*\.png$' -and
    $_.Name -notmatch '^verify_.*\.cjs$' -and
    $_.Name -notmatch '^(make_api\.py|sync_upload\.ps1)$'
} | ForEach-Object {
    Copy-Item -Path $_.FullName -Destination $destDir -Recurse -Force
}

$files = (Get-ChildItem -Path $destDir -Recurse -File).Count
Write-Output "SYNC_DONE: $files files"
