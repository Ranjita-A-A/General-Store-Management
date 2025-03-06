Write-Host "Setting Node options and starting frontend..."
$env:SET_NODE_OPTIONS="--openssl-legacy-provider"
$env:NODE_OPTIONS="--openssl-legacy-provider"
npm start
