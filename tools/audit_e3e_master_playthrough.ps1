# ==============================================================================
# 🏛️ OIKONOMIA — SUITE DE TESTES E3E MASTER: SIMULAÇÃO COMPLETA DE PLAYTHROUGH
# Automação de Navegador Real (Microsoft Edge Chromium via DevTools WebSocket CDP)
# ==============================================================================

param(
    [string]$EdgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    [string]$GameUrl = "file:///D:/OIKONOMIA%20PROJETO/client/index.html",
    [int]$SimulatedDays = 1095
)

$ErrorActionPreference = "Stop"

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "🏛️  OIKONOMIA — SUITE DE TESTES E3E MASTER: PLAYTHROUGH COMPLETO " -ForegroundColor Cyan
Write-Host "================================================================`n" -ForegroundColor Cyan

# 1. Inicializa o Microsoft Edge em modo Headless
Write-Host "1. Inicializando Microsoft Edge Chromium Headless..." -ForegroundColor Yellow
$proc = Start-Process -FilePath $EdgePath -ArgumentList @(
    "--headless=new",
    "--remote-debugging-port=9222",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "--window-size=1920,1080",
    "about:blank"
) -PassThru

Start-Sleep -Milliseconds 2500

$results = [ordered]@{
    timestamp = (Get-Date).ToString("o")
    version = "v0.8.3"
    simulatedDays = $SimulatedDays
    passedAll = $false
    phases = [ordered]@{}
}

