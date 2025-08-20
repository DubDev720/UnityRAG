$BASE = $env:BASE
if (-not $BASE) { $BASE = "http://127.0.0.1:8000" }

Write-Host "== GET /health"
Invoke-RestMethod -Uri "$BASE/health" -Method Get | ConvertTo-Json -Depth 6

Write-Host "== GET /versions"
Invoke-RestMethod -Uri "$BASE/versions" -Method Get | ConvertTo-Json -Depth 6

Write-Host "== GET /search?q=Rigidbody.AddForce&top_k=3"
Invoke-RestMethod -Uri "$BASE/search?q=Rigidbody.AddForce&top_k=3" -Method Get | ConvertTo-Json -Depth 6

Write-Host "== POST /set_index_dir (edit path)"
$idx = $env:IDX_DIR
if (-not $idx) { $idx = "C:\\Path\\To\\Your\\index" }
Invoke-RestMethod -Uri "$BASE/set_index_dir" -Method Post -ContentType "application/json" -Body (@{ index_dir = $idx } | ConvertTo-Json) | ConvertTo-Json -Depth 6
