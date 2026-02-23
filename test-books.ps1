$response = Invoke-WebRequest -Uri "http://localhost:3000/books" -Method GET -UseBasicParsing
Write-Host "Status Code: $($response.StatusCode)"
Write-Host "Content Length: $($response.Content.Length)"
Write-Host "Content:"
Write-Host $response.Content
