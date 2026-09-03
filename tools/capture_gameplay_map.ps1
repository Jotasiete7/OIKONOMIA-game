# tools/capture_gameplay_map.ps1
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
            if ($obj.id -eq $id) { return $obj.result }
        }
    }

    function Eval-JS([string]$code) {
        $res = Send-CDP "Runtime.evaluate" @{ expression = $code; returnByValue = $true; awaitPromise = $true }
        return $res.result.value
    }

    $null = Send-CDP "Page.enable"
    $null = Send-CDP "Runtime.enable"
    $null = Send-CDP "Page.navigate" @{ url = $url }
    Start-Sleep -Seconds 4

    $setupCode = @'
(() => {
  const ls = document.getElementById('loading-screen');
  if (ls) { ls.classList.add('hidden'); ls.style.display = 'none'; }
  const mm = document.getElementById('main-menu-screen');
  if (mm) { mm.classList.add('hidden'); mm.style.display = 'none'; }
  const intro = document.getElementById('intro-screen');
  if (intro) { intro.classList.add('hidden'); intro.style.display = 'none'; }
  
  if (typeof startNewGame === 'function') {
    startNewGame('medium');
  } else if (typeof startGame === 'function') {
    startGame();
  }

  // Desbloqueia todas as cidades
  if (typeof unlockedCities !== 'undefined') {
    unlockedCities.nova_atenas = true;
    unlockedCities.porto_real = true;
    unlockedCities.montargis = true;
    unlockedCities.varzea = true;
  }

  if (typeof centerOnCity === 'function') {
    centerOnCity('nova_atenas');
  }
  camera.zoom = 1.1;
  camera.panY -= 260;
  
  scheduleRender();
  renderMap();
  return { ok: true, zoom: camera.zoom, panX: camera.panX, panY: camera.panY };
})()
'@
    $res = Eval-JS $setupCode
    Start-Sleep -Milliseconds 1500

    $ss = Send-CDP "Page.captureScreenshot" @{ format = "png" }
    $ssBytes = [System.Convert]::FromBase64String($ss.data)
    $ssPath = "d:\OIKONOMIA PROJETO\docs\auditoria\screenshots\nova_atenas_mineral_view.png"
    [System.IO.File]::WriteAllBytes($ssPath, $ssBytes)
    Write-Host "Screenshot salvo com sucesso em: $ssPath" -ForegroundColor Green
}
finally {
    if ($proc -and -not $proc.HasExited) { Stop-Process -Id $proc.Id -Force }
}
