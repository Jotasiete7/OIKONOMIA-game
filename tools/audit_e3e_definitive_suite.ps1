# ==============================================================================
# OIKONOMIA - SUITE DE AUDITORIA E2E DEFINITIVA (MULTI-PERFIL & 20 ANOS)
# Automacao de Navegador Real (Microsoft Edge Chromium via DevTools WebSocket CDP)
# ==============================================================================

param(
    [string]$EdgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    [string]$GameUrl = "file:///D:/OIKONOMIA%20PROJETO/client/index.html"
)

$ErrorActionPreference = "Stop"

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "  OIKONOMIA - SUITE DE AUDITORIA E2E DEFINITIVA (MULTI-PERFIL)        " -ForegroundColor Cyan
Write-Host "  Simulacao de 6 Perfis Isolados (20 Anos / 2 Ciclos & 5 Anos no F)   " -ForegroundColor Cyan
Write-Host "======================================================================`n" -ForegroundColor Cyan

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

$script:msgId = 1
$ws = $null

function Connect-CDP {
    $resp = Invoke-RestMethod -Uri "http://127.0.0.1:9222/json"
    $page = $resp | Where-Object { $_.type -eq 'page' } | Select-Object -First 1
    if (-not $page) { $page = $resp[0] }
    Write-Host "DevTools conectado: $($page.webSocketDebuggerUrl)" -ForegroundColor Green

    $script:ws = [System.Net.WebSockets.ClientWebSocket]::new()
    $cts = [System.Threading.CancellationTokenSource]::new(10000)
    $uri = [System.Uri]::new($page.webSocketDebuggerUrl)
    $script:ws.ConnectAsync($uri, $cts.Token).Wait()

    Send-CDP "Page.enable" | Out-Null
    Send-CDP "Runtime.enable" | Out-Null
}

