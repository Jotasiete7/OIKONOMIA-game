# tools/create_missing_sprites.ps1
Add-Type -AssemblyName System.Drawing

$baseDir = "d:\OIKONOMIA PROJETO"

# 1. Copiar mine_timber.png para farm_timber.png nas pastas agricultura e agro
$timberSrc = Join-Path $baseDir "client\assets\minas\mine_timber.png"
$timberDestAgro = Join-Path $baseDir "client\assets\agro\farm_timber.png"
$timberDestAgri = Join-Path $baseDir "client\assets\agricultura\farm_timber.png"
$timberDestBuild = Join-Path $baseDir "OIKONOMIA-buildings\agricultura\farm_timber.png"

if (Test-Path $timberSrc) {
    Copy-Item $timberSrc $timberDestAgro -Force
    Copy-Item $timberSrc $timberDestAgri -Force
    Copy-Item $timberSrc $timberDestBuild -Force
    Write-Host "[OK] farm_timber.png copiado com sucesso para as pastas de agricultura."
}

# 2. Gerar rd_center.png (Centro de Pesquisa & Desenvolvimento) em client/assets/pesquisa/
$pesquisaDir = Join-Path $baseDir "client\assets\pesquisa"
if (!(Test-Path $pesquisaDir)) {
    New-Item -ItemType Directory -Path $pesquisaDir -Force | Out-Null
}

$rdBmp = New-Object System.Drawing.Bitmap(64, 64, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($rdBmp)
$g.Clear([System.Drawing.Color]::Transparent)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::None

# Diamante base (chao de alta tecnologia / concreto futurista)
$basePts = @(
    (New-Object System.Drawing.Point 32, 33),
    (New-Object System.Drawing.Point 62, 48),
    (New-Object System.Drawing.Point 32, 63),
    (New-Object System.Drawing.Point 2, 48)
)
$brushGround = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 30, 41, 59))
$penBorder = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 15, 23, 42), 1)
$g.FillPolygon($brushGround, $basePts)
$g.DrawPolygon($penBorder, $basePts)

# Predio Central (Face Esquerda - tom intermediario, Face Direita - sombra, Teto - iluminado)
$faceLeft = @(
    (New-Object System.Drawing.Point 12, 38),
    (New-Object System.Drawing.Point 32, 48),
    (New-Object System.Drawing.Point 32, 28),
    (New-Object System.Drawing.Point 12, 18)
)
$brushLeft = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 147, 51, 234)) # Roxo tecnologico
$g.FillPolygon($brushLeft, $faceLeft)

$faceRight = @(
    (New-Object System.Drawing.Point 32, 48),
    (New-Object System.Drawing.Point 52, 38),
    (New-Object System.Drawing.Point 52, 18),
    (New-Object System.Drawing.Point 32, 28)
)
$brushRight = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 107, 33, 168)) # Roxo escuro sombra
$g.FillPolygon($brushRight, $faceRight)

$faceTop = @(
    (New-Object System.Drawing.Point 32, 8),
    (New-Object System.Drawing.Point 52, 18),
    (New-Object System.Drawing.Point 32, 28),
    (New-Object System.Drawing.Point 12, 18)
)
$brushTop = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 192, 132, 252)) # Roxo claro luz
$g.FillPolygon($brushTop, $faceTop)

# Cupula Geodesica / Laboratorio de Vidro no Topo
$brushDome = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(240, 56, 189, 248)) # Ciano fluorescente
$g.FillEllipse($brushDome, 24, 8, 16, 12)
$brushDomeCore = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 224, 242, 254))
$g.FillEllipse($brushDomeCore, 27, 10, 10, 7)

# Janelas com luz interna de laboratorio (Cyan)
$brushWin = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 56, 189, 248))
$g.FillRectangle($brushWin, 18, 25, 4, 6)
$g.FillRectangle($brushWin, 24, 28, 4, 6)
$g.FillRectangle($brushWin, 36, 30, 4, 6)
$g.FillRectangle($brushWin, 42, 27, 4, 6)

# Antena de transmissao de pesquisa cientifica no topo
$penAntenna = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 226, 232, 240), 1)
$g.DrawLine($penAntenna, 32, 8, 32, 2)
$brushBeacon = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 239, 68, 68)) # Luz vermelha pisca
$g.FillEllipse($brushBeacon, 31, 1, 3, 3)

# Contorno nítido estilo pixel-isometric
$penOutline = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 15, 23, 42), 1)
$g.DrawPolygon($penOutline, $faceLeft)
$g.DrawPolygon($penOutline, $faceRight)
$g.DrawPolygon($penOutline, $faceTop)

$g.Dispose()
$rdPath = Join-Path $pesquisaDir "rd_center.png"
$rdBmp.Save($rdPath, [System.Drawing.Imaging.ImageFormat]::Png)
$rdBmp.Dispose()
Write-Host "[OK] rd_center.png gerado em: $rdPath"

# 3. Gerar industry_heavy.png em client/assets/industrial/ e client/assets/empresas/
$indBmp = New-Object System.Drawing.Bitmap(64, 64, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$gi = [System.Drawing.Graphics]::FromImage($indBmp)
$gi.Clear([System.Drawing.Color]::Transparent)
$gi.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::None

# Base de asfalto/concreto industrial
$gi.FillPolygon($brushGround, $basePts)
$gi.DrawPolygon($penBorder, $basePts)

# Galpao Industrial Pesado
$indLeft = @(
    (New-Object System.Drawing.Point 10, 40),
    (New-Object System.Drawing.Point 32, 51),
    (New-Object System.Drawing.Point 32, 29),
    (New-Object System.Drawing.Point 10, 18)
)
$brushIndLeft = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 71, 85, 105))
$gi.FillPolygon($brushIndLeft, $indLeft)

$indRight = @(
    (New-Object System.Drawing.Point 32, 51),
    (New-Object System.Drawing.Point 54, 40),
    (New-Object System.Drawing.Point 54, 18),
    (New-Object System.Drawing.Point 32, 29)
)
$brushIndRight = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 51, 65, 85))
$gi.FillPolygon($brushIndRight, $indRight)

$indTop = @(
    (New-Object System.Drawing.Point 32, 8),
    (New-Object System.Drawing.Point 54, 18),
    (New-Object System.Drawing.Point 32, 29),
    (New-Object System.Drawing.Point 10, 18)
)
$brushIndTop = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 148, 163, 184))
$gi.FillPolygon($brushIndTop, $indTop)

# 2 Chamines industriais gemeas altas com fumaca
$brushChimney = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 234, 88, 12)) # Laranja industrial
$gi.FillRectangle($brushChimney, 18, 10, 5, 16)
$gi.FillRectangle($brushChimney, 40, 8, 5, 16)

$brushSmoke = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(200, 226, 232, 240))
$gi.FillEllipse($brushSmoke, 16, 4, 8, 6)
$gi.FillEllipse($brushSmoke, 39, 2, 8, 6)

$gi.DrawPolygon($penOutline, $indLeft)
$gi.DrawPolygon($penOutline, $indRight)
$gi.DrawPolygon($penOutline, $indTop)

$gi.Dispose()
$indPath1 = Join-Path $baseDir "client\assets\industrial\industry_heavy.png"
$indPath2 = Join-Path $baseDir "client\assets\empresas\industry_heavy.png"
$indBmp.Save($indPath1, [System.Drawing.Imaging.ImageFormat]::Png)
$indBmp.Save($indPath2, [System.Drawing.Imaging.ImageFormat]::Png)
$indBmp.Dispose()
Write-Host "[OK] industry_heavy.png gerado em: $indPath1"
