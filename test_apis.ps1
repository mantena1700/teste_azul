$baseUrl = "http://localhost:4000/api"

function Test-Api ($method, $endpoint, $desc) {
    Write-Host -NoNewline "  $desc ... "
    try {
        $response = Invoke-WebRequest -Method $method -Uri "$baseUrl$endpoint" -UseBasicParsing -ErrorAction SilentlyContinue
        $code = $response.StatusCode.value__
        if ($code -ge 200 -and $code -lt 500) {
            Write-Host "✅ OK (HTTP $code)" -ForegroundColor Green
        } else {
            Write-Host "❌ FAIL (HTTP $code)" -ForegroundColor Red
        }
    } catch {
         if ($_.Exception.Response) {
            $code = $_.Exception.Response.StatusCode.value__
            Write-Host "❌ FAIL (HTTP $code)" -ForegroundColor Red
         } else {
            Write-Host "❌ CONNECTION ERROR" -ForegroundColor Red
         }
    }
}

Write-Host "🧪 TESTANDO TODAS AS APIs..."
Write-Host "1️⃣ HEALTH CHECK"
Test-Api "GET" "/health" "Health Check"

Write-Host "`n2️⃣ USERS (Check Therapists)"
Test-Api "GET" "/users?role=THERAPIST" "GET Terapeutas"
Test-Api "GET" "/users" "GET /users"

Write-Host "`n3️⃣ PATIENTS"
Test-Api "GET" "/patients" "GET /patients"

Write-Host "`n4️⃣ SESSIONS"
Test-Api "GET" "/sessions" "GET /sessions"

Write-Host "`n5️⃣ TIMELOGS"
Test-Api "GET" "/timelogs" "GET /timelogs"

Write-Host "`n6️⃣ MESSAGES"
Test-Api "GET" "/messages" "GET /messages"

Write-Host "`n7️⃣ FINANCIAL"
Test-Api "GET" "/financial/transactions" "GET /financial/transactions"
Test-Api "GET" "/financial/services" "GET /financial/services"

Write-Host "`n8️⃣ ACTIVITIES"
Test-Api "GET" "/activities" "GET /activities"

Write-Host "`n9️⃣ INVENTORY"
Test-Api "GET" "/inventory" "GET /inventory"

Write-Host "`n🔟 APPOINTMENTS"
Test-Api "GET" "/appointments" "GET /appointments"

Write-Host "`n✅ TESTE CONCLUÍDO!"
