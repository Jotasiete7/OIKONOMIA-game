# ==============================================================================
# OIKONOMIA - AUDITORIA HARDCORE MASTER (5 ANOS / 1.825 DIAS / TODOS OS NEGOCIOS)
# ==============================================================================

param(
    [string]$EdgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    [string]$GameUrl = "file:///D:/OIKONOMIA%20PROJETO/client/index.html"
)

$ErrorActionPreference = "Stop"

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "OIKONOMIA - AUDITORIA HARDCORE MASTER: 5 ANOS DE SIMULACAO" -ForegroundColor Cyan
Write-Host "TODOS OS NEGOCIOS (14 FAZENDAS, 7 MINAS, POLOS E 9 FORMATOS)" -ForegroundColor Cyan
Write-Host "================================================================`n" -ForegroundColor Cyan

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

    function Save-Screenshot($filename) {
        $res = Send-CDP "Page.captureScreenshot" @{ format = "png" }
        $bytes = [System.Convert]::FromBase64String($res.data)
        $dir = "d:\OIKONOMIA PROJETO\docs\auditoria\screenshots"
        if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
        $filePath = Join-Path $dir $filename
        [System.IO.File]::WriteAllBytes($filePath, $bytes)
        Write-Host "  Screenshot salvo: $filename" -ForegroundColor Gray
    }

    $null = Send-CDP "Page.enable"
    $null = Send-CDP "Runtime.enable"
    $null = Send-CDP "DOM.enable"
    $null = Send-CDP "Page.navigate" @{ url = $GameUrl }
    Start-Sleep -Milliseconds 2000

    Write-Host "Injetando Simulacao Hardcore de 5 Anos no DOM..." -ForegroundColor Yellow
    $runnerCode = [System.IO.File]::ReadAllText("d:\OIKONOMIA PROJETO\tools\audit_hardcore_5years_runner.js", [System.Text.Encoding]::UTF8)
    $results = Eval-JS $runnerCode

    Save-Screenshot "hardcore_5years_dre_canvas.png"

    Write-Host "`n--- [ESTRUTURA DA CORPORACAO HARDCORE] ---" -ForegroundColor Yellow
    Write-Host "  Modo de Jogo            : $($results.difficulty)" -ForegroundColor Green
    Write-Host "  Instalacoes Construidas : $($results.conglomerateSetup.totalFacilitiesBuilt) unidades ativas" -ForegroundColor Green
    Write-Host "  Tiles Ativos no Mapa    : $($results.conglomerateSetup.activeSparseTiles) tiles" -ForegroundColor Green

    Write-Host "`n--- [EVOLUCAO ANUAL DOS 5 ANOS DE SIMULACAO (1.825 DIAS)] ---" -ForegroundColor Yellow
    foreach ($yr in $results.yearlyFinancials) {
        Write-Host "  Ano $($yr.yearCompleted): Caixa `$$($yr.cash.ToString('N0')) | Patrimonio Liquido `$$($yr.netWorth.ToString('N0')) | Crescimento Acumulado: +$($yr.annualGrowthPct)%" -ForegroundColor Cyan
    }

    Write-Host "`n--- [DRE CONSOLIDADA MENSAL AO FINAL DO ANO 5] ---" -ForegroundColor Yellow
    $dre = $results.dreFinalConsolidated
    Write-Host "  (+) Receita Mensal Consolidada : $($dre.revenueMonthly)" -ForegroundColor Green
    Write-Host "  (-) CPV / Custos dos Insumos   : $($dre.cogsMonthly)" -ForegroundColor Red
    Write-Host "  (-) OPEX (Equipes + Solo)      : $($dre.opexMonthly)" -ForegroundColor Red
    Write-Host "  (=) LUCRO LIQUIDO MENSAL       : $($dre.netProfitMonthly)" -ForegroundColor Green
    Write-Host "  Analista Corporativo           : '$($dre.analystVerdict)' [$($dre.analystBadge)]" -ForegroundColor Yellow

    Write-Host "`n--- [VEREDITO EXECUTIVO DOS 5 ANOS HARDCORE] ---" -ForegroundColor Yellow
    $v = $results.verdict
    Write-Host "  Sobreviveu aos 5 Anos Hardcore : $($v.survivedHardcore5Years)" -ForegroundColor Green
    Write-Host "  Caixa Inicial                  : `$$($v.startingCash.ToString('N0'))" -ForegroundColor Green
    Write-Host "  Caixa Final                    : `$$($v.finalCash.ToString('N0'))" -ForegroundColor Green
    Write-Host "  Lucro Total Acumulado (5 Anos) : `$$($v.totalNetProfit5Years.ToString('N0'))" -ForegroundColor Green
    Write-Host "  Retorno sobre Investimento(ROI): +$($v.roiTotalPct)%" -ForegroundColor Green

    $jsonPath = "d:\OIKONOMIA PROJETO\docs\auditoria\audit_hardcore_5years_results.json"
    $results | ConvertTo-Json -Depth 10 | Set-Content -Path $jsonPath -Encoding UTF8
    Write-Host "`nRelatorio oficial salvo em: $jsonPath" -ForegroundColor Gray

    Write-Host "`n================================================================" -ForegroundColor Cyan
    Write-Host "AUDITORIA HARDCORE DE 5 ANOS FINALIZADA COM 100% DE SUCESSO!" -ForegroundColor Cyan
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
