# Reads the server port from application.yml, kills anything on that port, then starts the app.
param(
    [string]$Profile = ""
)

$ErrorActionPreference = 'SilentlyContinue'
$ScriptDir = $PSScriptRoot

# Parse port from application.yml (falls back to 8080 if not found)
$yml = Get-Content "$ScriptDir\src\main\resources\application.yml" -Raw
if ($yml -match 'port:\s*(\d+)') { $port = [int]$Matches[1] } else { $port = 8080 }

# Kill all processes listening on the port
$connections = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
if ($connections) {
    $pids = $connections.OwningProcess | Sort-Object -Unique
    foreach ($procId in $pids) {
        if ($procId -and $procId -gt 0) {
            Write-Host "Port $port in use by PID $procId — stopping..." -ForegroundColor Yellow
            Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
        }
    }
    # Wait until the port is actually released
    $waited = 0
    while ((Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue) -and $waited -lt 10) {
        Start-Sleep -Milliseconds 300
        $waited++
    }
    Write-Host "Port $port is now free." -ForegroundColor Green
} else {
    Write-Host "Port $port is free." -ForegroundColor Green
}

# Build the Maven command
$mvnArgs = "spring-boot:run", "-f", "$ScriptDir\pom.xml"
if ($Profile) { $mvnArgs += "-Dspring-boot.run.profiles=$Profile" }

Write-Host "Starting lumio-api on port $port$(if ($Profile) { " [profile: $Profile]" })..." -ForegroundColor Cyan
& mvn @mvnArgs
