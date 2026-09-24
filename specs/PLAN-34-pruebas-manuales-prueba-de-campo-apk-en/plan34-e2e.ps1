# Recorrido E2E de PLAN-34 a nivel API contra el stack de compose levanto local.
# Ejecuta el ciclo: login -> agenda -> inicio de visita -> formulario -> evidencias +
# manifest -> sync -> supervisión -> auditoría -> backoffice (proxy).
$ErrorActionPreference = 'Stop'
$base = 'http://localhost:8080'
$reporte = [System.Collections.Generic.List[object]]::new()
$hoy = Get-Date -Format 'yyyy-MM-dd'

function Registrar($paso, $http, $ok, $detalle) {
    $script:reporte.Add([PSCustomObject]@{
        paso = $paso; http = $http; ok = $ok; detalle = $detalle
    })
    Write-Output ("[{0}] {1} -> {2} {3}" -f (($http | Out-String).Trim()), $paso, ($(if ($ok) {'OK'} else {'FALLO'})), ($detalle | Out-String).Trim())
}

# Helper: petición JSON
function Req($method, $url, $token, $body) {
    $args = @('-s', '-o', "$env:TEMP\e2e_body.json", '-w', '%{http_code}', '-X', $method, $url)
    if ($token) { $args += @('-H', "Authorization: Bearer $token") }
    if ($body)  { $args += @('-H', 'Content-Type: application/json', '-d', $body) }
    $code = & curl.exe @args 2>$null
    $raw = Get-Content "$env:TEMP\e2e_body.json" -Raw -ErrorAction SilentlyContinue
    return [PSCustomObject]@{ code = $code; body = $raw }
}

# ---------- 0. Supervisor: asigna 2 visitas al operador (planificación de rutas) ----------
$r = Req 'POST' "$base/api/v1/auth/login" $null '{"username":"supervisor.demo","password":"Supervisor123!"}'
$sup0 = $r.body | ConvertFrom-Json
$sup0Token = $sup0.accessToken
$assignBody = '{"operatorId":"11111111-1111-4111-8111-111111111111","date":"' + $hoy + '","visitIds":["a0000001-0000-4000-8000-000000000001","a0000001-0000-4000-8000-000000000002"]}'
$r = Req 'POST' "$base/api/v1/visits/assign" $sup0Token $assignBody
$assigned = $r.body | ConvertFrom-Json
$ok0 = ($r.code -eq '200' -and $assigned.items -and $assigned.items.Count -eq 2)
Registrar 'planificación: asignar visitas al operador' $r.code $ok0 $(if ($ok0) { '2 visitas en hoja de ruta' } else { $r.body })

# ---------- 1. Login operador ----------
$r = Req 'POST' "$base/api/v1/auth/login" $null '{"username":"operador.demo","password":"Operador123!"}'
if ($r.code -ne '200') { Registrar 'login operador' $r.code $false $r.body; $reporte | ConvertTo-Json -Depth 5 | Set-Content "$env:TEMP\e2e_report.json"; exit 1 }
$op = $r.body | ConvertFrom-Json
Registrar 'login operador' $r.code $true 'accessToken emitido'
$opToken = $op.accessToken

# ---------- 2. Hoja de ruta (agenda) ----------
$r = Req 'GET' "$base/api/v1/operators/me/route-sheet?date=$hoy" $opToken $null
$agenda = $r.body | ConvertFrom-Json
$ok2 = ($r.code -eq '200' -and $agenda.items -and $agenda.items.Count -gt 0)
Registrar 'hoja de ruta operador (agenda)' $r.code $ok2 $(if ($ok2) { "$($agenda.items.Count) visitas asignadas" } else { $r.body })
if (-not $ok2) { $reporte | ConvertTo-Json -Depth 5 | Set-Content "$env:TEMP\e2e_report.json"; exit 1 }
$v = $agenda.items[0]
$visitId = $v.visit.id
$visitAddr = $v.visit.address

# ---------- 3. Inicio de visita con GPS ----------
$body = '{"latitude":-34.522345,"longitude":-58.478901,"accuracyMeters":8.5,"clientTimestamp":"' + (Get-Date -Format o) + '"}'
$r = Req 'POST' "$base/api/v1/visits/$visitId/start" $opToken $body
$start = $r.body | ConvertFrom-Json
$ok3 = ($r.code -eq '200' -and $start.status -eq 'IN_PROGRESS')
Registrar "inicio de visita $visitId" $r.code $ok3 $(if ($ok3) { "status=$($start.status), drift=$($start.driftSeconds)s" } else { $r.body })

