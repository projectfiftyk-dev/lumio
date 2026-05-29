# Kill whatever is on port 8080, then start the Spring Boot app
$port = 8080
$pids = netstat -ano | Select-String ":$port\s" | ForEach-Object {
    ($_ -split '\s+')[-1]
} | Sort-Object -Unique

foreach ($p in $pids) {
    if ($p -match '^\d+$' -and $p -ne '0') {
        Write-Host "Killing PID $p on port $port"
        taskkill /PID $p /F 2>$null
    }
}

Write-Host "Starting lumio-api on port $port..."
mvn spring-boot:run
