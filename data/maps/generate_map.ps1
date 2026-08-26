# ==============================================================================
# GERADOR DE MAPA PROCEDURAL ISOMÉTRICO (OIKONOMIA - CAPITALISM STYLE)
# ==============================================================================
$mapW = 128
$mapH = 128
$tileW = 64
$tileH = 32

$GID_DEEP_WATER = 1
$GID_SHALLOW_WATER = 2
$GID_BEACH_SAND = 3
$GID_GRASS = 4
$GID_FERTILE_SOIL = 5
$GID_HILLS = 6
$GID_MOUNTAINS = 7
$GID_RES_FOREST = 8
$GID_RES_IRON = 9
$GID_RES_OIL = 10
$GID_ROAD_MAIN = 11
$GID_ROAD_DIRT = 12
$GID_BUILDING_PORT = 13
$GID_CITY_COMMERCIAL = 14
$GID_CITY_RESIDENTIAL = 15
$GID_FACTORY_IND = 16
$GID_FARM_AGRO = 17

# Matrizes das 5 camadas
$lWater = New-Object 'int[][]' $mapH
$lTerrain = New-Object 'int[][]' $mapH
$lRes = New-Object 'int[][]' $mapH
$lRoad = New-Object 'int[][]' $mapH
$lBuild = New-Object 'int[][]' $mapH

for ($y = 0; $y -lt $mapH; $y++) {
    $lWater[$y] = New-Object int[] $mapW
    $lTerrain[$y] = New-Object int[] $mapW
    $lRes[$y] = New-Object int[] $mapW
    $lRoad[$y] = New-Object int[] $mapW
    $lBuild[$y] = New-Object int[] $mapW
}

$rand = New-Object System.Random(4242)

function Get-Elevation($x, $y) {
    $nx = ($x - 64.0) / 64.0
    $ny = ($y - 64.0) / 64.0
    $dist = [Math]::Sqrt($nx * $nx + $ny * $ny)
    $island = [Math]::Max(0.0, 1.0 - ($dist * 0.92))
    
    $harmonics = ([Math]::Sin($x * 0.07) * [Math]::Cos($y * 0.07)) * 0.35 +
                 ([Math]::Sin($x * 0.15 + 1.2) * [Math]::Cos($y * 0.15 + 0.8)) * 0.22 +
                 ([Math]::Sin($x * 0.3 + 2.5) * [Math]::Sin($y * 0.3 + 1.5)) * 0.13 + 0.5
                 
    # Baia central navegavel conectando aos oceanos (estilo Capitalism)
    $bayDist = [Math]::Sqrt([Math]::Pow(($x - 64), 2) + [Math]::Pow(($y - 64), 2))
    $bayMod = if ($bayDist -lt 24) { -0.32 * (1.0 - ($bayDist / 24.0)) } else { 0.0 }
    
    return ($harmonics * 0.65 + $island * 0.35) + $bayMod
}

function Get-Moisture($x, $y) {
    return ([Math]::Sin($x * 0.05 + 0.5) * [Math]::Cos($y * 0.06 + 1.2)) * 0.5 + 0.5
}

$coastalSpots = [System.Collections.ArrayList]::new()
$fertileSpots = [System.Collections.ArrayList]::new()
$mountainSpots = [System.Collections.ArrayList]::new()
$grassSpots = [System.Collections.ArrayList]::new()

# 1. Gerar Terreno
for ($y = 0; $y -lt $mapH; $y++) {
    for ($x = 0; $x -lt $mapW; $x++) {
        $elev = Get-Elevation $x $y
        $moist = Get-Moisture $x $y
        
        if ($elev -lt 0.32) {
            $lWater[$y][$x] = $GID_DEEP_WATER
        }
        elseif ($elev -lt 0.39) {
            $lWater[$y][$x] = $GID_SHALLOW_WATER
        }
        elseif ($elev -lt 0.43) {
            $lTerrain[$y][$x] = $GID_BEACH_SAND
            [void]$coastalSpots.Add(@{ X = $x; Y = $y })
        }
        elseif ($elev -lt 0.68) {
            if ($moist -gt 0.54) {
                $lTerrain[$y][$x] = $GID_FERTILE_SOIL
                [void]$fertileSpots.Add(@{ X = $x; Y = $y })
            } else {
                $lTerrain[$y][$x] = $GID_GRASS
                [void]$grassSpots.Add(@{ X = $x; Y = $y })
            }
        }
        elseif ($elev -lt 0.80) {
            $lTerrain[$y][$x] = $GID_HILLS
            [void]$grassSpots.Add(@{ X = $x; Y = $y })
        }
        else {
            $lTerrain[$y][$x] = $GID_MOUNTAINS
            [void]$mountainSpots.Add(@{ X = $x; Y = $y })
        }
    }
}

