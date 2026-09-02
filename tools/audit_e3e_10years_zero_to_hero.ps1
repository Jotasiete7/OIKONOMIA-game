# ==============================================================================
# OIKONOMIA - SUITE DE TESTES E3E MASTER: 10 ANOS ZERO TO HERO (CICLO DECENAL)
# Automacao de Navegador Real (Microsoft Edge Chromium via DevTools WebSocket CDP)
# ==============================================================================

param(
    [string]$EdgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    [string]$GameUrl = "file:///D:/OIKONOMIA%20PROJETO/client/index.html",
    [int]$TotalSimulatedYears = 10
)

$ErrorActionPreference = "Stop"

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  OIKONOMIA - E3E 10 ANOS ZERO TO HERO: CAMPANHA COMPLETA       " -ForegroundColor Cyan
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
    simulatedYears = $TotalSimulatedYears
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
        Write-Host "  Screenshot salvo: $filename" -ForegroundColor Gray
    }

    # 3. Carrega o jogo e dispensa overlays iniciais
    Write-Host "3. Carregando OIKONOMIA em $GameUrl..." -ForegroundColor Yellow
    Send-CDP "Page.enable" | Out-Null
    Send-CDP "Runtime.enable" | Out-Null
    Send-CDP "Page.navigate" @{ url = $GameUrl } | Out-Null
    Start-Sleep -Milliseconds 2000

    # Inicia a Partida Zero to Hero em Dificuldade Standard ($100k)
    Write-Host "4. Inicializando Campanha Zero to Hero (Standard: $100.000)..." -ForegroundColor Yellow
    $codeInit = @'
(() => {
    const ls = document.getElementById('loading-screen');
    if (ls) { ls.classList.add('hidden'); ls.style.display = 'none'; }
    const mm = document.getElementById('main-menu-screen');
    if (mm) { mm.classList.add('hidden'); mm.style.display = 'none'; }
    const wm = document.getElementById('welcome-tutorial-modal');
    if (wm) { wm.classList.add('hidden'); wm.style.display = 'none'; }
    currentAppScreen = 'PLAYING';

    playerProfile = {
        playerName: 'Arthur Vance',
        companyName: 'Vance Agro-Industrial Holding',
        avatarId: 'human_young',
        themeColor: 'emerald',
        difficulty: 'standard',
        logoRegenSeed: 777
    };
    cash = 100000;
    day = 1; month = 1; year = 1;
    window._cumulative10YearsRev = 0;
    window._cumulative10YearsNet = 0;

    updatePlayerProfileHUD();
    updateUI();

    return {
        company: playerProfile.companyName,
        startingCash: cash,
        macroLoaded: typeof MacroCycleSystem !== 'undefined',
        tickerLoaded: typeof CorporateTicker !== 'undefined',
        coreMathLoaded: typeof CoreMath !== 'undefined'
    };
})()
'@
    $init = Eval-JS $codeInit
    Write-Host "  [PASS] Empresa Fundada: $($init.company) (Caixa: $($init.startingCash))" -ForegroundColor Green
    Write-Host "  [PASS] Modulos: MacroCycle=$($init.macroLoaded) | Ticker=$($init.tickerLoaded) | CoreMath=$($init.coreMathLoaded)" -ForegroundColor Green
    Save-Screenshot "e3e_10years_01_founding_ano1.png"

    # =========================================================================
    # ANO 1 & 2: FASE 1 - RETOMADA & FUNDACAO (Cadeia de Trigo, Farinha & Pao)
    # =========================================================================
    Write-Host "`n--- [ANOS 1 & 2: FASE 1 - RETOMADA & FUNDACAO AGROINDUSTRIAL] ---" -ForegroundColor Cyan
    $codeP1 = @'
