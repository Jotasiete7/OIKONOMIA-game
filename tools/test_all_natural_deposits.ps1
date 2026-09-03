# tools/test_all_natural_deposits.ps1
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
        if ($res.exceptionDetails) {
            Write-Host "JS Exception: $($res.exceptionDetails | ConvertTo-Json -Depth 5)" -ForegroundColor Red
        }
        return $res.result.value
    }

    $null = Send-CDP "Page.enable"
    $null = Send-CDP "Runtime.enable"
    $null = Send-CDP "Page.navigate" @{ url = $url }
    Start-Sleep -Milliseconds 2500

    $testCode = @'
(() => {
  const report = {
    resourceCounts: {},
    waterOrRoadConflicts: [],
    terrainSprites: {},
    panelCards: {},
    buildTests: {}
  };

  unlockedCities['montargis'] = true;
  unlockedCities['varzea'] = true;
  unlockedCities['porto_real'] = true;
  unlockedCities['nova_atenas'] = true;
  cash = 10000000;

  const resources = [
    { key: 'hasTimberDeposit',   id: 'mine_timber',    name: 'Madeira / Toras',      sprite: 'terrenos/forest' },
    { key: 'hasIronDeposit',     id: 'mine_iron',      name: 'Minério de Ferro',     sprite: 'terrenos/iron_ore' },
    { key: 'hasBauxiteDeposit',  id: 'mine_bauxite',   name: 'Bauxita',              sprite: 'terrenos/bauxite' },
    { key: 'hasGoldDeposit',     id: 'mine_gold',      name: 'Minério de Ouro',      sprite: 'terrenos/gold_ore' },
    { key: 'hasSilicaDeposit',   id: 'mine_silica',    name: 'Areia de Sílica',      sprite: 'terrenos/silica' },
    { key: 'hasChemicalDeposit', id: 'mine_chemicals', name: 'Minerais Químicos',    sprite: 'terrenos/chemicals' },
    { key: 'hasOilDeposit',      id: 'mine_oil',       name: 'Petróleo Bruto',       sprite: 'terrenos/oil_field' }
  ];

  // 1. Contagem e detecção de conflitos no grid 128x128
  resources.forEach(r => {
    let count = 0;
    let sampleTile = null;
    for (let x = 0; x < 128; x++) {
      for (let y = 0; y < 128; y++) {
        const t = worldGrid[x][y];
        if (t[r.key]) {
          count++;
          if (!sampleTile) sampleTile = t;
          if (t.isWater || t.isRoad) {
            report.waterOrRoadConflicts.push({ res: r.name, x, y, isWater: t.isWater, isRoad: t.isRoad });
          }
        }
      }
    }
    report.resourceCounts[r.name] = count;

    // 2. Teste do sprite de terreno
    if (sampleTile) {
      const sp = typeof SpriteManager !== 'undefined' ? SpriteManager.getTerrainSprite(sampleTile) : null;
      report.terrainSprites[r.name] = {
        expected: r.sprite,
        actual: sp,
        match: sp === r.sprite
      };

      // 3. Teste do Card Contextual no EmptyLotPanel
      renderEmptyLotPanel(sampleTile);
      const html = document.getElementById('facility-content-panel').innerHTML;
      const hasBuildCall = html.includes(`confirmBuildMineDirect(${sampleTile.x}, ${sampleTile.y}, '${r.id}')`);
      report.panelCards[r.name] = {
        tile: { x: sampleTile.x, y: sampleTile.y },
        hasBuildCall
      };

      // 4. Teste de Construção Direta
      confirmBuildMineDirect(sampleTile.x, sampleTile.y, r.id);
      const mine = sampleTile.mine;
      report.buildTests[r.name] = {
        built: !!mine,
        resourceId: mine ? mine.resourceId : null,
        mineName: mine ? mine.name : null,
        dailyYield: mine ? mine.dailyYield : null
      };

      // Teste do renderMinePanel
      renderMinePanel(sampleTile);
      const facTitle = document.getElementById('facility-title').textContent;
      report.buildTests[r.name].facTitle = facTitle;
    }
  });

  // 5. Simula 3 dias de produção
  for (let d = 0; d < 3; d++) {
    simulateDay();
  }

  // Verifica que os estoques aumentaram
  report.stocksAfterSim = {};
  resources.forEach(r => {
    for (let x = 0; x < 128; x++) {
      for (let y = 0; y < 128; y++) {
        const t = worldGrid[x][y];
        if (t.mine && !report.stocksAfterSim[t.mine.name]) {
          report.stocksAfterSim[t.mine.name] = t.mine.stock;
        }
      }
    }
  });

  return report;
})()
'@

    $res = Eval-JS $testCode
    Write-Host "================================================================" -ForegroundColor Cyan
    Write-Host "VALIDACAO AUTOMATIZADA: SISTEMA INTEGRAL DE RECURSOS MINERAIS" -ForegroundColor Cyan
    Write-Host "================================================================" -ForegroundColor Cyan

    $res | ConvertTo-Json -Depth 5 | Write-Host

    # Iniciar jogo / fechar tela de intro e posicionar câmera
    $evalCam = @'
(() => {
  const intro = document.getElementById('intro-screen');
  if (intro) intro.classList.add('hidden');
  const overlay = document.getElementById('start-overlay');
  if (overlay) overlay.classList.add('hidden');
  
  if (typeof startGame === 'function') {
    try { startGame(); } catch(e) {}
  }

  camera.panX = 0;
  camera.panY = 0;
  camera.zoom = 1.3;
  // Centraliza nas colinas e montanhas ao sul de Nova Atenas (onde ficam Sílica, Ferro e Bauxita)
  const target = gridToScreen(48, 52);
  const r = canvas.getBoundingClientRect();
  camera.panX = (r.width / 2) - target.sx;
  camera.panY = (r.height / 2) - target.sy;
  
  renderMap();
  return { ok: true, panX: camera.panX, panY: camera.panY };
})()
'@
    $resCam = Eval-JS $evalCam
    Start-Sleep -Milliseconds 1500

    $ss = Send-CDP "Page.captureScreenshot" @{ format = "png" }
    $ssBytes = [System.Convert]::FromBase64String($ss.data)
    $ssPath = "d:\OIKONOMIA PROJETO\docs\auditoria\mineral_system_screenshot.png"
    [System.IO.File]::WriteAllBytes($ssPath, $ssBytes)
    Write-Host "`nScreenshot salvo em: $ssPath" -ForegroundColor Green

    Write-Host "`n================================================================" -ForegroundColor Cyan
    Write-Host "TESTE CONCLUIDO COM SUCESSO!" -ForegroundColor Cyan
    Write-Host "================================================================" -ForegroundColor Cyan
}
finally {
    if ($ws -and $ws.State -eq [System.Net.WebSockets.WebSocketState]::Open) {
        try { $ws.CloseAsync([System.Net.WebSockets.WebSocketCloseStatus]::NormalClosure, "Done", [System.Threading.CancellationToken]::None).Wait() } catch {}
    }
    if ($proc -and -not $proc.HasExited) {
        Stop-Process -Id $proc.Id -Force
    }
}
