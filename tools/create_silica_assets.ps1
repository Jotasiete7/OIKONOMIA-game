# tools/create_silica_assets.ps1
Add-Type -AssemblyName System.Drawing

$sandPath = "d:\OIKONOMIA PROJETO\client\assets\terrenos\sand.png"
$ironPath = "d:\OIKONOMIA PROJETO\client\assets\minas\mine_iron.png"

$sandImg = [System.Drawing.Bitmap]::FromFile($sandPath)
$w = $sandImg.Width
$h = $sandImg.Height
$sandImg.Dispose()

Write-Host "Terrain Tile Size: $w x $h"

# 1. Cria client/assets/terrenos/silica.png
# Textura de quartzo / sílica branca com brilho mineral cristalino
$silicaBmp = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($silicaBmp)
$g.Clear([System.Drawing.Color]::Transparent)

# Desenha o losango isométrico ou preenchimento de textura
$brushBase = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 241, 245, 249))
$penBorder = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 203, 213, 225), 1)

# Pontos do losango
$pTop = New-Object System.Drawing.Point(($w / 2), 0)
$pRight = New-Object System.Drawing.Point(($w - 1), ($h / 2))
$pBottom = New-Object System.Drawing.Point(($w / 2), ($h - 1))
$pLeft = New-Object System.Drawing.Point(0, ($h / 2))
$pts = @($pTop, $pRight, $pBottom, $pLeft)

$g.FillPolygon($brushBase, $pts)

# Adiciona veios de quartzo / cristais reluzentes
$rand = New-Object System.Random(42)
$crystalBrush1 = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 255, 255))
$crystalBrush2 = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 226, 232, 240))
$crystalBrush3 = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 148, 163, 184))

for ($i = 0; $i -lt 35; $i++) {
    $rx = $rand.Next(6, $w - 6)
    $ry = $rand.Next(4, $h - 4)
    # Verifica se está aproximadamente dentro do losango
    $dx = [Math]::Abs($rx - ($w / 2)) / ($w / 2)
    $dy = [Math]::Abs($ry - ($h / 2)) / ($h / 2)
    if ($dx + $dy -lt 0.85) {
        $cBrush = if ($i % 3 -eq 0) { $crystalBrush1 } elseif ($i % 3 -eq 1) { $crystalBrush2 } else { $crystalBrush3 }
        $g.FillRectangle($cBrush, $rx, $ry, 2, 2)
    }
}

$g.DrawPolygon($penBorder, $pts)
$g.Dispose()

$silicaPath = "d:\OIKONOMIA PROJETO\client\assets\terrenos\silica.png"
$silicaBmp.Save($silicaPath, [System.Drawing.Imaging.ImageFormat]::Png)
$silicaBmp.Dispose()
Write-Host "Saved: $silicaPath"

# 2. Cria client/assets/minas/mine_silica.png
$ironImg = [System.Drawing.Bitmap]::FromFile($ironPath)
$mw = $ironImg.Width
$mh = $ironImg.Height
$ironImg.Dispose()

Write-Host "Mine Sprite Size: $mw x $mh"

$mineSilicaBmp = New-Object System.Drawing.Bitmap($mw, $mh, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$gm = [System.Drawing.Graphics]::FromImage($mineSilicaBmp)
$gm.Clear([System.Drawing.Color]::Transparent)

# Base de instalação mineral com montes de sílica branca cristalina
$sandPileBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 248, 250, 252))
$sandPileShade = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 203, 213, 225))
$hopperBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 71, 85, 105))
$metalPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 51, 65, 85), 1)

# Moega industrial e esteiras
$gm.FillRectangle($hopperBrush, [int]($mw * 0.3), [int]($mh * 0.25), [int]($mw * 0.4), [int]($mh * 0.45))
$gm.DrawRectangle($metalPen, [int]($mw * 0.3), [int]($mh * 0.25), [int]($mw * 0.4), [int]($mh * 0.45))

# Montes de quartzo/areia branca de sílica aos pés da moega
$gm.FillEllipse($sandPileBrush, [int]($mw * 0.1), [int]($mh * 0.55), [int]($mw * 0.45), [int]($mh * 0.38))
$gm.FillEllipse($sandPileShade, [int]($mw * 0.45), [int]($mh * 0.58), [int]($mw * 0.45), [int]($mh * 0.35))
$gm.FillEllipse($sandPileBrush, [int]($mw * 0.35), [int]($mh * 0.62), [int]($mw * 0.35), [int]($mh * 0.30))

$gm.Dispose()
$mineSilicaPath = "d:\OIKONOMIA PROJETO\client\assets\minas\mine_silica.png"
$mineSilicaBmp.Save($mineSilicaPath, [System.Drawing.Imaging.ImageFormat]::Png)
$mineSilicaBmp.Dispose()
Write-Host "Saved: $mineSilicaPath"