# 2. Recursos Naturais
# Florestas (Clusters em terra fertil)
for ($i = 0; $i -lt 300; $i++) {
    if ($fertileSpots.Count -gt 0) {
        $pt = $fertileSpots[$rand.Next($fertileSpots.Count)]
        $lRes[$pt.Y][$pt.X] = $GID_RES_FOREST
    }
}
# Minas de Ferro nas montanhas
$ironPoints = [System.Collections.ArrayList]::new()
for ($i = 0; $i -lt 16; $i++) {
    if ($mountainSpots.Count -gt 0) {
        $pt = $mountainSpots[$rand.Next($mountainSpots.Count)]
        $lRes[$pt.Y][$pt.X] = $GID_RES_IRON
        [void]$ironPoints.Add($pt)
    }
}
# Petroleo na costa/praia
$oilPoints = [System.Collections.ArrayList]::new()
for ($i = 0; $i -lt 10; $i++) {
    if ($coastalSpots.Count -gt 0) {
        $pt = $coastalSpots[$rand.Next($coastalSpots.Count)]
        $lRes[$pt.Y][$pt.X] = $GID_RES_OIL
        [void]$oilPoints.Add($pt)
    }
}

# 3. 4 Cidades Principais (Capitalism Model)
$cityCenters = @(
    @{ X = 40; Y = 42 },
    @{ X = 86; Y = 38 },
    @{ X = 42; Y = 86 },
    @{ X = 88; Y = 84 }
)

$validCities = [System.Collections.ArrayList]::new()
foreach ($c in $cityCenters) {
    $cx = $c.X
    $cy = $c.Y
    if ($lTerrain[$cy][$cx] -eq 0) {
        $nearLand = $grassSpots | Select-Object -First 1
        if ($nearLand) { $cx = $nearLand.X; $cy = $nearLand.Y }
    }
    
    $lBuild[$cy][$cx] = $GID_CITY_COMMERCIAL
    [void]$validCities.Add(@{ X = $cx; Y = $cy })
    
    # Bairros residenciais ao redor
    for ($dy = -3; $dy -le 3; $dy++) {
        for ($dx = -3; $dx -le 3; $dx++) {
            $nx = $cx + $dx
            $ny = $cy + $dy
            if ($nx -ge 0 -and $nx -lt $mapW -and $ny -ge 0 -and $ny -lt $mapH) {
                if (($dx -ne 0 -or $dy -ne 0) -and $lTerrain[$ny][$nx] -in @($GID_GRASS, $GID_FERTILE_SOIL)) {
                    if ($rand.NextDouble() -lt 0.65) {
                        $lBuild[$ny][$nx] = $GID_CITY_RESIDENTIAL
                    }
                }
            }
        }
    }
}

# 4. Portos Maritimos Estrategicos (Seaports) na costa
$ports = [System.Collections.ArrayList]::new()
foreach ($c in $validCities) {
    $closestCoast = $null
    $minD = 999999
    foreach ($cp in $coastalSpots) {
        $d = [Math]::Abs($cp.X - $c.X) + [Math]::Abs($cp.Y - $c.Y)
        if ($d -lt $minD) {
            $minD = $d
            $closestCoast = $cp
        }
    }
    if ($closestCoast -ne $null) {
        $lBuild[$closestCoast.Y][$closestCoast.X] = $GID_BUILDING_PORT
        [void]$ports.Add($closestCoast)
    }
}

# 5. Fazendas Agricolas no cinturao fertil
for ($i = 0; $i -lt 60; $i++) {
    if ($fertileSpots.Count -gt 0) {
        $pt = $fertileSpots[$rand.Next($fertileSpots.Count)]
        if ($lBuild[$pt.Y][$pt.X] -eq 0 -and $lRes[$pt.Y][$pt.X] -eq 0) {
            $lBuild[$pt.Y][$pt.X] = $GID_FARM_AGRO
        }
    }
}

