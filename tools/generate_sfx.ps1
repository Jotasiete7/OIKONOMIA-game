# tools/generate_sfx.ps1
# Sintetizador nativo .NET/PowerShell de áudio PCM 16-bit 44.1kHz para OIKONOMIA

$sampleRate = 44100

function Save-Wav {
    param(
        [string]$Path,
        [float[]]$Samples
    )
    $dir = Split-Path -Parent $Path
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }

    $dataSize = $Samples.Length * 2
    $stream = New-Object System.IO.FileStream($Path, [System.IO.FileMode]::Create)
    $writer = New-Object System.IO.BinaryWriter($stream)

    # RIFF Chunk
    $writer.Write([System.Text.Encoding]::ASCII.GetBytes("RIFF"))
    $writer.Write([uint32](36 + $dataSize))
    $writer.Write([System.Text.Encoding]::ASCII.GetBytes("WAVE"))

    # fmt Chunk
    $writer.Write([System.Text.Encoding]::ASCII.GetBytes("fmt "))
    $writer.Write([uint32]16)
    $writer.Write([uint16]1)    # PCM
    $writer.Write([uint16]1)    # Mono
    $writer.Write([uint32]$sampleRate)
    $writer.Write([uint32]($sampleRate * 2)) # ByteRate
    $writer.Write([uint16]2)    # BlockAlign
    $writer.Write([uint16]16)   # BitsPerSample

    # data Chunk
    $writer.Write([System.Text.Encoding]::ASCII.GetBytes("data"))
    $writer.Write([uint32]$dataSize)

    foreach ($s in $Samples) {
        $val = [Math]::Max(-1.0, [Math]::Min(1.0, $s))
        $intVal = if ($val -lt 0) { [int16]($val * 32768) } else { [int16]($val * 32767) }
        $writer.Write([int16]$intVal)
    }

    $writer.Close()
    $stream.Close()
    Write-Output "[OK] Gerado: $Path ($([Math]::Round($dataSize / 1024, 1)) KB)"
}

# 1. modal_open.wav (0.16s)
$dur = 0.16
$total = [int]($sampleRate * $dur)
$samples = New-Object float[] $total
for ($i = 0; $i -lt $total; $i++) {
    $t = $i / $total
    $env = [Math]::Sin($t * [Math]::PI)
    $freq = 320.0 + [Math]::Pow($t, 1.8) * 580.0
    $phase = 2.0 * [Math]::PI * $freq * ($i / $sampleRate)
    $wave = [Math]::Sin($phase) * 0.7 + [Math]::Sin(2.0 * $phase) * 0.2 + [Math]::Sin(3.0 * $phase) * 0.1
    $samples[$i] = [float]($wave * $env * 0.75)
}
Save-Wav -Path "client/assets/audio/sfx/ui/modal_open.wav" -Samples $samples

# 2. stamp_contract.wav (0.24s)
$dur = 0.24
$total = [int]($sampleRate * $dur)
$samples = New-Object float[] $total
$rnd = New-Object System.Random
for ($i = 0; $i -lt $total; $i++) {
    $t = $i / $sampleRate
    $lowFreq = 160.0 * [Math]::Exp(-$t * 30.0) + 55.0
    $thud = [Math]::Sin(2.0 * [Math]::PI * $lowFreq * $t) * [Math]::Exp(-$t * 22.0)
    $noise = ($rnd.NextDouble() * 2.0 - 1.0) * [Math]::Exp(-$t * 45.0) * 0.5
    $body = [Math]::Sin(2.0 * [Math]::PI * 110.0 * $t) * [Math]::Exp(-$t * 15.0) * 0.35
    $samples[$i] = [float](($thud * 0.65 + $noise + $body) * 0.9)
}
Save-Wav -Path "client/assets/audio/sfx/ui/stamp_contract.wav" -Samples $samples

# 3. coin_clink.wav (0.28s)
$dur = 0.28
$total = [int]($sampleRate * $dur)
$samples = New-Object float[] $total
$f1 = 2800.0; $f2 = 3450.0; $f3 = 4920.0
for ($i = 0; $i -lt $total; $i++) {
    $t1 = $i / $sampleRate
    $env1 = [Math]::Exp(-$t1 * 26.0)
    $s = ([Math]::Sin(2.0 * [Math]::PI * $f1 * $t1) * 0.5 +
          [Math]::Sin(2.0 * [Math]::PI * $f2 * $t1) * 0.35 +
          [Math]::Sin(2.0 * [Math]::PI * $f3 * $t1) * 0.15) * $env1

    $t2 = ($i - $sampleRate * 0.045) / $sampleRate
    if ($t2 -gt 0) {
        $env2 = [Math]::Exp(-$t2 * 22.0)
        $s += ([Math]::Sin(2.0 * [Math]::PI * ($f1 * 1.12) * $t2) * 0.45 +
               [Math]::Sin(2.0 * [Math]::PI * ($f2 * 1.08) * $t2) * 0.3 +
               [Math]::Sin(2.0 * [Math]::PI * ($f3 * 1.05) * $t2) * 0.2) * $env2
    }
    $samples[$i] = [float]($s * 0.65)
}
Save-Wav -Path "client/assets/audio/sfx/economy/coin_clink.wav" -Samples $samples

