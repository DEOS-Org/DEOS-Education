#!/bin/zsh
# test_api.sh - Pruebas automatizadas para el backend BioFirma

# Endpoint base (Caddy HTTPS local)
API_URL="https://localhost/api"

# Usuario de prueba (alumno)
EMAIL="fp.gonzalez@alumno.etec.um.edu.ar"
PASSWORD="12345"

# Archivo temporal para guardar el token
TOKEN_FILE=".jwt_token"

# Login y guardar el token
login() {
  echo "\n===> Probando login de usuario: $EMAIL"
  RESPONSE=$(curl -sk -X POST "$API_URL/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"'$EMAIL'","password":"'$PASSWORD'"}')
  echo "$RESPONSE"
  TOKEN=$(echo "$RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
  if [[ -n "$TOKEN" ]]; then
    echo "$TOKEN" > $TOKEN_FILE
    echo "\nToken guardado en $TOKEN_FILE"
  else
    echo "\nNo se pudo obtener el token."
  fi
}

# Ejecutar login
login

# Para agregar más pruebas, puedes usar:
# TOKEN=$(cat $TOKEN_FILE)
# curl -sk -H "Authorization: Bearer $TOKEN" ...
