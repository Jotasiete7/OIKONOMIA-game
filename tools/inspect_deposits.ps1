# tools/inspect_deposits.ps1
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
    if (-not $page) { $page = $resp[0] }

    $ws = [System.Net.WebSockets.ClientWebSocket]::new()
    $cts = [System.Threading.CancellationTokenSource]::new(10000)
    $uri = [System.Uri]::new($page.webSocketDebuggerUrl)
    $ws.ConnectAsync($uri, $cts.Token).Wait()

    $script:msgId = 1
    function Send-CDP($method, $params = @{}) {
        $id = $script:msgId++
        $payload = @{ id = $id; method = $method; params = $params } | ConvertTo-Json -Compress -Depth 10
        $bytes = [System.Text.Encoding]::UTF8.GetBytes($payload)
        $seg = [System.ArraySegment[byte]]::new($bytes)
        $ws.SendAsync($seg, [System.Net.WebSockets.WebSocketMessageType]::Text, $true, [System.Threading.CancellationToken]::None).Wait()

        $buffer = [byte[]]::new(65536)
        while ($true) {
            $ms = [System.IO.MemoryStream]::new()
            do {
                $recvSeg = [System.ArraySegment[byte]]::new($buffer)
                $recvRes = $ws.ReceiveAsync($recvSeg, [System.Threading.CancellationToken]::None).Result
                $ms.Write($buffer, 0, $recvRes.Count)
            } while (-not $recvRes.EndOfMessage)
            
            $jsonStr = [System.Text.Encoding]::UTF8.GetString($ms.ToArray())
            $obj = $jsonStr | ConvertFrom-Json
            if ($obj.id -eq $id) {
                if ($obj.error) { throw "CDP Error: $($obj.error.message)" }
                return $obj.result
            }
        }
    }

    function Eval-JS([string]$code) {
        $res = Send-CDP "Runtime.evaluate" @{
            expression = $code
            returnByValue = $true
            awaitPromise = $true
        }
        return $res.result.value
    }

    $null = Send-CDP "Page.enable"
    $null = Send-CDP "Runtime.enable"
    $null = Send-CDP "Page.navigate" @{ url = $url }
    Start-Sleep -Milliseconds 2000

    $code = @'
(() => {
  const summary = {
    gidTerrainCounts: {},
    gidResCounts: {},
    deposits: {
      iron: [],
      oil: [],
      timber: []
    },
    mountains: [],
    hills: [],
    beaches: []
  };

  for (let x = 0; x < 128; x++) {
    for (let y = 0; y < 128; y++) {
      const t = worldGrid[x][y];
      summary.gidTerrainCounts[t.gidTerrain] = (summary.gidTerrainCounts[t.gidTerrain] || 0) + 1;
      summary.gidResCounts[t.gidRes] = (summary.gidResCounts[t.gidRes] || 0) + 1;

      if (t.hasIronDeposit) summary.deposits.iron.push({ x, y, dName: t.district?.name });
      if (t.hasOilDeposit) summary.deposits.oil.push({ x, y, dName: t.district?.name });
      if (t.hasTimberDeposit) summary.deposits.timber.push({ x, y });

      if (t.gidTerrain === 7) summary.mountains.push({ x, y, dName: t.district?.name });
      if (t.gidTerrain === 6) summary.hills.push({ x, y, dName: t.district?.name });
      if (t.gidTerrain === 3) summary.beaches.push({ x, y, dName: t.district?.name });
    }
  }

  return {
    terrainCounts: summary.gidTerrainCounts,
    resCounts: summary.gidResCounts,
    ironCount: summary.deposits.iron.length,
    oilCount: summary.deposits.oil.length,
    timberCount: summary.deposits.timber.length,
    mountainCount: summary.mountains.length,
    hillCount: summary.hills.length,
    beachCount: summary.beaches.length,
    sampleIron: summary.deposits.iron.slice(0, 5),
    sampleOil: summary.deposits.oil.slice(0, 5),
    sampleMountain: summary.mountains.slice(0, 5),
    sampleHill: summary.hills.slice(0, 5),
    sampleBeach: summary.beaches.slice(0, 5)
  };
})()
'@

    $res = Eval-JS $code
    $res | ConvertTo-Json -Depth 5 | Write-Host
}
finally {
    if ($ws -and $ws.State -eq [System.Net.WebSockets.WebSocketState]::Open) {
        try { $ws.CloseAsync([System.Net.WebSockets.WebSocketCloseStatus]::NormalClosure, "Done", [System.Threading.CancellationToken]::None).Wait() } catch {}
    }
    if ($proc -and -not $proc.HasExited) {
        Stop-Process -Id $proc.Id -Force
    }
}
