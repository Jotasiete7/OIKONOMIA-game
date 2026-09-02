# tools/test_cdp_ps.ps1
$edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$url = "file:///D:/OIKONOMIA%20PROJETO/client/index.html"

$proc = Start-Process -FilePath $edgePath -ArgumentList @(
    "--headless=new",
    "--remote-debugging-port=9222",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "--window-size=1920,1080",
    "about:blank"
) -PassThru

Start-Sleep -Milliseconds 2500

try {
    $resp = Invoke-RestMethod -Uri "http://127.0.0.1:9222/json"
    $page = $resp | Where-Object { $_.type -eq 'page' } | Select-Object -First 1
    if (-not $page) { $page = $resp[0] }
    Write-Host "Connected to Edge CDP: $($page.webSocketDebuggerUrl)" -ForegroundColor Green

    $ws = [System.Net.WebSockets.ClientWebSocket]::new()
    $cts = [System.Threading.CancellationTokenSource]::new(10000)
    $uri = [System.Uri]::new($page.webSocketDebuggerUrl)
    $ws.ConnectAsync($uri, $cts.Token).Wait()
    Write-Host "WebSocket State: $($ws.State)" -ForegroundColor Green

    # Function to send CDP command
    function Send-CDP($id, $method, $params) {
        $payload = @{ id = $id; method = $method; params = $params } | ConvertTo-Json -Compress -Depth 10
        $bytes = [System.Text.Encoding]::UTF8.GetBytes($payload)
        $seg = [System.ArraySegment[byte]]::new($bytes)
        $ws.SendAsync($seg, [System.Net.WebSockets.WebSocketMessageType]::Text, $true, [System.Threading.CancellationToken]::None).Wait()

        $buffer = [byte[]]::new(65536)
        $ms = [System.IO.MemoryStream]::new()
        do {
            $recvSeg = [System.ArraySegment[byte]]::new($buffer)
            $recvRes = $ws.ReceiveAsync($recvSeg, [System.Threading.CancellationToken]::None).Result
            $ms.Write($buffer, 0, $recvRes.Count)
        } while (-not $recvRes.EndOfMessage)
        
        $jsonStr = [System.Text.Encoding]::UTF8.GetString($ms.ToArray())
        return ($jsonStr | ConvertFrom-Json)
    }

    # Enable Page & Runtime
    $null = Send-CDP 1 "Page.enable" @{}
    $null = Send-CDP 2 "Runtime.enable" @{}
    $null = Send-CDP 3 "Page.navigate" @{ url = $url }
    Start-Sleep -Milliseconds 2000

    # Evaluate in page
    $evalRes = Send-CDP 4 "Runtime.evaluate" @{
        expression = "document.title + ' | Version: ' + (typeof GAME_VERSION_INFO !== 'undefined' ? GAME_VERSION_INFO.fullString : 'N/A')"
        returnByValue = $true
    }
    Write-Host "Eval Result: $($evalRes.result.value)" -ForegroundColor Cyan

    $ws.CloseAsync([System.Net.WebSockets.WebSocketCloseStatus]::NormalClosure, "Done", [System.Threading.CancellationToken]::None).Wait()
}
finally {
    if ($proc -and -not $proc.HasExited) {
        Stop-Process -Id $proc.Id -Force
    }
}