# 6. Industrias e Fabricas proximas as cidades
foreach ($c in $validCities) {
    for ($i = 0; $i -lt 4; $i++) {
        $fx = $c.X + $rand.Next(-7, 8)
        $fy = $c.Y + $rand.Next(-7, 8)
        if ($fx -ge 0 -and $fx -lt $mapW -and $fy -ge 0 -and $fy -lt $mapH) {
            if ($lTerrain[$fy][$fx] -in @($GID_GRASS, $GID_FERTILE_SOIL) -and $lBuild[$fy][$fx] -eq 0) {
                $lBuild[$fy][$fx] = $GID_FACTORY_IND
            }
        }
    }
}

# 7. Rede de Rodovias
function Draw-Road($p1, $p2) {
    $curX = $p1.X
    $curY = $p1.Y
    while ($curX -ne $p2.X) {
        $curX += if ($p2.X -gt $curX) { 1 } else { -1 }
        if ($lWater[$curY][$curX] -eq 0 -and $lBuild[$curY][$curX] -eq 0) {
            $lRoad[$curY][$curX] = $GID_ROAD_MAIN
        }
    }
    while ($curY -ne $p2.Y) {
        $curY += if ($p2.Y -gt $curY) { 1 } else { -1 }
        if ($lWater[$curY][$curX] -eq 0 -and $lBuild[$curY][$curX] -eq 0) {
            $lRoad[$curY][$curX] = $GID_ROAD_MAIN
        }
    }
}

# Conectar cidades em anel
for ($i = 0; $i -lt $validCities.Count; $i++) {
    $nextIdx = ($i + 1) % $validCities.Count
    Draw-Road $validCities[$i] $validCities[$nextIdx]
}
# Conectar portos as suas cidades
for ($i = 0; $i -lt $ports.Count; $i++) {
    Draw-Road $ports[$i] $validCities[$i % $validCities.Count]
}
# Conectar minas principais
for ($i = 0; $i -lt [Math]::Min(6, $ironPoints.Count); $i++) {
    Draw-Road $ironPoints[$i] $validCities[$i % $validCities.Count]
}

# 8. Exportar XML TMX
$sb = [System.Text.StringBuilder]::new()
[void]$sb.AppendLine('<?xml version="1.0" encoding="UTF-8"?>')
[void]$sb.AppendLine("<map version=`"1.10`" tiledversion=`"1.10.2`" orientation=`"isometric`" renderorder=`"right-down`" width=`"$mapW`" height=`"$mapH`" tilewidth=`"$tileW`" tileheight=`"$tileH`" infinite=`"0`" nextlayerid=`"6`" nextobjectid=`"1`">")
[void]$sb.AppendLine(" <tileset firstgid=`"1`" name=`"oikonomia_tileset`" tilewidth=`"$tileW`" tileheight=`"$tileH`" tilecount=`"32`" columns=`"8`">")
[void]$sb.AppendLine("  <image source=`"tileset.png`" width=`"512`" height=`"128`"/>")
[void]$sb.AppendLine(' </tileset>')

$layerDefs = @(
    @{ Id = 1; Name = '01_Agua_Base'; Matrix = $lWater },
    @{ Id = 2; Name = '02_Terreno_Relevo'; Matrix = $lTerrain },
    @{ Id = 3; Name = '03_Recursos_Naturais'; Matrix = $lRes },
    @{ Id = 4; Name = '04_Infraestrutura_Vias'; Matrix = $lRoad },
    @{ Id = 5; Name = '05_Edificios_Zonamento'; Matrix = $lBuild }
)

foreach ($layer in $layerDefs) {
    $lid = $layer.Id
    $lname = $layer.Name
    [void]$sb.AppendLine(" <layer id=`"$lid`" name=`"$lname`" width=`"$mapW`" height=`"$mapH`">")
    [void]$sb.AppendLine('  <data encoding="csv">')
    
    $rows = [System.Collections.Generic.List[string]]::new()
    for ($y = 0; $y -lt $mapH; $y++) {
        $rows.Add(($layer.Matrix[$y] -join ','))
    }
    [void]$sb.AppendLine(($rows -join ",`n"))
    [void]$sb.AppendLine('  </data>')
    [void]$sb.AppendLine(' </layer>')
}

[void]$sb.AppendLine('</map>')

[System.IO.File]::WriteAllText((Join-Path (Get-Location) 'oikonomia_map.tmx'), $sb.ToString(), [System.Text.Encoding]::UTF8)
Write-Output 'TMX File successfully generated: oikonomia_map.tmx'
