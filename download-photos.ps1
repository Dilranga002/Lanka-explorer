# Lanka Explorer - OPTIONAL photos downloader (Unsplash)
# Use from inside the lanka-explorer folder:
# powershell -ExecutionPolicy Bypass -File .\download-photos.ps1
# Site already uses live Unsplash photos when online; downloading is not required.

$ErrorActionPreference = 'Stop'
$folder = Join-Path $PSScriptRoot 'images'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
$photos = @(
  @{name='sigiriya.jpg'; url='https://images.unsplash.com/photo-1711100360031-24aaccbcd408?fit=crop&w=1200&fm=jpg&q=78'},
  @{name='ella.jpg'; url='https://images.unsplash.com/photo-1559038267-bfa6d8d3a160?fit=crop&w=1200&fm=jpg&q=78'},
  @{name='galle-fort.jpg'; url='https://images.unsplash.com/photo-1704797390325-b057758d8c3d?fit=crop&w=1200&fm=jpg&q=78'},
  @{name='mirissa.jpg'; url='https://images.unsplash.com/photo-1778509392604-40b57678d56e?fit=crop&w=1200&fm=jpg&q=78'},
  @{name='yala.jpg'; url='https://images.unsplash.com/photo-1661768508643-e260f6f8e06c?fit=crop&w=1200&fm=jpg&q=78'},
  @{name='anuradhapura.jpg'; url='https://images.unsplash.com/photo-1621393614326-2f9ed389ce02?fit=crop&w=1200&fm=jpg&q=78'},
  @{name='polonnaruwa.jpg'; url='https://images.unsplash.com/photo-1709729519591-2fb2d25395df?fit=crop&w=1200&fm=jpg&q=78'},
  @{name='nuwara-eliya.jpg'; url='https://images.unsplash.com/photo-1585171328560-947fbd92d6f0?fit=crop&w=1200&fm=jpg&q=78'},
  @{name='minneriya.jpg'; url='https://images.unsplash.com/photo-1619183318129-cd95bc882275?fit=crop&w=1200&fm=jpg&q=78'},
  @{name='arugam-bay.jpg'; url='https://images.unsplash.com/photo-1503384861219-7f20f2f111cc?fit=crop&w=1200&fm=jpg&q=78'}
)
$ok = 0
$failed = 0
foreach ($photo in $photos) {
  $target = Join-Path $folder $photo.name
  $downloaded = $false
  for ($attempt = 1; $attempt -le 3 -and -not $downloaded; $attempt++) {
    try {
      Write-Host "Downloading $($photo.name) - attempt $attempt ..."
      Invoke-WebRequest -Uri $photo.url -OutFile $target -TimeoutSec 35 -UserAgent "Mozilla/5.0 LankaExplorerStudentProject" -ErrorAction Stop
      if (-not (Test-Path $target)) { throw "File missing" }
      $file = Get-Item $target
      if ($file.Length -lt 2500) { throw "Downloaded file too small" }
      $bytes = [System.IO.File]::ReadAllBytes($target)
      if (($bytes[0] -ne 255) -or ($bytes[1] -ne 216) -or ($bytes[2] -ne 255)) { throw "Not a JPEG image" }
      $downloaded = $true
    } catch {
      Write-Warning "Could not download $($photo.name) (attempt $attempt): $($_.Exception.Message)"
      if (Test-Path $target) { Remove-Item $target -Force }
      if ($attempt -lt 3) { Start-Sleep -Seconds (3 * $attempt) }
    }
  }
  if ($downloaded) {
    # Replace this photo URL with a local path throughout the project.
    $localUrl = "images/$($photo.name)"
    $htmlUrl = $photo.url.Replace("&", "&amp;")
    foreach ($file in (Get-ChildItem -Path $PSScriptRoot -File -Filter "*.html")) {
      $source = [System.IO.File]::ReadAllText($file.FullName)
      $source = $source.Replace($htmlUrl, $localUrl).Replace($photo.url, $localUrl)
      [System.IO.File]::WriteAllText($file.FullName, $source, [System.Text.UTF8Encoding]::new($false))
    }
    $jsonFile = Join-Path $PSScriptRoot "data\destinations.json"
    $json = [System.IO.File]::ReadAllText($jsonFile).Replace($photo.url, $localUrl)
    [System.IO.File]::WriteAllText($jsonFile, $json, [System.Text.UTF8Encoding]::new($false))
    $cssFile = Join-Path $PSScriptRoot "css\style.css"
    $css = [System.IO.File]::ReadAllText($cssFile).Replace($photo.url, "../images/$($photo.name)")
    [System.IO.File]::WriteAllText($cssFile, $css, [System.Text.UTF8Encoding]::new($false))
    $ok++
    Write-Host "Saved $($photo.name) and updated website links." -ForegroundColor Green
  } else {
    $failed++
    Write-Warning "Could not save $($photo.name). Online image path is unchanged. Download manually from PHOTO_CREDITS.md if needed."
  }
  Start-Sleep -Seconds 2
}
Write-Host "Completed. Successful: $ok / 10. Failed: $failed / 10."
if ($failed -gt 0) { Write-Host "Internet/WAF limits may block automated downloads. Site uses online photos until local files are saved." -ForegroundColor Yellow }