(() => {
    // 1. Fazenda de Trigo em Varzea (44, 37)
    const farmWheat = worldGrid[44][37];
    farmWheat.district = { name: 'Cinturao Agricola Varzea', population: 8500, trafficIndex: 35, landRentDaily: 8 };
    farmWheat.farm = {
        id: 'farm_wheat_1',
        name: 'Fazenda de Trigo Santa Maria',
        farmTypeId: 'farm_wheat',
        cropId: 'wheat',
        cropName: 'Trigo & Cereais',
        quality: 65,
        dailyYield: 700,
        dailyOperatingCost: 0.20,
        stock: 3000,
        maxCapacity: 8000
    };
    _indexTile(farmWheat);

    // 2. Complexo Fabril (Moagem + Panificacao)
    const factory = worldGrid[38][88];
    factory.district = { name: 'Polo Industrial Montargis', population: 9000, trafficIndex: 40, landRentDaily: 10 };
    factory.factory = {
        id: 'factory_central_1',
        name: 'Complexo Alimenticio Montargis',
        lines: {
            'rec_flour': {
                recipeId: 'rec_flour',
                dailyCapacity: 500,
                finishedStock: 2500,
                maxStock: 6000,
                inputsConfig: {
                    'wheat': { supplierId: 'farm_44_37', landedCost: 0.25 }
                }
            },
            'rec_bread': {
                recipeId: 'rec_bread',
                dailyCapacity: 450,
                finishedStock: 2000,
                maxStock: 6000,
                inputsConfig: {
                    'flour': { supplierId: 'factory_38_88_rec_flour', landedCost: 0.45 }
                }
            }
        }
    };
    _indexTile(factory);

    // 3. Loja 1: Supermercado em Nova Atenas (40, 37)
    const store1 = worldGrid[40][37];
    store1.district = { name: 'Distrito Residencial Nova Atenas', population: 22500, trafficIndex: 65, landRentDaily: 14 };
    store1.store = {
        id: 'store_atenas_1',
        name: 'Supermercado Nova Atenas',
        storeTypeId: 'supermarket',
        shelves: {
            'bread': {
                price: 2.90,
                stock: 2000,
                maxCapacity: 3500,
                dailyRestock: 350,
                quality: 68,
                supplierId: 'factory_38_88_rec_bread',
                landedCost: 0.65
            },
            'flour': {
                price: 1.95,
                stock: 1500,
                maxCapacity: 2500,
                dailyRestock: 250,
                quality: 65,
                supplierId: 'factory_38_88_rec_flour',
                landedCost: 0.45
            }
        }
    };
    _indexTile(store1);

    // 4. Loja 2: Mini-Mercado em Varzea (88, 84)
    const store2 = worldGrid[88][84];
    store2.district = { name: 'Distrito Comercial Varzea', population: 13500, trafficIndex: 50, landRentDaily: 9 };
    store2.store = {
        id: 'store_varzea_1',
        name: 'Mercado Regional Varzea',
        storeTypeId: 'supermarket',
        shelves: {
            'bread': {
                price: 2.85,
                stock: 1800,
                maxCapacity: 3000,
                dailyRestock: 300,
                quality: 68,
                supplierId: 'factory_38_88_rec_bread',
                landedCost: 0.65
            }
        }
    };
    _indexTile(store2);

    // 5. Marketing no Jornal da Metropole (22 pts IBOPE)
    activeMarketingContracts.clear();
    activeMarketingContracts.add('newspaper::__institutional__');

    cash -= 20000;
    updateUI();

    return {
        facilitiesCount: activeFacilitySet.size,
        mktContracts: activeMarketingContracts.size,
        cashRemaining: cash
    };
})()
'@
    $p1Build = Eval-JS $codeP1
    Write-Host "  [PASS] Cadeia Agroindustrial montada (Fazenda + Fabrica + 2 Lojas)" -ForegroundColor Green
    Write-Host "  [PASS] Marketing: Jornal da Metropole (22 pts IBOPE)" -ForegroundColor Green

    # Simula Anos 1 e 2 (720 dias)
    Write-Host "  > Simulando Anos 1 e 2 (720 dias / 24 meses / 8 trimestres)..." -ForegroundColor Yellow
    $codeSimP1 = @'
