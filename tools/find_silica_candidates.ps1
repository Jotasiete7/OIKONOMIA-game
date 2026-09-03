# tools/find_silica_candidates.ps1
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
  // Encontra 4 lotes continentais ideais para jazidas de Sílica:
  // - Inland (distância da água > 2)
  // - Próximo a colinas (gidTerrain === 6) ou bacias de transição rural
  // - 1 na região de Nova Atenas (Oeste), 1 na região Central, 1 em Montargis (Norte), 1 em Várzea (Sul)
  const candidates = [];
  for (let x = 10; x < 118; x++) {
    for (let y = 10; y < 118; y++) {
      const t = worldGrid[x][y];
      if (t.isWater || t.isRoad || t.isPort || t.isMedia || t.hasIronDeposit || t.hasOilDeposit || t.hasTimberDeposit) continue;
      if (t.districtId === 'downtown' || t.districtId === 'northside') continue;
      
      // Checa se é colina ou solo perto de colina
      if (t.gidTerrain === 6 || t.gidTerrain === 7 || t.gidTerrain === 5 || t.gidTerrain === 0) {
        // Verifica se não tem água nos 8 vizinhos
        let hasNearbyWater = false;
        for (let dx = -2; dx <= 2; dx++) {
          for (let dy = -2; dy <= 2; dy++) {
            const nx = x + dx, ny = y + dy;
            if (worldGrid[nx] && worldGrid[nx][ny] && worldGrid[nx][ny].isWater) {
              hasNearbyWater = true;
              break;
            }
          }
          if (hasNearbyWater) break;
        }
        if (!hasNearbyWater) {
          candidates.push({ x, y, cityId: t.city ? t.city.cityId : 'rural', cityName: t.city ? t.city.cityName : 'Interior', gTerrain: t.gidTerrain });
        }
      }
    }
  }

  // Seleciona 4 pontos equilibrados:
  // Ponto 1: Região de Nova Atenas (x: 42, y: 55 aprox - sopé das colinas de Nova Atenas)
  const p1 = candidates.find(c => c.cityId === 'nova_atenas' && (c.gTerrain === 6 || c.gTerrain === 7)) || candidates.find(c => c.x < 50 && c.y > 30);
  // Ponto 2: Região de Montargis (x: 55, y: 85 aprox)
  const p2 = candidates.find(c => c.cityId === 'montargis' && (c.gTerrain === 6 || c.gTerrain === 7)) || candidates.find(c => c.x > 40 && c.x < 65 && c.y > 75);
  // Ponto 3: Região Central / Corredor Industrial (x: 70, y: 55 aprox)
  const p3 = candidates.find(c => c.x >= 65 && c.x <= 80 && c.y >= 45 && c.y <= 65 && (c.gTerrain === 6 || c.gTerrain === 7));
  // Ponto 4: Região de Várzea (Sul / Sudeste x: 85, y: 85 aprox)
  const p4 = candidates.find(c => c.cityId === 'varzea' && (c.gTerrain === 6 || c.gTerrain === 7)) || candidates.find(c => c.x > 80 && c.y > 75);

  return { p1, p2, p3, p4 };
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
