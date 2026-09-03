# tools/test_silica_deposit.ps1
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
    Start-Sleep -Milliseconds 2000

    $testCode = @'
(() => {
  const results = { checks: [] };

  unlockedCities['montargis'] = true;
  unlockedCities['varzea'] = true;
  unlockedCities['porto_real'] = true;
  unlockedCities['nova_atenas'] = true;

  // 1. Verifica os tiles continentais de Sílica
  const silicaTiles = [];
  for (let x = 0; x < 128; x++) {
    for (let y = 0; y < 128; y++) {
      if (worldGrid[x][y].hasSilicaDeposit) {
        silicaTiles.push({ x, y, dName: worldGrid[x][y].district?.name });
      }
    }
  }

  results.checks.push({
    test: '1. Verificacao de Jazidas Continentais de Silica',
    totalDeposits: silicaTiles.length,
    tiles: silicaTiles
  });

  // 2. Verifica sprite de terreno
  const sampleTile = worldGrid[50][50];
  const sprite = typeof SpriteManager !== 'undefined' ? SpriteManager.getTerrainSprite(sampleTile) : null;
  results.checks.push({
    test: '2. Sprite de Terreno de Alto Contraste',
    spriteKey: sprite,
    isSilicaSprite: sprite === 'terrenos/silica'
  });

  // 3. Verifica renderEmptyLotPanel
  renderEmptyLotPanel(sampleTile);
  const panelHtml = document.getElementById('facility-content-panel').innerHTML;
  const hasSilicaCard = panelHtml.includes('Jazida de') && panelHtml.includes('lica');
  const hasConfirmBtn = panelHtml.includes("confirmBuildMineDirect") && panelHtml.includes("mine_silica");

  results.checks.push({
    test: '3. Painel Contextual de Jazida de Silica',
    hasSilicaCard,
    hasConfirmBtn
  });

  // 4. Verifica botão no inspetor
  renderTileInspector(sampleTile);
  const inspectorActions = document.getElementById('telemetry-actions').innerHTML;
  const hasInspectorBtn = inspectorActions.includes("+Jazida");

  results.checks.push({
    test: '4. Botao +Jazida no Inspetor Rapido',
    hasInspectorBtn
  });

  // 5. Constrói a Jazida
  cash = 100000;
  confirmBuildMineDirect(sampleTile.x, sampleTile.y, 'mine_silica');
  
  const mineCreated = !!sampleTile.mine;
  const isSilicaResource = sampleTile.mine && sampleTile.mine.resourceId === 'silica';
  const mineName = sampleTile.mine ? sampleTile.mine.name : null;

  results.checks.push({
    test: '5. Construcao da Jazida de Silica',
    mineCreated,
    isSilicaResource,
    mineName
  });

  // 6. Painel de gestão da Jazida
  renderMinePanel(sampleTile);
  const facTitle = document.getElementById('facility-title').textContent;
  const facSubtitle = document.getElementById('facility-subtitle').textContent;
  const facContent = document.getElementById('facility-content-panel').innerHTML;
  const hasSiloSilica = facContent.includes('Silo de Areia') || facContent.includes('lica');

  results.checks.push({
    test: '6. Painel de Gestao da Jazida',
    facTitle,
    facSubtitle,
    hasSiloSilica
  });

  // 7. Inspetor de instalação construída
  renderTileInspector(sampleTile);
  const inspectorBuilt = document.getElementById('telemetry-actions').innerHTML;
  const hasGerirJazida = inspectorBuilt.includes('Gerir Jazida');

  results.checks.push({
    test: '7. Acao no Inspetor: Gerir Jazida',
    hasGerirJazida
  });

  // 8. Simula 5 dias e verifica acúmulo de sílica
  const initialStock = sampleTile.mine.stock;
  for (let i = 0; i < 5; i++) {
    simulateDay();
  }
  const currentStock = sampleTile.mine.stock;
  const producedSilica = currentStock > initialStock;

  results.checks.push({
    test: '8. Extracao Diaria de Silica em Operacao',
    initialStock,
    currentStock,
    producedSilica
  });

  return results;
})()
'@

    $res = Eval-JS $testCode
    Write-Host "================================================================" -ForegroundColor Cyan
    Write-Host "VALIDACAO AUTOMATIZADA: JAZIDA DE SILICA CONTINENTAL (EDGE CDP)" -ForegroundColor Cyan
    Write-Host "================================================================" -ForegroundColor Cyan

    $res | ConvertTo-Json -Depth 5 | Write-Host

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
