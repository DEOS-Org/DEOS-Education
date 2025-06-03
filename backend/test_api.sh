#!/bin/zsh
# test_api.sh - Pruebas automatizadas para el backend BioFirma

# Endpoint base (Caddy HTTPS local)
API_URL="https://localhost/api"

# Credenciales de prueba
ADMIN_EMAIL="fp.gonzalez@alumno.etec.um.edu.ar"
ADMIN_PASSWORD="12345"
TEST_EMAIL="test.user@alumno.etec.um.edu.ar"
TEST_PASSWORD="test123"

# Archivo temporal para guardar el token y el ID del usuario de prueba
TOKEN_FILE=".jwt_token"
TEST_USER_ID_FILE=".test_user_id"

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Login y guardar el token
login() {
  local email=$1
  local password=$2
  echo "\n===> Probando login de usuario: $email"
  RESPONSE=$(curl -sk -X POST "$API_URL/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"'$email'","password":"'$password'"}')
  echo "$RESPONSE"
  
  # Extraer y guardar el token
  TOKEN=$(echo "$RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
  if [[ -n "$TOKEN" ]]; then
    echo "$TOKEN" > $TOKEN_FILE
    echo "${GREEN}\nToken guardado en $TOKEN_FILE${NC}"
    
    # Si es el usuario de prueba, extraer y guardar su ID
    if [[ "$email" == "$TEST_EMAIL" ]]; then
      USER_ID=$(echo "$RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
      if [[ -n "$USER_ID" ]]; then
        echo "$USER_ID" > $TEST_USER_ID_FILE
        echo "${GREEN}ID del usuario de prueba guardado: $USER_ID${NC}"
      fi
    fi
  else
    echo "${RED}\nNo se pudo obtener el token.${NC}"
    exit 1
  fi
}

# Función para hacer requests con el token
make_request() {
  local method=$1
  local endpoint=$2
  local data=$3
  local token=$(cat $TOKEN_FILE)
  
  if [[ -n "$data" ]]; then
    curl -sk -X "$method" "$API_URL$endpoint" \
      -H "Authorization: Bearer $token" \
      -H "Content-Type: application/json" \
      -d "$data"
  else
    curl -sk -X "$method" "$API_URL$endpoint" \
      -H "Authorization: Bearer $token"
  fi
  echo "\n"
}

# Pruebas de API
echo "\n=== Iniciando pruebas de API ==="

# 1. Login como admin
echo "\n1. Login como administrador"
login $ADMIN_EMAIL $ADMIN_PASSWORD

# 2. Crear usuario de prueba
echo "\n2. Crear nuevo usuario"
make_request "POST" "/usuarios" '{
  "dni": "12345678",
  "nombre": "Test",
  "apellido": "User",
  "email": "'$TEST_EMAIL'",
  "contraseña": "'$TEST_PASSWORD'",
  "roles": ["alumno"]
}'

# 3. Listar usuarios
echo "\n3. Listar todos los usuarios"
make_request "GET" "/usuarios"

# 4. Obtener usuario por ID
USER_ID=$(cat $TEST_USER_ID_FILE 2>/dev/null || echo "53")
echo "\n4. Obtener detalles del usuario con ID $USER_ID"
make_request "GET" "/usuarios/$USER_ID"

# 5. Login como usuario de prueba
echo "\n5. Login como usuario de prueba"
login $TEST_EMAIL $TEST_PASSWORD

# 6. Intentar acceder a lista de usuarios (debería fallar)
echo "\n6. Intentar listar usuarios sin permisos"
make_request "GET" "/usuarios"

# 7. Login de nuevo como admin
echo "\n7. Login de nuevo como admin"
login $ADMIN_EMAIL $ADMIN_PASSWORD

# 8. Asignar rol de profesor al usuario de prueba
USER_ID=$(cat $TEST_USER_ID_FILE 2>/dev/null || echo "53")
echo "\n8. Asignar rol de profesor al usuario con ID $USER_ID"
make_request "POST" "/usuarios/$USER_ID/roles" '{
  "roles": ["alumno", "profesor"]
}'

# 9. Actualizar usuario
echo "\n9. Actualizar datos del usuario con ID $USER_ID"
make_request "PUT" "/usuarios/$USER_ID" '{
  "nombre": "Test Updated",
  "apellido": "User Updated"
}'

# 10. Desactivar usuario (en lugar de borrar físico)
echo "\n10. Desactivar usuario de prueba con ID $USER_ID"
make_request "PATCH" "/usuarios/$USER_ID/deactivate"

echo "\n=== Fin de las pruebas ==="

# Limpiar archivos temporales
rm -f $TOKEN_FILE $TEST_USER_ID_FILE