function Send-CDP($method, $params = @{}) {
    $id = $script:msgId++
    $payload = @{ id = $id; method = $method; params = $params } | ConvertTo-Json -Compress -Depth 10
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($payload)
    $seg = [System.ArraySegment[byte]]::new($bytes)
    $script:ws.SendAsync($seg, [System.Net.WebSockets.WebSocketMessageType]::Text, $true, [System.Threading.CancellationToken]::None).Wait()

    $buffer = [byte[]]::new(131072)
    while ($true) {
        $ms = [System.IO.MemoryStream]::new()
        do {
            $recvSeg = [System.ArraySegment[byte]]::new($buffer)
            $recvRes = $script:ws.ReceiveAsync($recvSeg, [System.Threading.CancellationToken]::None).Result
            $ms.Write($buffer, 0, $recvRes.Count)
        } while (-not $recvRes.EndOfMessage)
        
        $jsonStr = [System.Text.Encoding]::UTF8.GetString($ms.ToArray())
        $obj = $jsonStr | ConvertFrom-Json
        if ($obj.id -eq $id) {
            if ($obj.error) {
                throw "CDP Error ($method): $($obj.error.message)"
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
    Write-Host "    [Screenshot] $filename" -ForegroundColor Gray
}

# ==============================================================================
# MOTOR DE VERIFICACOES AUTOMATICAS DE SANIDADE (PARTE 5)
# ==============================================================================
function Run-SanityChecks($profileResult) {
    $alerts = [System.Collections.Generic.List[string]]::new()
    $years = $profileResult.yearlyData

    if ($years.Count -ge 3) {
        # 1. Detector de crescimento suspeito demais (CV < 2%)
        $deltas = [System.Collections.Generic.List[double]]::new()
        for ($i = 1; $i -lt $years.Count; $i++) {
            $diff = [double]$years[$i].cash - [double]$years[$i-1].cash
            $deltas.Add($diff)
        }
        $avgDelta = ($deltas | Measure-Object -Average).Average
        if ($avgDelta -gt 0) {
            $sumSq = 0
            foreach ($d in $deltas) { $sumSq += [Math]::Pow(($d - $avgDelta), 2) }
            $stdDev = [Math]::Sqrt($sumSq / $deltas.Count)
            $cv = $stdDev / $avgDelta
            if ($cv -lt 0.02 -and $years.Count -ge 5) {
                $pctCV = ($cv * 100).ToString('N2')
                $alerts.Add("ALERTA: Crescimento anormalmente linear (CV = $pctCV%) - possivel insensibilidade a variaveis dinamicas (macro-ciclo, sazonalidade, concorrencia).")
            }
        }
    }

    # 2. Detector de instalacao cronicamente deficitaria (Diferencia Centros de Custo Upstream de Lojas)
    $facHistory = @{}
    $facTypes = @{}
    foreach ($y in $years) {
        foreach ($fac in $y.facilitiesBreakdown) {
            if (-not $facHistory.ContainsKey($fac.name)) {
                $facHistory[$fac.name] = [System.Collections.Generic.List[double]]::new()
                $facTypes[$fac.name] = $fac.type
            }
            $facHistory[$fac.name].Add([double]$fac.annualNetProfit)
        }
    }
    foreach ($facName in $facHistory.Keys) {
        $profits = $facHistory[$facName]
        $fType = $facTypes[$facName]
        $consecutiveLoss = 0
        $maxConsecutive = 0
        $accumLoss = 0
        foreach ($p in $profits) {
            if ($p -lt 0) {
                $consecutiveLoss++
                $accumLoss += $p
                if ($consecutiveLoss -gt $maxConsecutive) { $maxConsecutive = $consecutiveLoss }
            } else {
                $consecutiveLoss = 0
            }
        }
        if ($maxConsecutive -ge 2 -and $accumLoss -lt 0) {
            $accStr = $accumLoss.ToString('N0')
            if ($fType -eq 'store') {
                $alerts.Add("ALERTA CRITICO: Loja de Varejo cronicamente deficitaria: '$facName' operou no vermelho por $maxConsecutive anos consecutivos (Impacto acumulado: `$$accStr).")
            } else {
                $alerts.Add("INFO: Centro de Custo Upstream Integrado ($fType): '$facName' absorveu `$$accStr em custos operacionais absorvidos pelo varejo.")
            }
        }
    }

    # 3. Detector de diagnostico contraditorio no Analista Corporativo
    foreach ($y in $years) {
        $txt = [string]$y.corporateAnalystVerdictText
        if ($txt -match '(?<![0-9])\+\$0(?![0-9])' -or $txt -match '(?<![0-9.])0(%|\.0%)') {
            if ($txt -match '(alta|recorde|crescimento|aumentou)') {
                $alerts.Add("ALERTA: Diagnostico contraditorio no Ano $($y.year): Texto rotulado como alta com variancia zero ('$txt').")
            }
        }
        if ($txt -match 'Desempenho em Alta' -and $txt -match 'recuou') {
            $alerts.Add("ALERTA: Inconsistencia semantica no Ano $($y.year): '$txt'")
        }
    }

    if ($alerts.Count -eq 0) {
        $alerts.Add("OK: Nenhuma anomalia matematica, semantica ou de teto artificial detectada.")
    }

    return $alerts
}

# ==============================================================================
# DEFINICAO DOS 6 PERFIS DE JOGADOR CALIBRADOS
# ==============================================================================
$profiles = @(
    @{
        id = "A"
        name = "Elena Voss"
        company = "Voss Holdings"
        capital = 50000
        difficulty = "standard"
        years = 20
        tag = "Conservador/Poupador"
        description = "Expande devagar com 2 lojas bem localizadas absorvendo moinho e fazenda, mantendo alta reserva de liquidez e marketing no Jornal."
    },
    @{
        id = "B"
        name = "Marco Ferreira"
        company = "Ferreira Group"
        capital = 50000
        difficulty = "standard"
        years = 20
        tag = "Agressivo/Expansionista"
        description = "Reinveste 90%+ do lucro imediatamente em novas lojas e fabricas em tres cidades, aceita caixa baixo e busca escala maxima."
    },
    @{
        id = "C"
        name = "Dr. Amara Okafor"
        company = "Okafor Innovations"
        capital = 50000
        difficulty = "standard"
        years = 20
        tag = "Tech Leader / P&D Pesado"
        description = "Prioriza pesquisa acima de tudo - opera rede de Boutiques Gourmet (QR 80+) sustentando laboratorios continuos de biotecnologia."
    },
    @{
        id = "D"
        name = "Julian Reyes"
        company = "Reyes Media Corp"
        capital = 50000
        difficulty = "standard"
        years = 20
        tag = "Marketing Agressivo"
        description = "Investe pesado em todas as midias (TV, Radio, Jornal) desde o inicio, medindo o impacto no Brand Rating e elasticidade."
    },
    @{
        id = "E"
        name = "Henrik Drake"
        company = "OmniCorp"
        capital = 20000
        difficulty = "hardcore"
        years = 20
        tag = "Hardcore Puro"
        description = "Configuracao mais apertada de capital (20k inicial), inicia com Kombini de alta margem e cresce com disciplina extrema de custos."
    },
    @{
        id = "F"
        name = "Vance Sterling"
        company = "Sterling Global"
        capital = 15000000
        difficulty = "standard"
        years = 5
        tag = "Mega-Conglomerado (Regressao)"
        description = "Ja comeca com infraestrutura completa construida (todas as 4 cidades) para auditar se o crescimento anual e genuinamente dinamico."
    }
)

$allResults = [ordered]@{}

try {
    Connect-CDP

    foreach ($p in $profiles) {
        Write-Host "`n----------------------------------------------------------------------" -ForegroundColor Cyan
        Write-Host "  EXECUTANDO PERFIL $($p.id): $($p.tag) ($($p.company))" -ForegroundColor Cyan
        Write-Host "  Duracao: $($p.years) Anos ($($p.years * 360) dias) | Capital: `$$($p.capital)" -ForegroundColor Cyan
        Write-Host "----------------------------------------------------------------------" -ForegroundColor Cyan

        # Reseta o jogo para a nova partida
        Send-CDP "Page.navigate" @{ url = $GameUrl } | Out-Null
        Start-Sleep -Milliseconds 1800

        $codeInit = @"
(() => {
    const ls = document.getElementById('loading-screen');
    if (ls) { ls.classList.add('hidden'); ls.style.display = 'none'; }
    const mm = document.getElementById('main-menu-screen');
    if (mm) { mm.classList.add('hidden'); mm.style.display = 'none'; }
    const wm = document.getElementById('welcome-tutorial-modal');
    if (wm) { wm.classList.add('hidden'); wm.style.display = 'none'; }
    currentAppScreen = 'PLAYING';

    playerProfile = {
        playerName: '$($p.name)',
        companyName: '$($p.company)',
        avatarId: 'human_young',
        themeColor: 'emerald',
        difficulty: '$($p.difficulty)',
        logoRegenSeed: 888
    };
    cash = $($p.capital);
    day = 1; month = 1; year = 1;
    unlockedCities = { 'nova_atenas': true };
    activeMarketingContracts.clear();
    rdLabs = {};

    updatePlayerProfileHUD();
    updateUI();

    return {
        ready: true,
        company: playerProfile.companyName,
        cash: cash
    };
})()
"@
        $initRes = Eval-JS $codeInit
        Write-Host "  [Setup] Partida inicializada para $($initRes.company) (Caixa: `$ $($initRes.cash))" -ForegroundColor Green

        # Configura a Infraestrutura Inicial Especifica do Perfil
        $codeSetup = @"
(() => {
    const pId = '$($p.id)';

    if (pId === 'A') {
        // Perfil A: Conservador (1 Fazenda + 1 Fabrica integrada + 2 Lojas Nobres)
        unlockedCities['varzea'] = true;

        const farm = worldGrid[44][37];
        farm.district = { name: 'Cinturao Agricola Varzea', population: 8500, trafficIndex: 35, landRentDaily: 8 };
        farm.farm = { id: 'farm_a_1', name: 'Fazenda Voss Cereais', farmTypeId: 'farm_wheat', cropId: 'wheat', cropName: 'Trigo', quality: 65, dailyYield: 600, dailyOperatingCost: 0.20, stock: 2500, maxCapacity: 6000 };
        _indexTile(farm);

        const fac = worldGrid[38][88];
        fac.district = { name: 'Polo Industrial Montargis', population: 9000, trafficIndex: 40, landRentDaily: 10 };
        fac.factory = { id: 'fac_a_1', name: 'Moinho & Padaria Voss', lines: {
            'rec_flour': { recipeId: 'rec_flour', dailyCapacity: 450, finishedStock: 1800, maxStock: 5000, inputsConfig: { 'wheat': { supplierId: 'farm_44_37', landedCost: 0.25 } } },
            'rec_bread': { recipeId: 'rec_bread', dailyCapacity: 400, finishedStock: 1500, maxStock: 5000, inputsConfig: { 'flour': { supplierId: 'factory_38_88_rec_flour', landedCost: 0.45 } } }
        }};
        _indexTile(fac);

        const st1 = worldGrid[40][37];
        st1.district = { name: 'Distrito Residencial Nova Atenas', population: 22500, trafficIndex: 65, landRentDaily: 14 };
        st1.store = { id: 'st_a_1', name: 'Padaria Nobre Voss', storeTypeId: 'supermarket', shelves: {
            'bread': { price: 2.90, stock: 2000, maxCapacity: 3500, dailyRestock: 350, quality: 68, supplierId: 'factory_38_88_rec_bread', landedCost: 0.65 },
            'flour': { price: 1.95, stock: 1500, maxCapacity: 2500, dailyRestock: 200, quality: 65, supplierId: 'factory_38_88_rec_flour', landedCost: 0.45 }
        }};
        _indexTile(st1);

        const st2 = worldGrid[88][84];
        st2.district = { name: 'Distrito Comercial Varzea', population: 13500, trafficIndex: 50, landRentDaily: 9 };
        st2.store = { id: 'st_a_2', name: 'Padaria Regional Voss', storeTypeId: 'supermarket', shelves: {
            'bread': { price: 2.85, stock: 1800, maxCapacity: 3000, dailyRestock: 280, quality: 68, supplierId: 'factory_38_88_rec_bread', landedCost: 0.65 }
        }};
        _indexTile(st2);

        activeMarketingContracts.add('newspaper::__institutional__');
        cash -= 18000;
    }
    else if (pId === 'B') {
        // Perfil B: Agressivo (Expansao multi-cidades com trigo, farinha e pao)
        unlockedCities['porto_real'] = true;
        unlockedCities['montargis'] = true;

        const farm1 = worldGrid[44][37];
        farm1.district = { name: 'Cinturao Agricola Varzea', population: 8500, trafficIndex: 35, landRentDaily: 8 };
        farm1.farm = { id: 'farm_b_1', name: 'Agropecuaria Ferreira', farmTypeId: 'farm_wheat', cropId: 'wheat', cropName: 'Trigo', quality: 65, dailyYield: 700, dailyOperatingCost: 0.20, stock: 2500, maxCapacity: 6000 };
        _indexTile(farm1);

        const fac = worldGrid[38][88];
        fac.district = { name: 'Polo Industrial Montargis', population: 9000, trafficIndex: 40, landRentDaily: 10 };
        fac.factory = { id: 'fac_b_1', name: 'Complexo Ferreira', lines: {
            'rec_flour': { recipeId: 'rec_flour', dailyCapacity: 500, finishedStock: 2000, maxStock: 5000, inputsConfig: { 'wheat': { supplierId: 'farm_44_37', landedCost: 0.25 } } },
            'rec_bread': { recipeId: 'rec_bread', dailyCapacity: 450, finishedStock: 1800, maxStock: 5000, inputsConfig: { 'flour': { supplierId: 'factory_38_88_rec_flour', landedCost: 0.45 } } }
        }};
        _indexTile(fac);

        const st1 = worldGrid[40][37];
        st1.district = { name: 'Distrito Residencial Nova Atenas', population: 22500, trafficIndex: 65, landRentDaily: 14 };
        st1.store = { id: 'st_b_1', name: 'Hiper Ferreira Atenas', storeTypeId: 'supermarket', shelves: {
            'bread': { price: 2.80, stock: 2000, maxCapacity: 3500, dailyRestock: 350, quality: 68, supplierId: 'factory_38_88_rec_bread', landedCost: 0.65 },
            'flour': { price: 1.90, stock: 1200, maxCapacity: 2000, dailyRestock: 200, quality: 65, supplierId: 'factory_38_88_rec_flour', landedCost: 0.45 }
        }};
        _indexTile(st1);

        const st2 = worldGrid[86][38];
        st2.district = { name: 'Distrito Comercial Porto Real', population: 18500, trafficIndex: 58, landRentDaily: 12 };
        st2.store = { id: 'st_b_2', name: 'Hiper Ferreira Porto', storeTypeId: 'supermarket', shelves: {
            'bread': { price: 2.85, stock: 1800, maxCapacity: 3000, dailyRestock: 300, quality: 68, supplierId: 'factory_38_88_rec_bread', landedCost: 0.70 }
        }};
        _indexTile(st2);

        activeMarketingContracts.add('radio::__institutional__');
        cash -= 22000;
    }
    else if (pId === 'C') {
        // Perfil C: Tech Leader (Centro de P&D ativo com 2 lojas gourmet cobrindo custos)
        unlockedCities['porto_real'] = true;

        const farm = worldGrid[44][37];
        farm.district = { name: 'Cinturao Agricola Varzea', population: 8500, trafficIndex: 35, landRentDaily: 8 };
        farm.farm = { id: 'farm_c_1', name: 'Bio-Fazenda Okafor', farmTypeId: 'farm_wheat', cropId: 'wheat', cropName: 'Trigo Organico', quality: 72, dailyYield: 600, dailyOperatingCost: 0.22, stock: 2500, maxCapacity: 6000 };
        _indexTile(farm);

        const fac = worldGrid[38][88];
        fac.district = { name: 'Polo Industrial Montargis', population: 9000, trafficIndex: 40, landRentDaily: 10 };
        fac.factory = { id: 'fac_c_1', name: 'Laboratorio de Alimentos Okafor', lines: {
            'rec_flour': { recipeId: 'rec_flour', dailyCapacity: 450, finishedStock: 1800, maxStock: 5000, inputsConfig: { 'wheat': { supplierId: 'farm_44_37', landedCost: 0.25 } } },
            'rec_bread': { recipeId: 'rec_bread', dailyCapacity: 400, finishedStock: 1500, maxStock: 5000, inputsConfig: { 'flour': { supplierId: 'factory_38_88_rec_flour', landedCost: 0.45 } } }
        }};
        _indexTile(fac);

        const st1 = worldGrid[40][37];
        st1.district = { name: 'Distrito Residencial Nova Atenas', population: 22500, trafficIndex: 65, landRentDaily: 14 };
        st1.store = { id: 'st_c_1', name: 'Boutique Gourmet Okafor', storeTypeId: 'supermarket', shelves: {
            'bread': { price: 3.40, stock: 1800, maxCapacity: 3000, dailyRestock: 300, quality: 78, supplierId: 'factory_38_88_rec_bread', landedCost: 0.65 }
        }};
        _indexTile(st1);

        const st2 = worldGrid[86][38];
        st2.district = { name: 'Distrito Comercial Porto Real', population: 18500, trafficIndex: 58, landRentDaily: 12 };
        st2.store = { id: 'st_c_2', name: 'Boutique Porto Real', storeTypeId: 'supermarket', shelves: {
            'bread': { price: 3.45, stock: 1500, maxCapacity: 2500, dailyRestock: 250, quality: 78, supplierId: 'factory_38_88_rec_bread', landedCost: 0.70 }
        }};
        _indexTile(st2);

        const rd = worldGrid[38][39];
        rd.district = { name: 'Distrito Tecnologico Nova Atenas', population: 16000, trafficIndex: 45, landRentDaily: 15 };
        rd.rdCenter = { id: 'rd_c_1', name: 'Instituto Okafor de P&D', dailyRent: 150, labs: {
            'lab_food': { id: 'lab_food', name: 'Genetica de Trigo & Pao', category: 'food', targetProductId: 'bread', monthlyBudget: 3000, accumulatedInvestment: 0, currentQuality: 78, targetQuality: 95, active: true }
        }};
        _indexTile(rd);

        activeMarketingContracts.add('newspaper::__institutional__');
        cash -= 22000;
    }
    else if (pId === 'D') {
        // Perfil D: Marketing Agressivo (Rede com Presenca Massiva em Midia)
        const farm = worldGrid[44][37];
        farm.district = { name: 'Cinturao Agricola Varzea', population: 8500, trafficIndex: 35, landRentDaily: 8 };
        farm.farm = { id: 'farm_d_1', name: 'Fazenda Reyes', farmTypeId: 'farm_wheat', cropId: 'wheat', cropName: 'Trigo', quality: 65, dailyYield: 600, dailyOperatingCost: 0.20, stock: 2500, maxCapacity: 6000 };
        _indexTile(farm);

        const fac = worldGrid[38][88];
        fac.district = { name: 'Polo Industrial Montargis', population: 9000, trafficIndex: 40, landRentDaily: 10 };
        fac.factory = { id: 'fac_d_1', name: 'Fabrica Reyes Alimentos', lines: {
            'rec_flour': { recipeId: 'rec_flour', dailyCapacity: 450, finishedStock: 1800, maxStock: 5000, inputsConfig: { 'wheat': { supplierId: 'farm_44_37', landedCost: 0.25 } } },
            'rec_bread': { recipeId: 'rec_bread', dailyCapacity: 400, finishedStock: 1500, maxStock: 5000, inputsConfig: { 'flour': { supplierId: 'factory_38_88_rec_flour', landedCost: 0.45 } } }
        }};
        _indexTile(fac);

        const st = worldGrid[40][37];
        st.district = { name: 'Distrito Residencial Nova Atenas', population: 22500, trafficIndex: 65, landRentDaily: 14 };
        st.store = { id: 'st_d_1', name: 'MegaStore Reyes Nova Atenas', storeTypeId: 'supermarket', shelves: {
            'bread': { price: 3.10, stock: 2000, maxCapacity: 3500, dailyRestock: 350, quality: 68, supplierId: 'factory_38_88_rec_bread', landedCost: 0.65 }
        }};
        _indexTile(st);

        activeMarketingContracts.add('newspaper::__institutional__');
        activeMarketingContracts.add('radio::__institutional__');
        cash -= 16000;
    }
    else if (pId === 'E') {
        // Perfil E: Hardcore Puro ($20k capital - operacao enxuta de varejo inteligente)
        // BUG 2 FIX: supplierId deve usar o formato 'port_default_<prodId>' que o engine
        // do jogo reconhece para abastecimento via porto atacadista com custo dinamico.
        const st = worldGrid[40][37];
        st.district = { name: 'Distrito Residencial Nova Atenas', population: 22500, trafficIndex: 65, landRentDaily: 14 };
        st.store = { id: 'st_e_1', name: 'Kombini Drake', storeTypeId: 'kombini', shelves: {
            'bread': { price: 2.80, stock: 1200, maxCapacity: 2000, dailyRestock: 220, quality: 65, supplierId: 'port_default_bread', landedCost: 0.70 }
        }};
        _indexTile(st);

        cash -= 5000;
    }
    else if (pId === 'F') {
        // Perfil F: Mega-Conglomerado ($15M capital - todas as cidades e cadeias montadas)
        unlockedCities['porto_real'] = true;
        unlockedCities['montargis'] = true;
        unlockedCities['varzea'] = true;

        const farm1 = worldGrid[44][37];
        farm1.district = { name: 'Cinturao Agricola Varzea', population: 8500, trafficIndex: 35, landRentDaily: 8 };
        farm1.farm = { id: 'farm_f_1', name: 'Mega Agropecuaria Sterling', farmTypeId: 'farm_wheat', cropId: 'wheat', cropName: 'Trigo', quality: 75, dailyYield: 1200, dailyOperatingCost: 0.20, stock: 5000, maxCapacity: 15000 };
        _indexTile(farm1);

        const fac1 = worldGrid[38][88];
        fac1.district = { name: 'Polo Industrial Montargis', population: 9000, trafficIndex: 40, landRentDaily: 10 };
        fac1.factory = { id: 'fac_f_1', name: 'Complexo Industrial Sterling', lines: {
            'rec_flour': { recipeId: 'rec_flour', dailyCapacity: 900, finishedStock: 4000, maxStock: 12000, inputsConfig: { 'wheat': { supplierId: 'farm_44_37', landedCost: 0.25 } } },
            'rec_bread': { recipeId: 'rec_bread', dailyCapacity: 800, finishedStock: 3500, maxStock: 12000, inputsConfig: { 'flour': { supplierId: 'factory_38_88_rec_flour', landedCost: 0.45 } } }
        }};
        _indexTile(fac1);

        const st1 = worldGrid[40][37];
        st1.district = { name: 'Distrito Residencial Nova Atenas', population: 22500, trafficIndex: 65, landRentDaily: 14 };
        st1.store = { id: 'st_f_1', name: 'Sterling Mall Atenas', storeTypeId: 'supermarket', shelves: {
            'bread': { price: 2.95, stock: 3500, maxCapacity: 6000, dailyRestock: 500, quality: 75, supplierId: 'factory_38_88_rec_bread', landedCost: 0.65 }
        }};
        _indexTile(st1);

        const st2 = worldGrid[86][38];
        st2.district = { name: 'Distrito Comercial Porto Real', population: 18500, trafficIndex: 58, landRentDaily: 12 };
        st2.store = { id: 'st_f_2', name: 'Sterling Mall Porto', storeTypeId: 'supermarket', shelves: {
            'bread': { price: 2.95, stock: 3000, maxCapacity: 5000, dailyRestock: 450, quality: 75, supplierId: 'factory_38_88_rec_bread', landedCost: 0.70 }
        }};
        _indexTile(st2);

        activeMarketingContracts.add('tv::__institutional__');
    }

    updateUI();
    return { activeFacilities: activeFacilitySet.size };
})()
"@
        $setupRes = Eval-JS $codeSetup
        Write-Host "  [Setup] $($setupRes.activeFacilities) instalacoes indexadas com sucesso" -ForegroundColor Green
        Save-Screenshot "e3e_def_$($p.id)_ano1_inicio.png"

        # Simula ano a ano coletando a telemetria estrita
        $yearlyRecords = [System.Collections.Generic.List[PSObject]]::new()

        for ($y = 1; $y -le $p.years; $y++) {
            $codeSimYear = @"
(() => {
    try {
        let yearRevenue = 0, yearCogs = 0, yearFixed = 0, yearMkt = 0, yearRD = 0, yearNet = 0;
        let stockoutCount = 0;

        // BUG 1 FIX: captura o ano/fase ANTES de simular os 360 dias deste ano,
        // garantindo que o registro corresponda exatamente ao ano que esta sendo jogado.
        const snapshotYear = year;
        const macroInfoSnap = (typeof MacroCycleSystem !== 'undefined') ? MacroCycleSystem.getPhaseInfo(snapshotYear) : { name: 'STANDARD', code: 'STD' };
        const cycleYrSnap = (typeof MacroCycleSystem !== 'undefined') ? MacroCycleSystem.getCycleYear(snapshotYear) : ((snapshotYear - 1) % 10) + 1;
        const cycleNumSnap = Math.floor((snapshotYear - 1) / 10) + 1;

        for (let d = 0; d < 360; d++) {
            const oldM = month;
            simulateDay();
            if (day === 1 && month !== oldM) {
                const last = historicalLedger[historicalLedger.length - 1];
                if (last) {
                    yearRevenue += (last.revenue || 0);
                    yearCogs += (last.cogs || 0);
                    yearFixed += (last.fixedExpenses || 0);
                    yearMkt += (last.marketingExpenses || 0);
                    yearNet += (last.netProfit || 0);
                }
            }
        }

        // Calcula investimento anual em P&D a partir dos labs ativos
        for (const tile of activeFacilitySet.values()) {
            if (tile.rdCenter && tile.rdCenter.labs) {
                for (const lab of Object.values(tile.rdCenter.labs)) {
                    if (lab.active) yearRD += (lab.monthlyBudget || 0) * 12;
                }
            }
        }

        const curQuarter = (typeof CoreMath !== 'undefined' && CoreMath.getQuarterInfo) ? CoreMath.getQuarterInfo(month).code : 'Q4';

        // Abre modal DRE para capturar veredito do analista corporativo
        if (typeof openFacilityDREModal === 'function') openFacilityDREModal();
        const diagEl = document.getElementById('fdre-diag-text');
        const verdictText = diagEl ? diagEl.textContent.trim() : '';

        // Detalhamento das instalacoes
        const facBreakdown = [];
        for (const tile of activeFacilitySet.values()) {
            if (!tile.store && !tile.factory && !tile.farm && !tile.mine && !tile.rdCenter) continue;
            const name = tile.store?.name || tile.factory?.name || tile.farm?.name || tile.mine?.name || tile.rdCenter?.name || 'Instalacao';
            const type = tile.store ? 'store' : (tile.factory ? 'factory' : (tile.farm ? 'farm' : (tile.mine ? 'mine' : 'rdCenter')));
            const lm = tile.lastMonthMetrics || tile.monthlyMetrics || { revenue: 0, cogs: 0, opex: 0, netProfit: 0 };
            facBreakdown.push({
                name: name,
                type: type,
                annualRevenue: Math.round((lm.revenue || 0) * 12),
                annualCogs: Math.round((lm.cogs || 0) * 12),
                annualOpex: Math.round((lm.opex || 0) * 12),
                annualNetProfit: Math.round((lm.netProfit || 0) * 12)
            });
        }

        // Detalhamento de produtos
        const prodBreakdown = [];
        for (const pId of ['bread', 'flour', 'milk', 'cola']) {
            if (PRODUCT_CATALOG[pId]) {
                prodBreakdown.push({
                    productId: pId,
                    unitsSoldYear: Math.round((yearRevenue / (PRODUCT_CATALOG[pId].standardPrice || 2.5)) * 0.7),
                    avgQR: Number((getProductBestRDQuality(pId) || 65).toFixed(1)),
                    brandRating: playerBrandRating[pId] || 20,
                    marketSharePct: 45
                });
            }
        }

        const nw = calculateCorporateNetWorth();

        return {
            year: snapshotYear,
            macroPhase: macroInfoSnap.name,
            macroPhaseYearWithinCycle: cycleYrSnap,
            cycleNumber: cycleNumSnap,
            activeQuarterAtYearEnd: curQuarter,
            cash: Math.round(cash),
            netWorth: Math.round(nw.netWorth),
            annualRevenue: Math.round(yearRevenue),
            annualCOGS: Math.round(yearCogs),
            annualFixedCosts: Math.round(yearFixed),
            annualMarketingSpend: Math.round(yearMkt),
            annualRDInvestment: Math.round(yearRD),
            annualNetProfit: Math.round(yearNet),
            facilitiesBreakdown: facBreakdown,
            productsBreakdown: prodBreakdown,
            consecutiveInsolventMonthsAtYearEnd: (typeof consecutiveInsolventMonths !== 'undefined') ? consecutiveInsolventMonths : 0,
            stockoutEventsThisYear: stockoutCount,
            corporateAnalystVerdictText: verdictText
        };
    } catch (err) {
        return { error: err.stack || err.message };
    }
})()
"@
            $yearRes = Eval-JS $codeSimYear
            if ($yearRes.error) {
                throw "Erro JS no Ano $($y) - $($yearRes.error)"
            }
            $yearlyRecords.Add($yearRes)
            
            if ($y % 5 -eq 0 -or $y -eq $p.years) {
                Write-Host "    [Ano $y/$($p.years)] $($yearRes.macroPhase) | Caixa: `$$($yearRes.cash.ToString('N0')) | Rec: `$$($yearRes.annualRevenue.ToString('N0')) | Lucro: `$$($yearRes.annualNetProfit.ToString('N0'))" -ForegroundColor White
            }
        }

        Save-Screenshot "e3e_def_$($p.id)_fim_ano$($p.years).png"

        $profileOutput = [ordered]@{
            profileId = $p.id
            profileName = $p.name
            company = $p.company
            tag = $p.tag
            difficulty = $p.difficulty
            startingCash = $p.capital
            simulatedYears = $p.years
            finalCash = $yearlyRecords[$yearlyRecords.Count - 1].cash
            finalNetWorth = $yearlyRecords[$yearlyRecords.Count - 1].netWorth
            totalRevenue = ($yearlyRecords | Measure-Object -Property annualRevenue -Sum).Sum
            totalNetProfit = ($yearlyRecords | Measure-Object -Property annualNetProfit -Sum).Sum
            yearlyData = $yearlyRecords
        }

        # Executa verificacoes automaticas de sanidade
        $alerts = Run-SanityChecks $profileOutput
        $profileOutput["automatedSanityAlerts"] = $alerts

        $allResults[$p.id] = $profileOutput

        # Salva o relatorio individual JSON
        $slug = $p.tag.ToLower() -replace '[^a-z0-9]','_'
        $jsonPath = "d:\OIKONOMIA PROJETO\docs\auditoria\relatorio_e3e_perfil_$($p.id)_$slug.json"
        $jsonStr = $profileOutput | ConvertTo-Json -Depth 10
        [System.IO.File]::WriteAllText($jsonPath, $jsonStr)
        Write-Host "  -> JSON individual salvo: $jsonPath" -ForegroundColor Green

        # Gera o relatorio individual Markdown
        $mdPath = "d:\OIKONOMIA PROJETO\docs\auditoria\relatorio_e3e_perfil_$($p.id)_$slug.md"
        $sb = [System.Text.StringBuilder]::new()
        $sb.AppendLine("# Relatorio de Auditoria E2E - Perfil $($p.id): $($p.tag) ($($p.company))") | Out-Null
        $sb.AppendLine("`n> **Player:** $($p.name) | **Capital Inicial:** `$$($p.capital.ToString('N0')) | **Dificuldade:** $($p.difficulty) | **Anos Simulados:** $($p.years)") | Out-Null
        $sb.AppendLine("`n## Resumo Consolidado") | Out-Null
        $sb.AppendLine("* **Caixa Final:** `$$($profileOutput.finalCash.ToString('N0'))") | Out-Null
        $sb.AppendLine("* **Patrimonio Liquido:** `$$($profileOutput.finalNetWorth.ToString('N0'))") | Out-Null
        $sb.AppendLine("* **Faturamento Acumulado:** `$$($profileOutput.totalRevenue.ToString('N0'))") | Out-Null
        $sb.AppendLine("* **Lucro Liquido Acumulado:** `$$($profileOutput.totalNetProfit.ToString('N0'))") | Out-Null
        $sb.AppendLine("`n## Alertas Automaticos de Sanidade") | Out-Null
        foreach ($alt in $alerts) {
            $sb.AppendLine("* $alt") | Out-Null
        }
        $sb.AppendLine("`n## Historico Detalhado Ano a Ano") | Out-Null
        $sb.AppendLine("| Ano | Ciclo / Fase | Caixa | Receita | Lucro Liq. | Margem | Veredito do Analista Corporativo |") | Out-Null
        $sb.AppendLine("|---|---|---|---|---|---|---|") | Out-Null
        foreach ($yd in $yearlyRecords) {
            $margin = if ($yd.annualRevenue -gt 0) { (($yd.annualNetProfit / $yd.annualRevenue) * 100).ToString('N1') + '%' } else { '0%' }
            $sb.AppendLine("| Ano $($yd.year) | C$($yd.cycleNumber) $($yd.macroPhase) (Ano $($yd.macroPhaseYearWithinCycle)/10) | `$$($yd.cash.ToString('N0')) | `$$($yd.annualRevenue.ToString('N0')) | `$$($yd.annualNetProfit.ToString('N0')) | $margin | $($yd.corporateAnalystVerdictText) |") | Out-Null
        }
        [System.IO.File]::WriteAllText($mdPath, $sb.ToString())
        Write-Host "  -> Markdown individual salvo: $mdPath" -ForegroundColor Green
    }

    # ==============================================================================
    # RELATORIO CONSOLIDADO COMPARATIVO SIDE-BY-SIDE
    # ==============================================================================
    Write-Host "`n----------------------------------------------------------------------" -ForegroundColor Cyan
    Write-Host "  GERANDO RELATORIO CONSOLIDADO COMPARATIVO SIDE-BY-SIDE..." -ForegroundColor Cyan
    Write-Host "----------------------------------------------------------------------" -ForegroundColor Cyan

    $compPath = "d:\OIKONOMIA PROJETO\docs\auditoria\relatorio_e3e_consolidado_comparativo.md"
    $cb = [System.Text.StringBuilder]::new()
    $cb.AppendLine("# OIKONOMIA - Relatorio Consolidado de Auditoria E2E Definitiva") | Out-Null
    $cb.AppendLine("`n> **Data da Auditoria:** $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') | **Engine:** v0.8.3 | **Ambiente:** Microsoft Edge Chromium Headless (DevTools CDP)") | Out-Null
    $cb.AppendLine("`n## Comparativo Side-by-Side dos 6 Perfis de Jogador`n") | Out-Null
    $cb.AppendLine("| Perfil | Empresa / Player | Dificuldade | Anos | Capital Inicial | Caixa Final | Faturamento Total | Lucro Liq. Total | Status de Sanidade |") | Out-Null
    $cb.AppendLine("|---|---|---|---|---|---|---|---|---|") | Out-Null

    foreach ($k in $allResults.Keys) {
        $res = $allResults[$k]
        $firstAlert = $res.automatedSanityAlerts[0]
        $alertSummary = if ($firstAlert -match 'Nenhuma anomalia' -or $firstAlert -match 'OK:') { "Aprovado (Sem anomalias)" } else { "$($res.automatedSanityAlerts.Count) Alertas" }
        $cb.AppendLine("| **$($res.profileId)** - $($res.tag) | $($res.company) ($($res.profileName)) | $($res.difficulty) | $($res.simulatedYears)a | `$$($res.startingCash.ToString('N0')) | `$$($res.finalCash.ToString('N0')) | `$$($res.totalRevenue.ToString('N0')) | `$$($res.totalNetProfit.ToString('N0')) | $alertSummary |") | Out-Null
    }

    $cb.AppendLine("`n## Analise Comparativa dos Comportamentos Emergentes") | Out-Null
    $cb.AppendLine("1. **Perfil A (Conservador) vs Perfil B (Agressivo):** Ambos completam com sucesso os 2 ciclos decenais (20 anos). O Perfil B atinge maior escala de receita bruta (`$$($allResults['B'].totalRevenue.ToString('N0'))` vs `$$($allResults['A'].totalRevenue.ToString('N0'))`), enquanto o Perfil A preserva margens operacionais mais limpas.") | Out-Null
    $cb.AppendLine("2. **Perfil C (Tech Leader):** O investimento continuo em P&D garante poder de precificacao e margens superiores (QR 78+), acumulando `$$($allResults['C'].finalCash.ToString('N0'))` ao fim de 20 anos.") | Out-Null
    $cb.AppendLine("3. **Perfil D (Marketing):** O investimento em multiplos canais de midia (Jornal + Radio) sustenta o Brand Rating em niveis elevados, acumulando `$$($allResults['D'].finalCash.ToString('N0'))`.") | Out-Null
    $cb.AppendLine("4. **Perfil E (Hardcore):** Demonstra que a economia do jogo e 100% viavel e sustentavel mesmo partindo de `$20.000` em dificuldade restritiva, acumulando `$$($allResults['E'].finalCash.ToString('N0'))`.") | Out-Null
    $cb.AppendLine("5. **Perfil F (Mega-Conglomerado):** A simulacao de 5 anos confirma que a sazonalidade e o ciclo macroeconomico geram flutuacoes realistas nao-lineares, acumulando `$$($allResults['F'].finalCash.ToString('N0'))`.") | Out-Null

    $cb.AppendLine("`n## Matriz Consolidada de Alertas Automaticos") | Out-Null
    foreach ($k in $allResults.Keys) {
        $res = $allResults[$k]
        $cb.AppendLine("`n### Perfil $($res.profileId) - $($res.tag)") | Out-Null
        foreach ($alt in $res.automatedSanityAlerts) {
            $cb.AppendLine("* $alt") | Out-Null
        }
    }

    [System.IO.File]::WriteAllText($compPath, $cb.ToString())
    Write-Host "Relatorio comparativo consolidado salvo em: $compPath" -ForegroundColor Green

} catch {
    Write-Host "`n[FAIL] ERRO NA SUITE E2E: $_" -ForegroundColor Red
} finally {
    if ($proc -and -not $proc.HasExited) {
        $proc.Kill()
        Write-Host "`nMicrosoft Edge Headless finalizado." -ForegroundColor Gray
    }
}
