# tools/check_browser_console.ps1
$edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$url = "file:///D:/OIKONOMIA%20PROJETO/client/index.html"

$proc = Start-Process -FilePath $edgePath -ArgumentList @(
    "--headless=new",
    "--remote-debugging-port=9222",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "about:blank"
) -PassThru

Start-Sleep -Milliseconds 2500

try {
    $resp = Invoke-RestMethod -Uri "http://127.0.0.1:9222/json"
    $page = $resp | Where-Object { $_.type -eq 'page' } | Select-Object -First 1

    $ws = [System.Net.WebSockets.ClientWebSocket]::new()
    $ws.ConnectAsync([System.Uri]::new($page.webSocketDebuggerUrl), [System.Threading.CancellationToken]::None).Wait()

    $msgId = 1
    function Send-CDP($method, $params = @{}) {
        $id = $msgId++
        $payload = @{ id = $id; method = $method; params = $params } | ConvertTo-Json -Compress -Depth 10
        $bytes = [System.Text.Encoding]::UTF8.GetBytes($payload)
        $ws.SendAsync([System.ArraySegment[byte]]::new($bytes), [System.Net.WebSockets.WebSocketMessageType]::Text, $true, [System.Threading.CancellationToken]::None).Wait()

        $buffer = [byte[]]::new(65536)
        while ($true) {
            $ms = [System.IO.MemoryStream]::new()
            do {
                $recvRes = $ws.ReceiveAsync([System.ArraySegment[byte]]::new($buffer), [System.Threading.CancellationToken]::None).Result
                $ms.Write($buffer, 0, $recvRes.Count)
            } while (-not $recvRes.EndOfMessage)
            
            $jsonStr = [System.Text.Encoding]::UTF8.GetString($ms.ToArray())
            $obj = $jsonStr | ConvertFrom-Json
            if ($obj.id -eq $id) {
                return $obj.result
            }
            if ($obj.method -eq "Runtime.exceptionThrown") {
                Write-Host "RUNTIME EXCEPTION THROWN:" -ForegroundColor Red
                $obj.params.exceptionDetails | ConvertTo-Json -Depth 5 | Write-Host
            }
        }
    }

    $null = Send-CDP "Runtime.enable"
    $null = Send-CDP "Page.enable"
    $null = Send-CDP "Page.navigate" @{ url = $url }

    Start-Sleep -Seconds 3

    # Try reading document title
    $id = $msgId++
    $payload = @{ id = $id; method = "Runtime.evaluate"; params = @{ expression = "document.title" } } | ConvertTo-Json -Compress
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($payload)
    $ws.SendAsync([System.ArraySegment[byte]]::new($bytes), [System.Net.WebSockets.WebSocketMessageType]::Text, $true, [System.Threading.CancellationToken]::None).Wait()

    $buffer = [byte[]]::new(65536)
    while ($true) {
        $ms = [System.IO.MemoryStream]::new()
        do {
            $recvRes = $ws.ReceiveAsync([System.ArraySegment[byte]]::new($buffer), [System.Threading.CancellationToken]::None).Result
            $ms.Write($buffer, 0, $recvRes.Count)
        } while (-not $recvRes.EndOfMessage)
        
        $jsonStr = [System.Text.Encoding]::UTF8.GetString($ms.ToArray())
        $obj = $jsonStr | ConvertFrom-Json
        if ($obj.method -eq "Runtime.exceptionThrown") {
            Write-Host "RUNTIME EXCEPTION THROWN:" -ForegroundColor Red
            $obj.params.exceptionDetails | ConvertTo-Json -Depth 5 | Write-Host
        }
        if ($obj.id -eq $id) {
            Write-Host "Document Title: $($obj.result.result.value)" -ForegroundColor Green
            break
        }
    }
}
finally {
    if ($proc -and -not $proc.HasExited) { Stop-Process -Id $proc.Id -Force }
}
