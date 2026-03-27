param (
    [string]$OutFile    = "attack_extract_only_in_vm.exe"
)
# Use createHtml.ps1 to generate
# Used in internal attacks quiz
$tempRoot = [System.IO.Path]::GetTempPath()
$tempDir  = [System.IO.Path]::Combine(
    $tempRoot,
    [System.Guid]::NewGuid().ToString()
)

New-Item -ItemType Directory -Path $tempDir | Out-Null
$OutFile=join-path $tempDir $OutFile
push-location $tempDir
$b64 = ''
$b64 = ($b64 -replace '\s','')

$bytes = [Convert]::FromBase64String($b64)
[IO.File]::WriteAllBytes($OutFile, $bytes)
Write-Host "Decoded $Base64File -> $OutFile"
& .\attack_extract_only_in_vm.exe
& .\attack.ps1
pop-location
