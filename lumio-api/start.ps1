# Reads the server port from application.yml, kills anything on that port, then starts the app.
param(
    [string]$Profile = ""
)

$ErrorActionPreference = 'SilentlyContinue'
$ScriptDir = $PSScriptRoot

# Parse port from application.yml (falls back to 8080 if not found)
$yml = Get-Content "$ScriptDir\src\main\resources\application.yml" -Raw
if ($yml -match 'port:\s*(\d+)') { $port = [int]$Matches[1] } else { $port = 8080 }

# Kill whatever is on the port
$listening = netstat -ano | Select-String ":$port .*LISTENING"
if ($listening) {
    $procId = (($listening.ToString().Trim() -split '\s+') | Where-Object { $_ -match '^\d+$' })[-1]
    if ($procId) {
        Write-Host "Port $port in use by PID $procId — stopping..." -ForegroundColor Yellow
        Stop-Process -Id ([int]$procId) -Force
        Start-Sleep -Milliseconds 600
        Write-Host "Port $port is now free." -ForegroundColor Green
    }
} else {
    Write-Host "Port $port is free." -ForegroundColor Green
}

# Build the Maven command
$mvnArgs = "compile", "exec:exec", "-f", "$ScriptDir\pom.xml"
if ($Profile) { $mvnArgs += "-P", $Profile }

Write-Host "Starting lumio-api on port $port..." -ForegroundColor Cyan
& mvn @mvnArgs
