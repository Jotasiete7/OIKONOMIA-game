# tools/generate_mineral_terrain_sprites.ps1
Add-Type -AssemblyName System.Drawing

$w = 64
$h = 32

function Create-IsometricTile($filename, $baseColor, $borderColor, $speckleColors, $speckleCount) {
    $bmp = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.Clear([System.Drawing.Color]::Transparent)

    $brushBase = New-Object System.Drawing.SolidBrush($baseColor)
    $penBorder = New-Object System.Drawing.Pen($borderColor, 1)

    $pTop = New-Object System.Drawing.Point(($w / 2), 0)
    $pRight = New-Object System.Drawing.Point(($w - 1), ($h / 2))
    $pBottom = New-Object System.Drawing.Point(($w / 2), ($h - 1))
    $pLeft = New-Object System.Drawing.Point(0, ($h / 2))
    $pts = @($pTop, $pRight, $pBottom, $pLeft)

    $g.FillPolygon($brushBase, $pts)

    $rand = New-Object System.Random(1337)
    for ($i = 0; $i -lt $speckleCount; $i++) {
        $rx = $rand.Next(4, $w - 4)
        $ry = $rand.Next(3, $h - 3)
        $dx = [Math]::Abs($rx - ($w / 2)) / ($w / 2)
        $dy = [Math]::Abs($ry - ($h / 2)) / ($h / 2)
        if ($dx + $dy -lt 0.82) {
            $color = $speckleColors[$i % $speckleColors.Count]
            $spBrush = New-Object System.Drawing.SolidBrush($color)
            $size = if ($i % 5 -eq 0) { 2 } else { 1 }
            $g.FillRectangle($spBrush, $rx, $ry, $size, $size)
            $spBrush.Dispose()
        }
    }

    $g.DrawPolygon($penBorder, $pts)
    $g.Dispose()
    $brushBase.Dispose()
    $penBorder.Dispose()

    $fullPath = "d:\OIKONOMIA PROJETO\client\assets\terrenos\$filename"
    $bmp.Save($fullPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Created: $fullPath"
}

# 1. Sílica: Arenito bege-mineral suave integrado às colinas (não branco papel!)
$baseSilica = [System.Drawing.Color]::FromArgb(255, 130, 125, 109) # #827d6d
$borderSilica = [System.Drawing.Color]::FromArgb(255, 95, 90, 78)
$specklesSilica = @(
    [System.Drawing.Color]::FromArgb(255, 175, 170, 155),
    [System.Drawing.Color]::FromArgb(255, 195, 190, 175),
    [System.Drawing.Color]::FromArgb(255, 105, 100, 85)
)
Create-IsometricTile "silica.png" $baseSilica $borderSilica $specklesSilica 45

# 2. Minério de Ferro: Rocha montanhosa escura com veios avermelhados de hematita e magnetita
$baseIron = [System.Drawing.Color]::FromArgb(255, 65, 55, 50)
$borderIron = [System.Drawing.Color]::FromArgb(255, 45, 38, 35)
$specklesIron = @(
    [System.Drawing.Color]::FromArgb(255, 160, 68, 55),
    [System.Drawing.Color]::FromArgb(255, 190, 85, 65),
    [System.Drawing.Color]::FromArgb(255, 95, 80, 75)
)
Create-IsometricTile "iron_ore.png" $baseIron $borderIron $specklesIron 50

# 3. Bauxita: Argila e laterita avermelhada/alaranjada clássica da bauxita
$baseBauxite = [System.Drawing.Color]::FromArgb(255, 140, 75, 50)
$borderBauxite = [System.Drawing.Color]::FromArgb(255, 105, 52, 35)
$specklesBauxite = @(
    [System.Drawing.Color]::FromArgb(255, 185, 105, 70),
    [System.Drawing.Color]::FromArgb(255, 205, 125, 80),
    [System.Drawing.Color]::FromArgb(255, 115, 60, 40)
)
Create-IsometricTile "bauxite.png" $baseBauxite $borderBauxite $specklesBauxite 45

# 4. Ouro: Rocha montanhosa cinza escura com veios de quartzo aurífero dourado brilhante
$baseGold = [System.Drawing.Color]::FromArgb(255, 55, 55, 62)
$borderGold = [System.Drawing.Color]::FromArgb(255, 38, 38, 45)
$specklesGold = @(
    [System.Drawing.Color]::FromArgb(255, 234, 179, 8),
    [System.Drawing.Color]::FromArgb(255, 250, 204, 21),
    [System.Drawing.Color]::FromArgb(255, 180, 135, 10),
    [System.Drawing.Color]::FromArgb(255, 254, 240, 138)
)
Create-IsometricTile "gold_ore.png" $baseGold $borderGold $specklesGold 40

# 5. Minerais Químicos: Solo salino / bacia evaporítica com crostas minerais de sais claros
$baseChem = [System.Drawing.Color]::FromArgb(255, 88, 105, 100)
$borderChem = [System.Drawing.Color]::FromArgb(255, 62, 78, 75)
$specklesChem = @(
    [System.Drawing.Color]::FromArgb(255, 165, 195, 185),
    [System.Drawing.Color]::FromArgb(255, 130, 170, 160),
    [System.Drawing.Color]::FromArgb(255, 70, 85, 80)
)
Create-IsometricTile "chemicals.png" $baseChem $borderChem $specklesChem 45

# 6. Petróleo em Terra Firme: Solo sedimentar com afloramento de xisto betuminoso
$baseOil = [System.Drawing.Color]::FromArgb(255, 45, 48, 52)
$borderOil = [System.Drawing.Color]::FromArgb(255, 30, 32, 35)
$specklesOil = @(
    [System.Drawing.Color]::FromArgb(255, 25, 26, 28),
    [System.Drawing.Color]::FromArgb(255, 70, 75, 82),
    [System.Drawing.Color]::FromArgb(255, 56, 189, 248) # reflexo leve
)
Create-IsometricTile "oil_field.png" $baseOil $borderOil $specklesOil 40

Write-Host "All mineral terrain sprites successfully generated!"