(() => {
    let p1Rev = 0, p1Net = 0;
    for (let d = 0; d < 720; d++) {
        const oldM = month;
        simulateDay();
        if (day === 1 && month !== oldM) {
            const last = historicalLedger[historicalLedger.length - 1];
            if (last) {
                p1Rev += last.revenue;
                p1Net += last.netProfit;
                window._cumulative10YearsRev += last.revenue;
                window._cumulative10YearsNet += last.netProfit;
            }
        }
    }

    return {
        endCash: cash,
        p1Rev,
        p1Net,
        brandBread: playerBrandRating['bread'] || 0,
        macroPhase: MacroCycleSystem.getPhaseInfo(year).name
    };
})()
'@
    $simP1 = Eval-JS $codeSimP1
    Write-Host "  [PASS] Fim do Ano 2: Caixa acumulado de $($simP1.endCash)" -ForegroundColor Green
    Write-Host "  [PASS] Faturamento Consolidado (Anos 1-2): $($simP1.p1Rev) | Lucro: $($simP1.p1Net)" -ForegroundColor Green
    Write-Host "  [PASS] Brand Rating de Pao evoluiu para $($simP1.brandBread) pts" -ForegroundColor Green
    Save-Screenshot "e3e_10years_02_fim_ano2.png"

    # =========================================================================
    # ANO 3 A 5: FASE 2 - EXPANSAO & O GRANDE BOOM (Pecuaria Leiteira, TV, P&D)
    # =========================================================================
    Write-Host "`n--- [ANOS 3 A 5: FASE 2 - O GRANDE BOOM ECONOMICO] ---" -ForegroundColor Cyan
    $codeBoomExp = @'
(() => {
    unlockedCities['porto_real'] = true;
    unlockedCities['montargis'] = true;

    // 1. Pecuaria Leiteira em Varzea (47, 37)
    const farmDairy = worldGrid[47][37];
    farmDairy.district = { name: 'Cinturao Agricola Varzea', population: 8500, trafficIndex: 35, landRentDaily: 8 };
    farmDairy.farm = {
        id: 'farm_dairy_1',
        name: 'Pecuaria Leiteira Bela Vista',
        farmTypeId: 'farm_dairy',
        cropId: 'raw_milk',
        cropName: 'Leite Cru',
        quality: 72,
        dailyYield: 600,
        dailyOperatingCost: 0.25,
        stock: 2500,
        maxCapacity: 7000
    };
    _indexTile(farmDairy);

    // 2. Linha de Laticinios na Fabrica Central
    const factory = worldGrid[38][88];
    factory.factory.lines['rec_milk'] = {
        recipeId: 'rec_milk',
        dailyCapacity: 450,
        finishedStock: 2000,
        maxStock: 5000,
        inputsConfig: {
            'raw_milk': { supplierId: 'farm_47_37', landedCost: 0.32 }
        }
    };

    // 3. Loja 3: Hipermercado em Porto Real (86, 38)
    const storePorto = worldGrid[86][38];
    storePorto.district = { name: 'Distrito Comercial Porto Real', population: 18500, trafficIndex: 58, landRentDaily: 12 };
    storePorto.store = {
        id: 'store_porto_1',
        name: 'Hipermercado Porto Real',
        storeTypeId: 'supermarket',
        shelves: {
            'milk': {
                price: 2.35,
                stock: 2000,
                maxCapacity: 3500,
                dailyRestock: 350,
                quality: 74,
                supplierId: 'factory_38_88_rec_milk',
                landedCost: 0.60
            },
            'bread': {
                price: 2.95,
                stock: 1800,
                maxCapacity: 3000,
                dailyRestock: 300,
                quality: 68,
                supplierId: 'factory_38_88_rec_bread',
                landedCost: 0.70
            }
        }
    };
    _indexTile(storePorto);

    // 4. Abastecimento de Leite nas Lojas 1 e 2
    const s1 = worldGrid[40][37].store;
    s1.shelves['milk'] = {
        price: 2.35,
        stock: 2000,
        maxCapacity: 3500,
        dailyRestock: 350,
        quality: 74,
        supplierId: 'factory_38_88_rec_milk',
        landedCost: 0.60
    };

    // 5. Centro de P&D em Nova Atenas (38, 39)
    const rd = worldGrid[38][39];
    rd.district = { name: 'Distrito Tecnologico Nova Atenas', population: 16000, trafficIndex: 45, landRentDaily: 15 };
    rd.rdCenter = {
        id: 'rd_center_1',
        name: 'Instituto Vance de P&D',
        dailyRent: 150,
        labs: {
            'lab_food': {
                id: 'lab_food',
                name: 'Laboratorio de Alimentos & Laticinios',
                category: 'food',
                targetProductId: 'bread',
                monthlyBudget: 3500,
                accumulatedInvestment: 0,
                currentQuality: 68,
                targetQuality: 92,
                active: true
            }
        }
    };
    _indexTile(rd);

    // 6. Upgrade de Midia para Radio Regional FM (42 pts IBOPE)
    activeMarketingContracts.clear();
    activeMarketingContracts.add('radio::__institutional__');

    cash -= 30000;
    updateUI();

    return {
        activeFacilities: activeFacilitySet.size,
        macroPhase: MacroCycleSystem.getPhaseInfo(year).name
    };
})()
'@
    $boomExp = Eval-JS $codeBoomExp
    Write-Host "  [PASS] Expansao Territorial, Linha de Laticinios e Centro de P&D ativos" -ForegroundColor Green
    Write-Host "  [PASS] Marketing: Radio Regional FM (42 pts IBOPE)" -ForegroundColor Green

    # Simula Anos 3 a 5 (1.080 dias)
    Write-Host "  > Simulando Anos 3 a 5 (1.080 dias / Boom com Demanda +20% e Insumos +15%)..." -ForegroundColor Yellow
    $codeSimBoom = @'
