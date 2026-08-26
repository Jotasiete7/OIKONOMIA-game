# Script to parse oikonomia_map.tmx and output client/map_data.js
$tmxPath = "D:\OIKONOMIA PROJETO\data\maps\oikonomia_map.tmx"
$cityPath = "D:\OIKONOMIA PROJETO\data\cities\city-profiles.json"
$outJsPath = "D:\OIKONOMIA PROJETO\client\map_data.js"

$tmxXml = [xml](Get-Content $tmxPath -Raw -Encoding UTF8)
$cityJson = Get-Content $cityPath -Raw -Encoding UTF8

$layersObj = @{}
foreach ($layer in $tmxXml.map.layer) {
    $layerName = $layer.name
    $csvData = $layer.data.InnerText.Trim()
    $rows = $csvData -split "\r?\n"
    $matrix = @()
    foreach ($r in $rows) {
        $cleanR = $r.Trim().TrimEnd(',')
        if ($cleanR.Length -gt 0) {
            $vals = $cleanR -split ',' | ForEach-Object { [int]$_ }
            $matrix += ,$vals
        }
    }
    $layersObj[$layerName] = $matrix
}

$sb = [System.Text.StringBuilder]::new()
[void]$sb.AppendLine("// Auto-generated map data for OIKONOMIA 128x128 world")
[void]$sb.AppendLine("const MAP_WIDTH = 128;")
[void]$sb.AppendLine("const MAP_HEIGHT = 128;")
[void]$sb.AppendLine("const TILE_WIDTH = 64;")
[void]$sb.AppendLine("const TILE_HEIGHT = 32;")
[void]$sb.AppendLine("")
[void]$sb.AppendLine("const CITY_PROFILES_DATA = " + $cityJson + ";")
[void]$sb.AppendLine("")
[void]$sb.AppendLine("const TMX_LAYERS = {")

$layerKeys = @('01_Agua_Base', '02_Terreno_Relevo', '03_Recursos_Naturais', '04_Infraestrutura_Vias', '05_Edificios_Zonamento')
foreach ($k in $layerKeys) {
    [void]$sb.AppendLine("  '$k': [")
    $mat = $layersObj[$k]
    foreach ($row in $mat) {
        $rowStr = $row -join ','
        [void]$sb.AppendLine("    [$rowStr],")
    }
    [void]$sb.AppendLine("  ],")
}
[void]$sb.AppendLine("};")

[System.IO.File]::WriteAllText($outJsPath, $sb.ToString(), [System.Text.Encoding]::UTF8)
Write-Output "Successfully generated client/map_data.js!"
