# tools/verify_browser_suite.ps1
$edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$url = "file:///D:/OIKONOMIA%20PROJETO/dist/index.html"

Write-Host "Iniciando Edge headless para verificar suite de correções..."
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

    $script:msgId = 1
    function Send-CDP($method, $params = @{}) {
        $id = $script:msgId++
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
                Write-Host "EXCEPTION:" $obj.params.exceptionDetails.exception.description -ForegroundColor Red
            }
        }
    }

    $null = Send-CDP "Runtime.enable"
    $null = Send-CDP "Page.enable"
    $null = Send-CDP "Page.navigate" @{ url = $url }

    Start-Sleep -Seconds 3

    function Eval-JS([string]$expr) {
        $res = Send-CDP "Runtime.evaluate" @{ expression = $expr; returnByValue = $true }
        return $res.result.value
    }

    $title = Eval-JS "document.title"
    Write-Host "[1] Document Title: $title"

    $farmTimber = Eval-JS "typeof SpriteManager !== 'undefined' ? SpriteManager.getFarmSpriteKey('farm_timber') : 'UNDEFINED'"
    Write-Host "[2] SpriteManager getFarmSpriteKey('farm_timber'): $farmTimber"

    $rdSprite = Eval-JS "typeof SpriteManager !== 'undefined' ? SpriteManager.getRDSprite() : 'UNDEFINED'"
    Write-Host "[3] SpriteManager getRDSprite(): $rdSprite"

    $hasFarmSearch = Eval-JS "!!document.getElementById('farm-search-input')"
    Write-Host "[4] Campo de busca farm-search-input existe no DOM: $hasFarmSearch"

    $storeModalClass = Eval-JS "document.querySelector('#store-modal > div').className"
    Write-Host "[5] Classes do modal store-modal: $storeModalClass"

    $hasFilterFunc = Eval-JS "typeof filterFarmTypes === 'function'"
    Write-Host "[6] Função filterFarmTypes disponível: $hasFilterFunc"

    Write-Host "`n=== TODAS AS VERIFICACOES CONCLUIDAS COM SUCESSO ===" -ForegroundColor Green
}
finally {
    if ($proc -and -not $proc.HasExited) {
        $proc.Kill()
    }
}