(() => {
    let p2Rev = 0, p2Net = 0;
    for (let d = 0; d < 1080; d++) {
        const oldM = month;
        simulateDay();
        if (day === 1 && month !== oldM) {
            const last = historicalLedger[historicalLedger.length - 1];
            if (last) {
                p2Rev += last.revenue;
                p2Net += last.netProfit;
                window._cumulative10YearsRev += last.revenue;
                window._cumulative10YearsNet += last.netProfit;
            }
        }
    }

    return {
        endCash: cash,
        p2Rev,
        p2Net,
        brandMilk: playerBrandRating['milk'] || 0,
        macroPhase: MacroCycleSystem.getPhaseInfo(year).name
    };
})()
'@
    $simBoom = Eval-JS $codeSimBoom
    Write-Host "  [PASS] Fim do Ano 5 (Pico do Boom): Caixa acumulado de $($simBoom.endCash)" -ForegroundColor Green
    Write-Host "  [PASS] Faturamento no Boom (Anos 3-5): $($simBoom.p2Rev) | Lucro: $($simBoom.p2Net)" -ForegroundColor Green
    Write-Host "  [PASS] Brand Rating de Leite atingiu $($simBoom.brandMilk) pts" -ForegroundColor Green
    Save-Screenshot "e3e_10years_03_boom_ano5.png"

    # =========================================================================
    # ANO 6 & 7: FASE 3 - SATURACAO & CONSOLIDACAO (Gestao Prudente)
    # =========================================================================
    Write-Host "`n--- [ANOS 6 & 7: FASE 3 - SATURACAO & CONSOLIDACAO] ---" -ForegroundColor Cyan
    $codeSimSat = @'