# 4. loan_payout.wav (0.55s)
$dur = 0.55
$total = [int]($sampleRate * $dur)
$samples = New-Object float[] $total
$notes = @(523.25, 659.25, 783.99, 987.77, 1046.50)
$delay = 0.07
for ($i = 0; $i -lt $total; $i++) {
    $sum = 0.0
    for ($n = 0; $n -lt $notes.Count; $n++) {
        $t = ($i - $sampleRate * ($n * $delay)) / $sampleRate
        if ($t -gt 0) {
            $freq = $notes[$n]
            $decay = if ($n -eq $notes.Count - 1) { 6.0 } else { 9.0 }
            $env = [Math]::Exp(-$t * $decay)
            $wave = [Math]::Sin(2.0 * [Math]::PI * $freq * $t) * 0.7 +
                    [Math]::Sin(4.0 * [Math]::PI * $freq * $t) * 0.2 +
                    [Math]::Sin(6.0 * [Math]::PI * $freq * $t) * 0.1
            $sum += $wave * $env * 0.28
        }
    }
    $samples[$i] = [float]($sum * 0.9)
}
Save-Wav -Path "client/assets/audio/sfx/economy/loan_payout.wav" -Samples $samples

# 5. demolish.wav (0.42s)
$dur = 0.42
$total = [int]($sampleRate * $dur)
$samples = New-Object float[] $total
for ($i = 0; $i -lt $total; $i++) {
    $t = $i / $sampleRate
    $lowFreq = 95.0 * [Math]::Exp(-$t * 12.0) + 35.0
    $rumble = [Math]::Sin(2.0 * [Math]::PI * $lowFreq * $t) * [Math]::Exp(-$t * 9.0)
    $noise = ($rnd.NextDouble() * 2.0 - 1.0) * [Math]::Exp(-$t * 11.0) * (0.8 + 0.2 * [Math]::Sin(2.0 * [Math]::PI * 18.0 * $t))
    $crackle = if ($rnd.NextDouble() -lt 0.08) { ($rnd.NextDouble() * 2.0 - 1.0) * [Math]::Exp(-$t * 6.0) * 0.6 } else { 0.0 }
    $samples[$i] = [float](($rumble * 0.55 + $noise * 0.35 + $crackle * 0.2) * 0.85)
}
Save-Wav -Path "client/assets/audio/sfx/building/demolish.wav" -Samples $samples

# 6. upgrade.wav (0.38s)
$dur = 0.38
$total = [int]($sampleRate * $dur)
$samples = New-Object float[] $total
$ufreqs = @(739.99, 932.33, 1108.73, 1479.98)
$udelay = 0.055
for ($i = 0; $i -lt $total; $i++) {
    $sum = 0.0
    for ($f = 0; $f -lt $ufreqs.Count; $f++) {
        $t = ($i - $sampleRate * ($f * $udelay)) / $sampleRate
        if ($t -gt 0) {
            $env = [Math]::Exp(-$t * 8.0)
            $wave = [Math]::Sin(2.0 * [Math]::PI * $ufreqs[$f] * $t) * 0.7 +
                    [Math]::Sin(4.0 * [Math]::PI * $ufreqs[$f] * $t) * 0.2 +
                    [Math]::Sin(6.0 * [Math]::PI * $ufreqs[$f] * $t) * 0.1
            $sum += $wave * $env * 0.3
        }
    }
    $samples[$i] = [float]($sum * 0.85)
}
Save-Wav -Path "client/assets/audio/sfx/building/upgrade.wav" -Samples $samples

# 7. warning_alert.wav (0.32s)
$dur = 0.32
$total = [int]($sampleRate * $dur)
$samples = New-Object float[] $total
$wfreq = 480.0
for ($i = 0; $i -lt $total; $i++) {
    $t = $i / $sampleRate
    $s = 0.0
    if ($t -lt 0.12) {
        $env = [Math]::Sin(($t / 0.12) * [Math]::PI)
        $s = ([Math]::Sin(2.0 * [Math]::PI * $wfreq * $t) * 0.6 +
              [Math]::Sin(4.0 * [Math]::PI * $wfreq * $t) * 0.25 +
              [Math]::Sin(6.0 * [Math]::PI * $wfreq * $t) * 0.15) * $env
    } elseif ($t -ge 0.16 -and $t -lt 0.28) {
        $p2 = $t - 0.16
        $env = [Math]::Sin(($p2 / 0.12) * [Math]::PI)
        $s = ([Math]::Sin(2.0 * [Math]::PI * ($wfreq * 1.15) * $p2) * 0.6 +
              [Math]::Sin(4.0 * [Math]::PI * ($wfreq * 1.15) * $p2) * 0.25 +
              [Math]::Sin(6.0 * [Math]::PI * ($wfreq * 1.15) * $p2) * 0.15) * $env
    }
    $samples[$i] = [float]($s * 0.8)
}
Save-Wav -Path "client/assets/audio/sfx/events/warning_alert.wav" -Samples $samples

# 8. news_flash.wav (0.22s)
$dur = 0.22
$total = [int]($sampleRate * $dur)
$samples = New-Object float[] $total
$pulses = @(0.0, 0.04, 0.08, 0.13, 0.17)
$nfreqs = @(880.0, 1108.0, 987.0, 1318.0, 1760.0)
for ($i = 0; $i -lt $total; $i++) {
    $t = $i / $sampleRate
    $s = 0.0
    for ($p = 0; $p -lt $pulses.Count; $p++) {
        $dt = $t - $pulses[$p]
        if ($dt -ge 0 -and $dt -lt 0.03) {
            $env = [Math]::Sin(($dt / 0.03) * [Math]::PI)
            $s += [Math]::Sin(2.0 * [Math]::PI * $nfreqs[$p] * $dt) * $env * 0.35
        }
    }
    $samples[$i] = [float]($s * 0.85)
}
Save-Wav -Path "client/assets/audio/sfx/events/news_flash.wav" -Samples $samples

Write-Output "Todos os 8 arquivos WAV foram gerados com sucesso!"
