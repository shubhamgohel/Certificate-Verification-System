Param(
    [string]$HtmlPath = "D:\\index77.html",
    [int]$Port = 8080
)

try {
    $resolved = Resolve-Path -Path $HtmlPath -ErrorAction Stop
} catch {
    Write-Error "HTML file not found: $HtmlPath"
    exit 1
}
$full = $resolved.Path
$dir = Split-Path $full -Parent
Set-Location -Path $dir

# If port not in use, start python HTTP server
$portUsed = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
if (-not $portUsed) {
    Start-Process -FilePath "python" -ArgumentList "-m http.server $Port" -WindowStyle Hidden
    Start-Sleep -Milliseconds 800
}

$leaf = Split-Path $full -Leaf

# Find Chrome executable, fallback to default browser
$chromeCmd = Get-Command "chrome.exe" -ErrorAction SilentlyContinue
if (-not $chromeCmd) {
    $chromeCmd = Get-Command "chrome" -ErrorAction SilentlyContinue
}
if ($chromeCmd) {
    Start-Process -FilePath $chromeCmd.Source -ArgumentList "http://localhost:$Port/$leaf"
} else {
    Start-Process "http://localhost:$Port/$leaf"
}

Write-Output "Opened http://localhost:$Port/$leaf"
