# tools/audit_universal_matrix.ps1
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
        return $res.result.value
    }

    $null = Send-CDP "Page.enable"
    $null = Send-CDP "Runtime.enable"
    $null = Send-CDP "Page.navigate" @{ url = $url }
    Start-Sleep -Milliseconds 2000

    $jsCode = @'
(() => {
  const prods = Object.values(PRODUCT_CATALOG);
  const recipes = FACTORY_RECIPES || [];
  const farms = Object.values(FARM_TYPES || {});
  const mines = Object.values(MINE_RESOURCES || {});
  const stores = STORE_TYPES || [];
  const techNodes = Object.keys(TECH_TREE_CATALOG || {});

  let positiveMargins = 0;
  let negativeMargins = 0;
  let totalMarginPct = 0;

  const categoryStats = {};

  for (const p of prods) {
    const cat = p.category || 'Outros';
    if (!categoryStats[cat]) categoryStats[cat] = { count: 0, totalPrice: 0 };
    categoryStats[cat].count++;
    categoryStats[cat].totalPrice += (p.standardPrice || 0);

    const cost = p.baseCost || 1.0;
    const price = p.standardPrice || (cost * 1.6);
    const landed = cost * 1.08;
    const margin = price - landed;
    const marginPct = (margin / price) * 100;

    if (margin > 0) positiveMargins++;
    else negativeMargins++;
    totalMarginPct += marginPct;
  }

  for (const cat of Object.keys(categoryStats)) {
    categoryStats[cat].avgPrice = Number((categoryStats[cat].totalPrice / categoryStats[cat].count).toFixed(2));
  }

  const storeCoverage = stores.map(s => {
    const allowed = STORE_CATEGORY_WHITELIST[s.id] || [];
    const matched = prods.filter(p => allowed.includes(p.category) && !p.isIntermediate);
    return {
      id: s.id,
      name: s.name,
      maxShelves: s.maxShelves,
      supportedProducts: matched.length
    };
  });

  const cities = [
    { name: 'Nova Atenas', pop: 45000, maxK: 120000 },
    { name: 'Porto Real', pop: 28000, maxK: 80000 },
    { name: 'Montargis', pop: 6000, maxK: 45000 },
    { name: 'Várzea', pop: 9000, maxK: 38000 }
  ];
  const initialTotalPop = cities.reduce((acc, c) => acc + c.pop, 0);
  const maxCapacityPop = cities.reduce((acc, c) => acc + c.maxK, 0);

  const totalTiles = 128 * 128;
  const waterTiles = 3200;
  const usableLandTiles = totalTiles - waterTiles;
  const fullSupplyChainFootprint = 14 + 7 + 20 + (stores.length * 4) + 4;
  const mapSpaceFreePct = Number((((usableLandTiles - fullSupplyChainFootprint) / usableLandTiles) * 100).toFixed(2));

  return {
    totalProducts: prods.length,
    totalRecipes: recipes.length,
    totalFarms: farms.length,
    totalMines: mines.length,
    totalStoreTypes: stores.length,
    totalTechNodes: techNodes.length,
    positiveMargins,
    negativeMargins,
    avgMarginPct: Number((totalMarginPct / prods.length).toFixed(1)),
    categoryStats,
    storeCoverage,
    demographics: {
      initialTotalPop,
      maxCapacityPop,
      citiesCount: cities.length
    },
    territory: {
      totalTiles,
      usableLandTiles,
      fullSupplyChainFootprint,
      mapSpaceFreePct
    }
  };
})()
'@

    $res = Eval-JS $jsCode
    $json = $res | ConvertTo-Json -Depth 10
    $dir = "d:\OIKONOMIA PROJETO\docs\auditoria"
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    $jsonPath = Join-Path $dir "audit_universal_matrix.json"
    $json | Set-Content -Path $jsonPath -Encoding UTF8

    Write-Host "================================================================" -ForegroundColor Cyan
    Write-Host "VARREDURA UNIVERSAL DE MERCADO, TECNOLOGIAS E ESPACO TERRITORIAL" -ForegroundColor Cyan
    Write-Host "================================================================" -ForegroundColor Cyan
    Write-Host "  Produtos Catalogados       : $($res.totalProducts) produtos" -ForegroundColor Green
    Write-Host "  Receitas Industriais Ativas : $($res.totalRecipes) receitas" -ForegroundColor Green
    Write-Host "  Culturas Agropecuarias      : $($res.totalFarms) lavouras e criacoes" -ForegroundColor Green
    Write-Host "  Jazidas Minerais            : $($res.totalMines) recursos primarios" -ForegroundColor Green
    Write-Host "  Formatos de Varejo          : $($res.totalStoreTypes) tipos de lojas" -ForegroundColor Green
    Write-Host "  Nos na Arvore Tecnologica   : $($res.totalTechNodes) tecnologias/patentes" -ForegroundColor Green
    Write-Host "  Margem Positiva nos Produtos: $($res.positiveMargins) de $($res.totalProducts) (Margem Media: $($res.avgMarginPct)%)" -ForegroundColor Green
    Write-Host "  Populacao Consumidora Total : $($res.demographics.initialTotalPop) hab iniciais -> $($res.demographics.maxCapacityPop) hab capacidade max" -ForegroundColor Green
    Write-Host "  Ocupacao Territorial       : Cadeia Completa ocupa $($res.territory.fullSupplyChainFootprint) tiles de $($res.territory.usableLandTiles) uteis ($($res.territory.mapSpaceFreePct)% de espaco livre)" -ForegroundColor Green
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