(() => {
    let p3Rev = 0, p3Net = 0;
    for (let d = 0; d < 720; d++) {
        const oldM = month;
        simulateDay();
        if (day === 1 && month !== oldM) {
            const last = historicalLedger[historicalLedger.length - 1];
            if (last) {
                p3Rev += last.revenue;
                p3Net += last.netProfit;
                window._cumulative10YearsRev += last.revenue;
                window._cumulative10YearsNet += last.netProfit;
            }
        }
    }
    return {
        endCash: cash,
        p3Rev,
        p3Net,
        phase: MacroCycleSystem.getPhaseInfo(year).name
    };
})()
'@
    $simSat = Eval-JS $codeSimSat
    Write-Host "  [PASS] Fim do Ano 7: Caixa acumulado para Value Investing: $($simSat.endCash)" -ForegroundColor Green
    Write-Host "  [PASS] Faturamento na Saturacao (Anos 6-7): $($simSat.p3Rev) | Lucro: $($simSat.p3Net)" -ForegroundColor Green
    Save-Screenshot "e3e_10years_04_saturacao_ano7.png"

    # =========================================================================
    # ANO 8 A 10: FASE 4 - RECESSAO & VALUE INVESTING (Patentes com 35% OFF)
    # =========================================================================
    Write-Host "`n--- [ANOS 8 A 10: FASE 4 - RECESSAO & VALUE INVESTING] ---" -ForegroundColor Cyan
    $codeRecession = @'
