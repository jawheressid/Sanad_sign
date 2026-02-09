$baseUrl = "http://localhost:8000"
$youtubeUrl = "https://www.youtube.com/watch?v=Q8SnKgo0UwI"

Write-Host "`n===========================================================" -ForegroundColor Cyan
Write-Host "  TEST DE LA PARTIE YOUTUBE - CONVERSION EN LANGUE DES SIGNES" -ForegroundColor Cyan
Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host "URL YouTube: $youtubeUrl" -ForegroundColor Yellow
Write-Host ""

# Vérifier que le serveur est accessible
try {
    Write-Host "[LOG] Vérification de l'état du serveur..." -ForegroundColor Blue
    $health = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get
    Write-Host "[OK] Serveur backend accessible!" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "[ERREUR] Serveur non accessible: $_" -ForegroundColor Red
    exit 1
}

# Créer le job
Write-Host "[LOG] Création du job de conversion depuis YouTube..." -ForegroundColor Blue
$body = @{
    mode = "youtube"
    youtube_url = $youtubeUrl
    prefer_captions = $true
    caption_language = "en"
    max_duration_sec = 1200
    spoken_language = "en"
    signed_language = "ase"
    glosser = "simple"
    avatar_type = "skeleton"
}

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/jobs" -Method Post -Body $body -ContentType "application/x-www-form-urlencoded"
    $jobId = $response.id
    Write-Host "[OK] Job créé avec ID: $jobId" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "[ERREUR] Échec de la création du job: $_" -ForegroundColor Red
    Write-Host "Détails: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    exit 1
}

# Surveiller la progression
Write-Host "[LOG] Surveillance de la progression du job..." -ForegroundColor Blue
Write-Host ""

$maxAttempts = 120
$attempt = 0
$lastProgress = -1
$previousSteps = @()

while ($attempt -lt $maxAttempts) {
    Start-Sleep -Seconds 2
    $attempt++
    
    try {
        $job = Invoke-RestMethod -Uri "$baseUrl/jobs/$jobId" -Method Get
        
        # Afficher la progression si elle a changé
        if ($job.progress -ne $lastProgress) {
            Write-Host "[PROGRESSION] $($job.progress)% - Status: $($job.status)" -ForegroundColor Cyan
            $lastProgress = $job.progress
        }
        
        # Afficher les étapes
        foreach ($step in $job.steps) {
            $stepKey = "$($step.id):$($step.status)"
            if ($stepKey -notin $previousSteps) {
                $previousSteps += $stepKey
                
                $color = switch ($step.status) {
                    "done" { "Green" }
                    "running" { "Yellow" }
                    "error" { "Red" }
                    "skipped" { "Gray" }
                    default { "White" }
                }
                
                $statusText = switch ($step.status) {
                    "done" { "[OK] TERMINE" }
                    "running" { "[>>] EN COURS" }
                    "error" { "[XX] ERREUR" }
                    "skipped" { "[--] IGNORE" }
                    default { "[  ] EN ATTENTE" }
                }
                
                $timestamp = if ($step.ts) { " [$($step.ts)]" } else { "" }
                Write-Host "  [$statusText]$timestamp $($step.label)" -ForegroundColor $color
            }
        }
        
        # Vérifier si terminé
        if ($job.status -eq "completed") {
            Write-Host ""
            Write-Host "===========================================================" -ForegroundColor Green
            Write-Host "  CONVERSION TERMINÉE AVEC SUCCÈS!" -ForegroundColor Green
            Write-Host "===========================================================" -ForegroundColor Green
            Write-Host ""
            Write-Host "Résultats:" -ForegroundColor Yellow
            Write-Host "  - Texte transcrit: $($job.result.text)" -ForegroundColor White
            Write-Host "  - Glosses: $($job.result.gloss)" -ForegroundColor White
            Write-Host "  - Fichier pose: $baseUrl$($job.result.files.pose)" -ForegroundColor Cyan
            Write-Host "  - Vidéo: $baseUrl$($job.result.files.video)" -ForegroundColor Cyan
            Write-Host ""
            Write-Host "Vous pouvez visualiser la vidéo à: http://localhost:8000$($job.result.files.video)" -ForegroundColor Magenta
            Write-Host ""
            exit 0
        }
        
        if ($job.status -eq "failed") {
            Write-Host ""
            Write-Host "===========================================================" -ForegroundColor Red
            Write-Host "  ÉCHEC DE LA CONVERSION" -ForegroundColor Red
            Write-Host "===========================================================" -ForegroundColor Red
            Write-Host "Erreur: $($job.error)" -ForegroundColor Red
            Write-Host ""
            exit 1
        }
        
    } catch {
        Write-Host "[ERREUR] Impossible de récupérer l'état du job: $_" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "[TIMEOUT] Le traitement prend trop de temps (dépassement de $maxAttempts tentatives)" -ForegroundColor Red