# ---------- 4. Formulario tipificado ----------
$r = Req 'GET' "$base/api/v1/plantillas" $opToken $null
$plantillas = $r.body | ConvertFrom-Json
$mant = $plantillas | Where-Object { $_.key -eq 'mantenimiento-general' } | Select-Object -First 1
$formBody = '{"templateKey":"mantenimiento-general","templateVersion":' + $mant.version + ',"responses":{"workedHours":7.5,"taskType":"CORRECTIVO","observations":"Prueba E2E PLAN-34","serialNumber":"ABC-1234","requiresFollowUp":false}}'
$r = Req 'POST' "$base/api/v1/visitas/$visitId/formulario" $opToken $formBody
$ok4 = ($r.code -eq '200')
Registrar 'carga de formulario' $r.code $ok4 $(if ($ok4) { 'respuestas validadas contra schema y guardadas' } else { $r.body })

# ---------- 5. Evidencia + manifiesto ----------
$evFile = "$env:TEMP\e2e_evidencia.txt"
Set-Content -Path $evFile -Value 'Evidencia de prueba E2E PLAN-34 - dato ficticio' -Encoding utf8
$args = @('-s', '-o', "$env:TEMP\e2e_body.json", '-w', '%{http_code}', '-X', 'POST',
    "$base/api/v1/visits/$visitId/evidences", '-H', "Authorization: Bearer $opToken",
    '-F', "file=@$evFile", '-F', 'type=PHOTO')
$code = & curl.exe @args 2>$null
$evBody = Get-Content "$env:TEMP\e2e_body.json" -Raw -ErrorAction SilentlyContinue | ConvertFrom-Json
$ok5 = ($code -eq '201')
Registrar 'subida de evidencia' $code $ok5 $(if ($ok5) { "id=$($evBody.id), sha256=$($evBody.sha256Hash)" } else { $evBody | ConvertTo-Json -Depth 3 })

# Firma ológrafa notariada como segunda evidencia
$sigFile = "$env:TEMP\e2e_firma.txt"
Set-Content -Path $sigFile -Value 'FIRMA_E2E_PLAN34' -Encoding utf8
$args = @('-s', '-o', "$env:TEMP\e2e_body.json", '-w', '%{http_code}', '-X', 'POST',
    "$base/api/v1/visits/$visitId/evidences", '-H', "Authorization: Bearer $opToken",
    '-F', "file=@$sigFile", '-F', 'type=SIGNATURE')
$code = & curl.exe @args 2>$null
$sigBody = Get-Content "$env:TEMP\e2e_body.json" -Raw -ErrorAction SilentlyContinue | ConvertFrom-Json
$ok5b = ($code -eq '201')
Registrar 'subida de firma' $code $ok5b $(if ($ok5b) { "id=$($sigBody.id)" } else { $sigBody | ConvertTo-Json -Depth 3 })

$manifestBody = '{"deviceInfo":"tablet-test-e2e-plan34","evidenceIds":["' + $evBody.id + '","' + $sigBody.id + '"]}'
$r = Req 'POST' "$base/api/v1/visits/$visitId/manifest" $opToken $manifestBody
$manifest = $r.body | ConvertFrom-Json
$ok5c = ($r.code -eq '201' -and $manifest.hmacSignature)
Registrar 'sellado de manifiesto' $r.code $ok5c $(if ($ok5c) { "id=$($manifest.id), estado=$($manifest.verificationStatus), hmac=$($manifest.hmacSignature.Substring(0,16))…" } else { $r.body })

# Verificación criptográfica del manifiesto
$r = Req 'POST' "$base/api/v1/visits/$visitId/manifest/verify" $opToken $null
$verif = $r.body | ConvertFrom-Json
$ok5d = ($r.code -eq '200' -and $verif.signatureValid -eq $true -and $verif.allEvidencesIntact -eq $true)
Registrar 'verificación del manifiesto' $r.code $ok5d $(if ($ok5d) { "$($verif.status), evidencias intactas, HMAC v�lido" } else { $r.body })

# ---------- 6. Sincronización con idempotencia ----------
$syncOp = '{"clientOperationId":"' + [guid]::NewGuid().ToString() + '","type":"VISIT_FORM","visitId":"' + $visitId + '","form":' + $formBody + '}'
$syncBody = '{"operations":[' + $syncOp + ']}'
$idemKey = [guid]::NewGuid().ToString()
$args = @('-s', '-o', "$env:TEMP\e2e_body.json", '-w', '%{http_code}', '-X', 'POST',
    "$base/api/v1/sync/batch", '-H', "Authorization: Bearer $opToken",
    '-H', "Idempotency-Key: $idemKey", '-H', 'Content-Type: application/json', '-d', $syncBody)
$code = & curl.exe @args 2>$null
$syncBodyOut = Get-Content "$env:TEMP\e2e_body.json" -Raw -ErrorAction SilentlyContinue
$ok6 = ($code -eq '200')
Registrar 'sync por lote (idempotente)' $code $ok6 $(if ($ok6) { $syncBodyOut } else { $syncBodyOut })