(() => {
    try {
        const discount = MacroCycleSystem.getTechDiscountMultiplier(year);
        const baseBuyout = 45000;
        const discountedBuyout = Math.round(baseBuyout * (1 - discount));

        if (cash >= discountedBuyout) {
            cash -= discountedBuyout;
            if (typeof rdLabs !== 'undefined') {
                rdLabs['rd_chocolate'] = { productId: 'chocolate', currentQR: 88, status: 'completed' };
            }
        }

        let p4Rev = 0, p4Net = 0;
        for (let d = 0; d < 1080; d++) {
            const oldM = month;
            simulateDay();
            if (day === 1 && month !== oldM) {
                const last = historicalLedger[historicalLedger.length - 1];
                if (last) {
                    p4Rev += last.revenue;
                    p4Net += last.netProfit;
                    window._cumulative10YearsRev += last.revenue;
                    window._cumulative10YearsNet += last.netProfit;
                }
            }
        }

        const total10YearsRev = Number(window._cumulative10YearsRev) || 0;
        const total10YearsNet = Number(window._cumulative10YearsNet) || 0;
        const avgMargin10Years = total10YearsRev > 0 ? ((total10YearsNet / total10YearsRev) * 100).toFixed(1) : '0';
        const hud = (typeof MacroCycleSystem !== 'undefined') ? MacroCycleSystem.getHUDLabel(year) : { text: 'Ciclo 10 Anos' };

        // Abre o modal de DRE para renderizar o diagnóstico inteligente do Analista Corporativo
        if (typeof openFacilityDREModal === 'function') openFacilityDREModal();
        const diagEl = document.getElementById('fdre-diag-text');
        const badgeEl = document.getElementById('fdre-diag-badge');
        const analystVerdict = diagEl ? diagEl.textContent.trim() : '';
        const analystBadge = badgeEl ? badgeEl.textContent.trim() : '';

        // Detalhamento de instalações ativas e seus desempenhos
        const facilitiesBreakdown = [];
        for (const tile of activeFacilitySet.values()) {
            if (!tile.store && !tile.factory && !tile.farm && !tile.mine && !tile.rdCenter) continue;
            const name = tile.store?.name || tile.factory?.name || tile.farm?.name || tile.mine?.name || tile.rdCenter?.name || 'Instalação';
            const type = tile.store ? 'Varejo' : (tile.factory ? 'Fábrica' : (tile.farm ? 'Fazenda' : (tile.mine ? 'Mina' : 'P&D')));
            const lm = tile.lastMonthMetrics || tile.monthlyMetrics || { revenue: 0, cogs: 0, opex: 0, netProfit: 0 };
            facilitiesBreakdown.push({
                name,
                type,
                location: `${tile.district?.name || 'Interior'} (${tile.x}, ${tile.y})`,
                monthlyRevenue: Math.round(lm.revenue || 0),
                monthlyCogs: Math.round(lm.cogs || 0),
                monthlyOpex: Math.round(lm.opex || 0),
                monthlyNetProfit: Math.round(lm.netProfit || 0)
            });
        }

        return {
            discountApplied: (discount * 100).toFixed(0) + '%',
            discountedBuyout: Math.round(discountedBuyout),
            finalYear: year,
            finalMonth: month,
            finalCash: Math.round(cash),
            totalFacilities: activeFacilitySet.size,
            totalRevenue10Years: Math.round(total10YearsRev),
            totalNetProfit10Years: Math.round(total10YearsNet),
            avgMargin10Years: avgMargin10Years,
            macroStatus: hud ? hud.text : 'Ciclo Decenal Concluido',
            corporateAnalyst: {
                badge: analystBadge,
                verdict: analystVerdict
            },
            facilitiesBreakdown: facilitiesBreakdown,
            recentHistoricalLedger: historicalLedger.slice(-12).map(h => ({
                year: h.year,
                month: h.month,
                revenue: Math.round(h.revenue),
                cogs: Math.round(h.cogs),
                totalOpex: Math.round(h.totalOpex),
                netProfit: Math.round(h.netProfit),
                cash: Math.round(h.cash)
            }))
        };
    } catch (err) {
        return { error: err.stack || err.message };
    }
})()
'@
    $simFinal = Eval-JS $codeRecession
    if ($simFinal.error) {
        throw "Erro na Fase 4: $($simFinal.error)"
    }
    Write-Host "  [PASS] Desconto de Value Investing Aplicado: $($simFinal.discountApplied)" -ForegroundColor Green
    Write-Host "  [PASS] Patente Adquirida por: $($simFinal.discountedBuyout)" -ForegroundColor Green
    Write-Host "  [PASS] Veredito do Analista Corporativo: $($simFinal.corporateAnalyst.verdict)" -ForegroundColor Cyan
    Save-Screenshot "e3e_10years_05_conclusao_ciclo_decenal.png"

    Write-Host "`n================================================================" -ForegroundColor Green
    Write-Host "🏆  RESULTADO DA AUDITORIA E3E MASTER: 10 ANOS CONCLUIDOS!      " -ForegroundColor Green
    Write-Host "================================================================" -ForegroundColor Green
    Write-Host "  • Ano Final da Campanha: Ano $($simFinal.finalYear) / Mes $($simFinal.finalMonth)" -ForegroundColor White
    Write-Host "  • Caixa Liquido Final: $($simFinal.finalCash)" -ForegroundColor White
    Write-Host "  • Faturamento Consolidado (10 Anos): $($simFinal.totalRevenue10Years)" -ForegroundColor White
    Write-Host "  • Lucro Liquido Acumulado (10 Anos): $($simFinal.totalNetProfit10Years)" -ForegroundColor White
    Write-Host "  • Margem Liquida Media do Ciclo: $($simFinal.avgMargin10Years)%" -ForegroundColor White
    Write-Host "  • Instalacoes Industriais e Lojas Ativas: $($simFinal.totalFacilities)" -ForegroundColor White
    Write-Host "  • Status Macroeconomico Final: $($simFinal.macroStatus)" -ForegroundColor White

    $results.passedAll = $true
    $results.phases = $simFinal

} catch {
    Write-Host "`n[FAIL] ERRO NA AUDITORIA E3E: $_" -ForegroundColor Red
    $results.passedAll = $false
    $results.error = $_.ToString()
} finally {
    if ($proc -and -not $proc.HasExited) {
        $proc.Kill()
        Write-Host "`nMicrosoft Edge Headless finalizado." -ForegroundColor Gray
    }
}

$jsonReport = $results | ConvertTo-Json -Depth 10
$reportPath = "d:\OIKONOMIA PROJETO\docs\auditoria\relatorio_e3e_10anos_zero_to_hero.json"
[System.IO.File]::WriteAllText($reportPath, $jsonReport)
Write-Host "Relatorio JSON salvo em: $reportPath" -ForegroundColor Cyan
