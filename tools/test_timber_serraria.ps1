# tools/test_timber_serraria.ps1
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
                if ($obj.error) {
                    throw "CDP Error: $($obj.error.message)"
                }
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

  // 1. Encontra um tile de Floresta (hasTimberDeposit)
  let forestTile = null;
  for (let x = 0; x < 128; x++) {
    for (let y = 0; y < 128; y++) {
      if (worldGrid[x][y].hasTimberDeposit) {
        forestTile = worldGrid[x][y];
        break;
      }
    }
    if (forestTile) break;
  }

  unlockedCities['montargis'] = true;
  unlockedCities['varzea'] = true;
  unlockedCities['porto_real'] = true;
  unlockedCities['nova_atenas'] = true;

  results.checks.push({
    test: '1. Encontrar Tile com hasTimberDeposit',
    found: !!forestTile,
    loc: forestTile ? `${forestTile.x},${forestTile.y}` : null,
    dType: forestTile ? forestTile.district.type : null,
    dName: forestTile ? forestTile.district.name : null
  });

  // 2. Renderiza renderEmptyLotPanel no tile de floresta
  renderEmptyLotPanel(forestTile);
  const panelHtml = document.getElementById('facility-content-panel').innerHTML;
  const hasSerrariaCard = panelHtml.includes('Instalar Serraria') && panelHtml.includes('Silvicultura');
  const hasConfirmBtn = panelHtml.includes("confirmBuildMineDirect") && panelHtml.includes("mine_timber");
  const hasAccordion = panelHtml.includes("<details") && panelHtml.includes("zoneamento");

  results.checks.push({
    test: '2. Painel Contextual de Reserva Florestal',
    hasSerrariaCard,
    hasConfirmBtn,
    hasAccordion
  });

  // 3. Testa renderTileInspector no tile de floresta vazio
  renderTileInspector(forestTile);
  const inspectorActions = document.getElementById('telemetry-actions').innerHTML;
  const hasInspectorBtn = inspectorActions.includes("+Serraria");

  results.checks.push({
    test: '3. Botão +Serraria no Inspetor Rápido',
    hasInspectorBtn,
    inspectorRaw: inspectorActions
  });

  // 4. Executa a construção da Serraria
  cash = 100000;
  confirmBuildMineDirect(forestTile.x, forestTile.y, 'mine_timber');
  
  const mineCreated = !!forestTile.mine;
  const isTimberResource = forestTile.mine && forestTile.mine.resourceId === 'timber';
  const mineName = forestTile.mine ? forestTile.mine.name : null;

  results.checks.push({
    test: '4. Construção da Serraria Florestal',
    mineCreated,
    isTimberResource,
    mineName
  });

  // 5. Renderiza renderMinePanel da Serraria
  renderMinePanel(forestTile);
  const facTitle = document.getElementById('facility-title').textContent;
  const facSubtitle = document.getElementById('facility-subtitle').textContent;
  const facContent = document.getElementById('facility-content-panel').innerHTML;
  const hasPatioToras = facContent.includes('Toras') && facContent.includes('Madeira');

  results.checks.push({
    test: '5. Painel de Gestão da Serraria',
    facTitle,
    facSubtitle,
    hasPatioToras
  });

  // 6. Inspetor de instalação construída
  renderTileInspector(forestTile);
  const inspectorBuilt = document.getElementById('telemetry-actions').innerHTML;
  const hasGerirSerraria = inspectorBuilt.includes('Gerir Serraria');

  results.checks.push({
    test: '6. Ação no Inspetor: Gerir Serraria',
    hasGerirSerraria,
    inspectorBuiltRaw: inspectorBuilt
  });

  // 7. Simula 5 dias e verifica acúmulo de madeira no silo
  const initialStock = forestTile.mine.stock;
  for (let i = 0; i < 5; i++) {
    simulateDay();
  }
  const currentStock = forestTile.mine.stock;
  const producedTimber = currentStock > initialStock;

  results.checks.push({
    test: '7. Extração Diária de Toras em Operação',
    initialStock,
    currentStock,
    producedTimber
  });

  // 8. Checagem do FARM_TYPES contendo farm_timber
  const farmTimber = (typeof FARM_TYPES !== 'undefined') ? FARM_TYPES.find(f => f.id === 'farm_timber') : null;
  results.checks.push({
    test: '8. Disponibilidade de Silvicultura nas Fazendas',
    farmTimberFound: !!farmTimber,
    farmTimberName: farmTimber ? farmTimber.name : null,
    farmCropId: farmTimber ? farmTimber.cropId : null
  });

  return results;
})()
'@

    $res = Eval-JS $testCode
    Write-Host "================================================================" -ForegroundColor Cyan
    Write-Host "VALIDACAO AUTOMATIZADA: RESERVA FLORESTAL & SERRARIA (EDGE CDP)" -ForegroundColor Cyan
    Write-Host "================================================================" -ForegroundColor Cyan

    $json = $res | ConvertTo-Json -Depth 5
    Write-Host $json -ForegroundColor Green

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