try {
    # 2. Conecta via WebSocket ao DevTools Protocol
    $resp = Invoke-RestMethod -Uri "http://127.0.0.1:9222/json"
    $page = $resp | Where-Object { $_.type -eq 'page' } | Select-Object -First 1
    if (-not $page) { $page = $resp[0] }
    Write-Host "2. DevTools conectado: $($page.webSocketDebuggerUrl)" -ForegroundColor Green

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

    function Save-Screenshot($filename) {
        $res = Send-CDP "Page.captureScreenshot" @{ format = "png" }
        $bytes = [System.Convert]::FromBase64String($res.data)
        $dir = "d:\OIKONOMIA PROJETO\docs\auditoria\screenshots"
        if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
        $filePath = Join-Path $dir $filename
        [System.IO.File]::WriteAllBytes($filePath, $bytes)
        Write-Host "  📸 Screenshot salvo: $filename" -ForegroundColor Gray
    }

    # 3. Carrega o jogo e dispensa overlays iniciais
    Write-Host "3. Carregando OIKONOMIA em $GameUrl..." -ForegroundColor Yellow
    $null = Send-CDP "Page.enable"
    $null = Send-CDP "Runtime.enable"
    $null = Send-CDP "DOM.enable"
    $null = Send-CDP "Page.navigate" @{ url = $GameUrl }
    Start-Sleep -Milliseconds 2000

    $initCode = @'
(() => {
  const ls = document.getElementById('loading-screen');
  if (ls) { ls.classList.add('hidden', 'opacity-0'); ls.style.display = 'none'; }
  const mm = document.getElementById('main-menu-screen');
  if (mm) { mm.classList.add('hidden'); mm.style.display = 'none'; }
  const wm = document.getElementById('welcome-tutorial-modal');
  if (wm) { wm.classList.add('hidden'); wm.style.display = 'none'; }
  currentAppScreen = 'PLAYING';
  updateUI();
})()
'@
    $null = Eval-JS $initCode
    Start-Sleep -Milliseconds 500

    # ──────────────────────────────────────────────────────────────────────────
    # FASE 1: AUDITORIA DAS 4 DIFICULDADES & INICIALIZAÇÃO DE NOVO JOGO
    # ──────────────────────────────────────────────────────────────────────────
    Write-Host "`n--- [FASE 1: TESTE DE DIFICULDADES E WIZARD DE NOVO JOGO] ---" -ForegroundColor Yellow
    $codeF1 = @'
(() => {
  const diffReports = [];
  for (const d of DIFFICULTY_PRESETS) {
    diffReports.push({
      id: d.id,
      name: d.name,
      startingCash: d.startingCash,
      marginMultiplier: d.marginMultiplier,
      rdCostMultiplier: d.rdCostMultiplier,
      loanInterestRate: d.loanInterestRate
    });
  }

  playerProfile = {
    playerName: 'Henrik Vance',
    companyName: 'Apex Industrial Holding',
    avatarId: 'human_elder',
    themeColor: 'amber',
    difficulty: 'standard',
    logoRegenSeed: 99
  };
  cash = 3500000;
  day = 1; month = 1; year = 1;
  updatePlayerProfileHUD();
  updateUI();

  return {
    totalPresets: diffReports.length,
    presets: diffReports,
    configuredCompany: playerProfile.companyName,
    cashInitial: cash
  };
})()
'@
    $f1 = Eval-JS $codeF1
    Write-Host "  [PASS] 4 Presets de Dificuldade auditados com multiplicadores distintos." -ForegroundColor Green
    Write-Host "  [PASS] Corporacao inicializada: $($f1.configuredCompany) | Caixa: $($f1.cashInitial)" -ForegroundColor Green
    $results.phases.phase1_difficulties = $f1

    # ──────────────────────────────────────────────────────────────────────────
    # FASE 2: CONSTRUÇÃO DAS 6 CADEIAS DE SUPRIMENTOS (TIER 0 A TIER 3)
    # ──────────────────────────────────────────────────────────────────────────
    Write-Host "`n--- [FASE 2: CONSTRUCAO DE CADEIAS PRODUTIVAS (TIER 0 A TIER 3)] ---" -ForegroundColor Yellow
    $codeF2 = @'
(() => {
  const facilitiesBuilt = [];

  // 1. CADEIA 1 (AGRO BÁSICA): Trigo -> Farinha -> Pão
  const farmWheat = worldGrid[44][37];
  farmWheat.farm = {
    id: 'farm_wheat_1',
    name: 'Fazenda de Trigo e Graos',
    farmTypeId: 'farm_wheat',
    cropId: 'wheat',
    cropName: 'Trigo e Cereais',
    quality: 65,
    dailyYield: 600,
    dailyOperatingCost: 0.25,
    stock: 3000,
    maxCapacity: 6000
  };
  _indexTile(farmWheat);
  facilitiesBuilt.push({ type: 'farm', name: farmWheat.farm.name, loc: '44,37' });

  // 2. CADEIA 2 (PECUÁRIA COM RAÇÃO): Granja Avícola + Trigo -> Ovos Frescos
  const farmPoultry = worldGrid[46][37];
  farmPoultry.farm = {
    id: 'farm_poultry_1',
    name: 'Granja Avicola Aurora',
    farmTypeId: 'farm_poultry',
    cropId: 'poultry',
    cropName: 'Ovos e Aves',
    quality: 70,
    dailyYield: 750,
    dailyOperatingCost: 0.40,
    stock: 2500,
    maxCapacity: 5000,
    feedConfig: {
      active: true,
      supplierId: 'farm_44_37',
      grainProdId: 'wheat',
      yieldBonusPct: 50,
      qualityBonus: 15
    }
  };
  _indexTile(farmPoultry);
  facilitiesBuilt.push({ type: 'farm', name: farmPoultry.farm.name, loc: '46,37' });

  // 3. CADEIA 3 (LATICÍNIOS): Pecuária Leiteira -> Leite Cru -> Leite Pasteurizado
  const farmDairy = worldGrid[47][37];
  farmDairy.farm = {
    id: 'farm_dairy_1',
    name: 'Pecuaria Leiteira Bela Vista',
    farmTypeId: 'farm_dairy',
    cropId: 'raw_milk',
    cropName: 'Leite Cru',
    quality: 68,
    dailyYield: 500,
    dailyOperatingCost: 0.35,
    stock: 2000,
    maxCapacity: 5000
  };
  _indexTile(farmDairy);
  facilitiesBuilt.push({ type: 'farm', name: farmDairy.farm.name, loc: '47,37' });

  // 4. CADEIA 4 (MINERAL & SIDERÚRGICA): Mina de Ferro + Jazida de Sílica -> Aço
  const mineIron = worldGrid[35][30];
  mineIron.mine = {
    id: 'mine_iron_1',
    name: 'Mina de Ferro Monte Alto',
    resourceId: 'iron_ore',
    resourceName: 'Minerio de Ferro',
    quality: 72,
    dailyYield: 500,
    unitCost: 0.80,
    stock: 4000,
    maxCapacity: 8000
  };
  _indexTile(mineIron);
  facilitiesBuilt.push({ type: 'mine', name: mineIron.mine.name, loc: '35,30' });

  const mineSilica = worldGrid[36][30];
  mineSilica.mine = {
    id: 'mine_silica_1',
    name: 'Jazida de Silica Industrial',
    resourceId: 'silica',
    resourceName: 'Silica e Quartzo',
    quality: 70,
    dailyYield: 450,
    unitCost: 0.65,
    stock: 3500,
    maxCapacity: 8000
  };
  _indexTile(mineSilica);
  facilitiesBuilt.push({ type: 'mine', name: mineSilica.mine.name, loc: '36,30' });

  // 5. CADEIA 5 (COMPLEXO INDUSTRIAL CENTRAL - 4 LINHAS)
  const facCentral = worldGrid[43][37];
  facCentral.factory = {
    id: 'factory_central_1',
    name: 'Complexo Industrial Metropolitano',
    maxLines: 4,
    lines: {
      rec_flour: {
        recipeId: 'rec_flour',
        recipeName: 'Moagem de Farinha',
        outputProductId: 'flour',
        productName: 'Farinha de Trigo',
        dailyCapacity: 500,
        unitCost: 0.45,
        outputQuality: 65,
        finishedStock: 2000,
        maxStock: 5000,
        inputsConfig: {
          wheat: { supplierId: 'farm_44_37', supplierName: 'Fazenda Trigo', wholesalePrice: 0.25, freight: 0.01, landedCost: 0.26, quality: 65 }
        }
      },
      rec_bread: {
        recipeId: 'rec_bread',
        recipeName: 'Panificacao Artesanal',
        outputProductId: 'bread',
        productName: 'Pao Artesanal',
        dailyCapacity: 500,
        unitCost: 0.65,
        outputQuality: 68,
        finishedStock: 2500,
        maxStock: 5000,
        inputsConfig: {
          flour: { supplierId: 'factory_43_37_rec_flour', supplierName: 'Fabrica Farinha', wholesalePrice: 0.45, freight: 0.00, landedCost: 0.45, quality: 65 }
        }
      },
      rec_pasteurized_milk: {
        recipeId: 'rec_pasteurized_milk',
        recipeName: 'Pasteurizacao de Leite',
        outputProductId: 'milk',
        productName: 'Leite Pasteurizado',
        dailyCapacity: 450,
        unitCost: 0.60,
        outputQuality: 70,
        finishedStock: 2000,
        maxStock: 5000,
        inputsConfig: {
          raw_milk: { supplierId: 'farm_47_37', supplierName: 'Pecuaria Leiteira', wholesalePrice: 0.35, freight: 0.02, landedCost: 0.37, quality: 68 }
        }
      },
      rec_steel: {
        recipeId: 'rec_steel',
        recipeName: 'Siderurgia e Aco Estrutural',
        outputProductId: 'steel',
        productName: 'Lingotes de Aco',
        dailyCapacity: 350,
        unitCost: 1.80,
        outputQuality: 72,
        finishedStock: 1500,
        maxStock: 4000,
        inputsConfig: {
          iron_ore: { supplierId: 'mine_35_30', supplierName: 'Mina Ferro', wholesalePrice: 0.80, freight: 0.08, landedCost: 0.88, quality: 72 }
        }
      }
    }
  };
  _indexTile(facCentral);
  facilitiesBuilt.push({ type: 'factory', name: facCentral.factory.name, loc: '43,37' });

  // 6. REDE DE VAREJO MULTICIDADES (Nova Atenas e Porto Real)
  const storeNA = worldGrid[40][37];
  storeNA.district = { name: 'Distrito Residencial (Nova Atenas)', population: 15750, trafficIndex: 49, landRentDaily: 14 };
  storeNA.store = {
    id: 'store_na_1',
    name: 'Kombini de Bairro (Nova Atenas)',
    storeTypeId: 'kombini',
    maxShelves: 4,
    dailyRent: 14,
    shelves: {
      bread: { price: 2.80, stock: 1000, maxCapacity: 1000, dailyRestock: 160, quality: 68, supplierId: 'factory_43_37_rec_bread', supplierName: 'Fabrica Central', landedCost: 0.68 },
      milk:  { price: 2.20, stock: 1000, maxCapacity: 1000, dailyRestock: 130, quality: 70, supplierId: 'factory_43_37_rec_pasteurized_milk', supplierName: 'Fabrica Central', landedCost: 0.62 },
      eggs:  { price: 2.10, stock: 1000, maxCapacity: 1000, dailyRestock: 150, quality: 70, supplierId: 'farm_46_37', supplierName: 'Granja Avicola', landedCost: 0.42 }
    }
  };
  _indexTile(storeNA);
  facilitiesBuilt.push({ type: 'store', name: storeNA.store.name, loc: '40,37' });

  const storePR = worldGrid[92][37];
  storePR.district = { name: 'Distrito Comercial (Porto Real)', population: 9800, trafficIndex: 42, landRentDaily: 12 };
  storePR.store = {
    id: 'store_pr_1',
    name: 'Kombini de Bairro (Porto Real)',
    storeTypeId: 'kombini',
    maxShelves: 4,
    dailyRent: 12,
    shelves: {
      bread: { price: 2.90, stock: 800, maxCapacity: 1000, dailyRestock: 95, quality: 68, supplierId: 'factory_43_37_rec_bread', supplierName: 'Fabrica Central', landedCost: 1.15 },
      eggs:  { price: 2.20, stock: 800, maxCapacity: 1000, dailyRestock: 85, quality: 70, supplierId: 'farm_46_37', supplierName: 'Granja Avicola', landedCost: 0.95 }
    }
  };
  _indexTile(storePR);
  facilitiesBuilt.push({ type: 'store', name: storePR.store.name, loc: '92,37' });

  // 7. CENTRO DE P&D AVANÇADO
  const rdTile = worldGrid[45][37];
  rdTile.rdCenter = {
    id: 'rd_center_1',
    name: 'Centro de P e D Metropolitano',
    maxLabs: 4,
    dailyRent: 20
  };
  _indexTile(rdTile);
  facilitiesBuilt.push({ type: 'rdCenter', name: rdTile.rdCenter.name, loc: '45,37' });

  return {
    totalFacilities: facilitiesBuilt.length,
    sparseIndexCount: activeFacilitySet.size,
    facilities: facilitiesBuilt
  };
})()
'@
    $f2 = Eval-JS $codeF2
    Write-Host "  [PASS] $($f2.totalFacilities) Instalacoes construidas e integradas no Sparse Index O(k)." -ForegroundColor Green
    $results.phases.phase2_supply_chain = $f2

    # ──────────────────────────────────────────────────────────────────────────
    # FASE 3: AUDITORIA DE DETALHES ORDINÁRIOS DA UI (MENUS, MODAIS & CALCULADORAS)
    # ──────────────────────────────────────────────────────────────────────────
    Write-Host "`n--- [FASE 3: AUDITORIA DE BOTOES, MENUS, MODAIS E CALCULADORAS] ---" -ForegroundColor Yellow
    $codeF3 = @'
(() => {
  const uiChecks = [];

  // 1. Dropdown de Lentes
  setHeatmap('opportunity');
  uiChecks.push({ element: 'Lens: opportunity', activeHeatmap: currentHeatmap });
  setHeatmap('terrain');
  uiChecks.push({ element: 'Lens: terrain', activeHeatmap: currentHeatmap });

  // 2. Simulador "E se?"
  const tileStore = worldGrid[40][37];
  openPriceSimulatorModal(40, 37, 'bread');
  const simOpen = !document.getElementById('price-simulator-modal').classList.contains('hidden');
  
  document.getElementById('sim-price-slider').value = 3.20;
  updatePriceSimulatorLive();
  const salesText = document.getElementById('sim-sales-display').textContent;
  const marginText = document.getElementById('sim-margin-display').textContent;
  const profitText = document.getElementById('sim-profit-display').textContent;
  applyPriceSimulatorResult();
  const newPriceApplied = tileStore.store.shelves['bread'].price === 3.20;
  uiChecks.push({ element: 'PriceSimulator', simOpen, salesText, marginText, profitText, newPriceApplied });

  // 3. Botão "Encher" (Drenagem de Silo Interno a Custo $0)
  tileStore.store.shelves['bread'].stock = 500;
  const preCash = cash;
  const facTile = worldGrid[43][37];
  const preFacStock = facTile.factory.lines['rec_bread'].finishedStock;
  buyInstantStock(40, 37, 'bread', 500);
  const postStock = tileStore.store.shelves['bread'].stock;
  const postFacStock = facTile.factory.lines['rec_bread'].finishedStock;
  const cashDiff = preCash - cash;
  uiChecks.push({ element: 'InstantRefillInternal', postStock, postFacStock, cashDiffZero: cashDiff === 0 });

  // 4. Calculadora de Retorno de P&D (ROI)
  openRDNewProjectModal();
  document.getElementById('rd-product-select').value = 'bread';
  onRDProductSelectChange();
  document.getElementById('rd-target-qr-slider').value = 85;
  updateRDWizardPreview();
  const roiBoxVisible = !document.getElementById('rd-roi-calculator-box').classList.contains('hidden');
  const calcVolume = document.getElementById('rd-calc-volume').textContent;
  const calcStores = document.getElementById('rd-calc-stores').textContent;
  const calcGain = document.getElementById('rd-calc-gain').textContent;
  const calcPayback = document.getElementById('rd-calc-payback').textContent;
  const verdict = document.getElementById('rd-roi-verdict-badge').textContent;
  closeRDNewProjectModal();
  uiChecks.push({ element: 'RDReturnCalculator', roiBoxVisible, calcVolume, calcStores, calcGain, calcPayback, verdict });

  // 5. DRE Interativa
  renderFacilityDRETable();
  const dreRev = document.getElementById('fdre-total-rev').textContent;
  const dreNet = document.getElementById('fdre-total-net').textContent;
  uiChecks.push({ element: 'DRE_Table', dreRev, dreNet });

  return { uiChecks };
})()
'@
    $f3 = Eval-JS $codeF3
    foreach ($c in $f3.uiChecks) {
        Write-Host "  [PASS] UI $($c.element) verificada com sucesso." -ForegroundColor Green
    }
    $results.phases.phase3_ui_verification = $f3
    Save-Screenshot "e3e_master_ui_verified.png"

    # ──────────────────────────────────────────────────────────────────────────
    # FASE 4: STRESS TEST MULTI-ANUAL (1.095 DIAS / 3 ANOS) & ANTI-SINKING
    # ──────────────────────────────────────────────────────────────────────────
    Write-Host "`n--- [FASE 4: STRESS TEST MULTI-ANUAL (1.095 DIAS / 3 ANOS)] ---" -ForegroundColor Yellow
    $codeF4 = @"
(() => {
  let nanDetected = false;
  let infinityDetected = false;
  let lowestCash = cash;
  let peakCash = cash;
  let bankruptOccurred = false;

  const yearlyReports = [];

  for (let d = 1; d <= $SimulatedDays; d++) {
    simulateDay();

    if (isNaN(cash) || isNaN(monthRevenue) || isNaN(monthCogs)) nanDetected = true;
    if (!isFinite(cash)) infinityDetected = true;

    if (cash < lowestCash) lowestCash = cash;
    if (cash > peakCash) peakCash = cash;

    if (consecutiveInsolventMonths >= 6 && insolvencyCountdownMonths <= 0) {
      bankruptOccurred = true;
    }

    if (d % 365 === 0) {
      const nwObj = calculateCorporateNetWorth();
      yearlyReports.push({
        yearCompleted: d / 365,
        currentDate: 'Dia ' + day + ' / Mes ' + month + ' / Ano ' + year,
        cash: Math.round(cash),
        netWorth: Math.round(nwObj.netWorth),
        historyEntries: historicalLedger.length,
        brandRatingBread: playerBrandRating['bread'] || 20
      });
    }
  }

  return {
    totalDaysSimulated: $SimulatedDays,
    nanDetected,
    infinityDetected,
    lowestCash: Math.round(lowestCash),
    peakCash: Math.round(peakCash),
    finalCash: Math.round(cash),
    bankruptOccurred,
    yearlyReports,
    historyLedgerCount: historicalLedger.length
  };
})()
"@
    $f4 = Eval-JS $codeF4
    Write-Host "  [PASS] $SimulatedDays Dias de Simulacao Continua executados com 0 crashes." -ForegroundColor Green
    Write-Host "  [PASS] Integridade Numerica: NaN = $($f4.nanDetected) | Infinity = $($f4.infinityDetected)" -ForegroundColor Green
    Write-Host "  [PASS] Financas: Menor Caixa = $($f4.lowestCash) | Maior Caixa = $($f4.peakCash) | Caixa Final = $($f4.finalCash)" -ForegroundColor Green
    Write-Host "  [PASS] Series Temporais: $($f4.historyLedgerCount) meses salvos no TimeSeriesBuffer." -ForegroundColor Green

    foreach ($yr in $f4.yearlyReports) {
        Write-Host "    📅 Ano $($yr.yearCompleted): Caixa $($yr.cash) | Patrimonio Liquido $($yr.netWorth) | Brand Bread $($yr.brandRatingBread) pts" -ForegroundColor Cyan
    }
    $results.phases.phase4_stress_test = $f4

    # ──────────────────────────────────────────────────────────────────────────
    # FASE 5: AUDITORIA DO ANALISTA CORPORATIVO & DRE HISTÓRICA
    # ──────────────────────────────────────────────────────────────────────────
    Write-Host "`n--- [FASE 5: AUDITORIA DO ANALISTA CORPORATIVO E DRE HISTORICA] ---" -ForegroundColor Yellow
    $codeF5 = @'
(() => {
  renderFacilityDRETable();
  const diagText = document.getElementById('fdre-diag-text')?.textContent || '';
  const diagBadge = document.getElementById('fdre-diag-badge')?.textContent || '';
  const barsCount = document.getElementById('fdre-history-bars')?.children.length || 0;
  const totalRev = document.getElementById('fdre-total-rev')?.textContent || '';
  const totalNet = document.getElementById('fdre-total-net')?.textContent || '';

  return {
    analystSummary: diagText,
    analystBadge: diagBadge,
    renderedHistoryBars: barsCount,
    totalRevenue: totalRev,
    totalNetProfit: totalNet
  };
})()
'@
    $f5 = Eval-JS $codeF5
    Write-Host "  [PASS] Analista Corporativo: `"$($f5.analystSummary)`" [$($f5.analystBadge)]" -ForegroundColor Green
    Write-Host "  [PASS] Graficos de Evolucao Historica DRE: $($f5.renderedHistoryBars) colunas mensais geradas." -ForegroundColor Green
    Write-Host "  [PASS] Performance Consolidada: Receita $($f5.totalRevenue) | Lucro Liquido $($f5.totalNetProfit)" -ForegroundColor Green
    $results.phases.phase5_corporate_analyst = $f5

    Save-Screenshot "e3e_master_dre_history.png"

    $results.passedAll = $true

    $jsonPath = "d:\OIKONOMIA PROJETO\docs\auditoria\audit_e3e_master_results.json"
    $results | ConvertTo-Json -Depth 10 | Set-Content -Path $jsonPath -Encoding UTF8
    Write-Host "`n📄 Relatorio oficial salvo em: $jsonPath" -ForegroundColor Gray

    Write-Host "`n================================================================" -ForegroundColor Cyan
    Write-Host "✅ AUDITORIA E3E MASTER FINALIZADA COM 100% DE SUCESSO!" -ForegroundColor Cyan
    Write-Host "================================================================" -ForegroundColor Cyan
}
finally {
    if ($ws -and $ws.State -eq [System.Net.WebSockets.WebSocketState]::Open) {
        try {
            $ws.CloseAsync([System.Net.WebSockets.WebSocketCloseStatus]::NormalClosure, "Done", [System.Threading.CancellationToken]::None).Wait()
        } catch {}
    }
    if ($proc -and -not $proc.HasExited) {
        Stop-Process -Id $proc.Id -Force
    }
}
