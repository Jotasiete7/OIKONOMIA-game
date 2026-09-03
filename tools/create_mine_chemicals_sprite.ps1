# tools/create_mine_chemicals_sprite.ps1
Add-Type -AssemblyName System.Drawing

$ironImg = [System.Drawing.Bitmap]::FromFile("d:\OIKONOMIA PROJETO\client\assets\minas\mine_iron.png")
$mw = $ironImg.Width
$mh = $ironImg.Height
$ironImg.Dispose()

$chemBmp = New-Object System.Drawing.Bitmap($mw, $mh, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($chemBmp)
$g.Clear([System.Drawing.Color]::Transparent)

# Tanques cilíndricos e tubulações industriais para extração química
$tankBrush1 = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 14, 165, 233))
$tankBrush2 = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 56, 189, 248))
$metalBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 71, 85, 105))
$penPipe = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 148, 163, 184), 2)
$saltBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 226, 232, 240))

# Base de concreto
$g.FillRectangle($metalBrush, [int]($mw * 0.15), [int]($mh * 0.45), [int]($mw * 0.7), [int]($mh * 0.4))

# 2 Tanques cilíndricos verticais
$g.FillEllipse($tankBrush1, [int]($mw * 0.2), [int]($mh * 0.25), [int]($mw * 0.25), [int]($mh * 0.5))
$g.FillEllipse($tankBrush2, [int]($mw * 0.55), [int]($mh * 0.2), [int]($mw * 0.25), [int]($mh * 0.55))

# Tubulações conectando os tanques
$g.DrawLine($penPipe, [int]($mw * 0.32), [int]($mh * 0.3), [int]($mw * 0.67), [int]($mh * 0.3))
$g.DrawLine($penPipe, [int]($mw * 0.32), [int]($mh * 0.45), [int]($mw * 0.67), [int]($mh * 0.45))

# Depósito de sais claros na base
$g.FillEllipse($saltBrush, [int]($mw * 0.1), [int]($mh * 0.65), [int]($mw * 0.3), [int]($mh * 0.25))

$g.Dispose()
$chemPath = "d:\OIKONOMIA PROJETO\client\assets\minas\mine_chemicals.png"
$chemBmp.Save($chemPath, [System.Drawing.Imaging.ImageFormat]::Png)
$chemBmp.Dispose()
Write-Host "Created: $chemPath"