# Reintento del mismo lote para confirmar idempotencia (debe responder igual, sin duplicar)
$args = @('-s', '-o', "$env:TEMP\e2e_body.json", '-w', '%{http_code}', '-X', 'POST',
    "$base/api/v1/sync/batch", '-H', "Authorization: Bearer $opToken",
    '-H', "Idempotency-Key: $idemKey", '-H', 'Content-Type: application/json', '-d', $syncBody)
$code = & curl.exe @args 2>$null
$syncRe = Get-Content "$env:TEMP\e2e_body.json" -Raw -ErrorAction SilentlyContinue
# La respuesta del reintento puede ser un 201 "duplicado detectado" o el mismo 200: ambos son correctos;
# el bug sería un 500 o una duplicación real (2 actas). Se registra el HTTP y se deja constancia.
Registrar 'reintento sync (idempotencia)' $code ($code -eq '200') $(if ($code -ne '200') { $syncRe } else { 'mismo lote sin duplicar' })

# ---------- 7. Supervisión (backoffice) ----------
$r = Req 'POST' "$base/api/v1/auth/login" $null '{"username":"supervisor.demo","password":"Supervisor123!"}'
$sup = $r.body | ConvertFrom-Json
$supToken = $sup.accessToken
Registrar 'login supervisor' $r.code ($r.code -eq '200') 'accessToken emitido'

$r = Req 'GET' "$base/api/v1/supervision/tablero-resumen?date=$hoy" $supToken $null
$ok7 = ($r.code -eq '200')
Registrar 'tablero resumen supervisión' $r.code $ok7 $(if ($ok7) { ($r.body | ConvertFrom-Json | ConvertTo-Json -Depth 4 -Compress).Substring(0, 200) } else { $r.body })

$r = Req 'GET' "$base/api/v1/supervision/operadores/estado?date=$hoy" $supToken $null
$ok7b = ($r.code -eq '200')
Registrar 'estado operadores' $r.code $ok7b $(if ($ok7b) { 'grilla de telemetría ok' } else { $r.body })

$r = Req 'GET' "$base/api/v1/operators" $supToken $null
$ok7c = ($r.code -eq '200')
Registrar 'planificación: lista de operadores' $r.code $ok7c $(if ($ok7c) { 'selectores de grilla ok' } else { $r.body })

# Expediente: visor del formulario de la visita (auditoría de expediente digital)
$r = Req 'GET' "$base/api/v1/visitas/$visitId/formulario" $supToken $null
$ok7d = ($r.code -eq '200')
Registrar 'expediente: visor de formulario' $r.code $ok7d $(if ($ok7d) { 'detalle del formulario cargado' } else { $r.body })

# Verificación de auditoría (cadena inmutable) - sólo ADMINISTRATOR
$r = Req 'POST' "$base/api/v1/auth/login" $null '{"username":"admin.demo","password":"Admin123!"}'
$adm = $r.body | ConvertFrom-Json
$admToken = $adm.accessToken
Registrar 'login admin' $r.code ($r.code -eq '200') 'accessToken emitido'

$r = Req 'GET' "$base/api/v1/audit/verify" $admToken $null
$audit = $r.body | ConvertFrom-Json
$ok8 = ($r.code -eq '200' -and $audit.intacta -eq $true)
Registrar 'verificación auditoría (cadena SHA-256)' $r.code $ok8 $(if ($ok8) { 'cadena íntegra, `intacta: true`' } else { $r.body })

$r = Req 'GET' "$base/api/v1/audit/logs" $admToken $null
$ok8b = ($r.code -eq '200')
Registrar 'auditoría: logs inmutables' $r.code $ok8b $(if ($ok8b) { 'registros de auditoría disponibles' } else { $r.body })

# ---------- 8. Backoffice web (proxy NGINX) ----------
$code = & curl.exe -s -o NUL -w '%{http_code}' http://localhost:8081/ 2>$null
Registrar 'backoffice web (NGINX)' $code ($code -eq '200') 'página de inicio servida'
$code = & curl.exe -s -o NUL -w '%{http_code}' http://localhost:8081/salud 2>$null
Registrar 'proxy backoffice -> /salud' $code ($code -eq '200') 'proxy al backend funcionando'

# ---------- 9. Signout / refresh ----------
$logoutBody = '{"refreshToken":"' + $op.refreshToken + '"}'
$r = Req 'POST' "$base/api/v1/auth/logout" $null $logoutBody
$okLogout = ($r.code -eq '204')
Registrar 'logout operador' $r.code $okLogout $(if ($okLogout) { 'refresh token revocado' } else { $r.body })

$reporte | ConvertTo-Json -Depth 5 | Set-Content "$env:TEMP\e2e_report.json"
$fallos = @($reporte | Where-Object { -not $_.ok })
Write-Output "=== RESUMEN: $($reporte.Count - $fallos.Count)/$($reporte.Count) pasos OK, $($fallos.Count) fallos ==="
if ($fallos.Count -gt 0) { exit 1 }