# ─── Config — edit these ─────────────────────────────────────────────────────
BASE_URL="http://localhost:3008"  
TEST_EMAIL="findseunoyewole@example.com"
TEST_PASSWORD="Seun2023@"

# ─── Colour helpers ──────────────────────────────────────────────────────────
GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

pass()    { echo -e "${GREEN}[PASS]${NC} $*"; }
fail()    { echo -e "${RED}[FAIL]${NC} $*"; }
info()    { echo -e "${CYAN}[INFO]${NC} $*"; }
section() { echo -e "\n${BOLD}${YELLOW}▶ $*${NC}\n"; }

# ─── Stored tokens (populated during test run) ───────────────────────────────
ACCESS_TOKEN=""
REFRESH_TOKEN=""

# ─── Helper: make request and print result ───────────────────────────────────
# Usage: call METHOD /endpoint '{"json":"body"}' expected_http_code
call() {
  local METHOD=$1
  local ENDPOINT=$2
  local BODY=${3:-""}
  local EXPECTED=${4:-200}
  local LABEL=${5:-"$METHOD $ENDPOINT"}
  local CURL_EXIT=0

  # Build auth header if token is available
  local AUTH_HEADER=""
  [[ -n "$ACCESS_TOKEN" ]] && AUTH_HEADER="-H \"Authorization: Bearer $ACCESS_TOKEN\""

  # Execute request
  if [[ -n "$BODY" ]]; then
    RESPONSE=$(curl -sS --connect-timeout 5 --max-time 30 -w "\n%{http_code}" -X "$METHOD" "$BASE_URL$ENDPOINT" \
      -H "Content-Type: application/json" \
      ${ACCESS_TOKEN:+-H "Authorization: Bearer $ACCESS_TOKEN"} \
      -d "$BODY")
    CURL_EXIT=$?
  else
    RESPONSE=$(curl -sS --connect-timeout 5 --max-time 30 -w "\n%{http_code}" -X "$METHOD" "$BASE_URL$ENDPOINT" \
      ${ACCESS_TOKEN:+-H "Authorization: Bearer $ACCESS_TOKEN"})
    CURL_EXIT=$?
  fi

  if [[ $CURL_EXIT -ne 0 ]]; then
    echo -e "  ${CYAN}→ $METHOD $ENDPOINT${NC}" >&2
    echo -e "  Status : CURL_ERROR ($CURL_EXIT)" >&2
    echo -e "" >&2
    fail "$LABEL — curl transport error (service down, wrong port, or timeout)" >&2
    echo ""
    return $CURL_EXIT
  fi

  # Split body and status code
  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY_RESPONSE=$(echo "$RESPONSE" | sed '$d')

  # Pretty print
  echo -e "  ${CYAN}→ $METHOD $ENDPOINT${NC}" >&2
  echo -e "  Status : $HTTP_CODE" >&2
  if [[ -n "$BODY_RESPONSE" ]]; then
    echo -e "  Body   : $(echo "$BODY_RESPONSE" | head -c 300)" >&2
  else
    echo -e "  Body   : <empty>" >&2
  fi
  echo "" >&2

  # Pass/fail
  if [[ "$HTTP_CODE" == "$EXPECTED" ]]; then
    pass "$LABEL" >&2
  else
    fail "$LABEL — expected $EXPECTED, got $HTTP_CODE" >&2
  fi

  # Return body for token extraction
  echo "$BODY_RESPONSE"
}

# =============================================================================
#  TESTS
# =============================================================================

section "1. Health Check"

call GET /api/v1 "" 200 "Health endpoint"


section "2. Register"

REGISTER_RESPONSE=$(call POST /api/v1/auth/register \
  "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}" \
  201 "Register new user")


section "3. Login"

LOGIN_RESPONSE=$(call POST /api/v1/auth/login \
  "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}" \
  200 "Login with valid credentials")

# Extract tokens from login response
ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
REFRESH_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"refreshToken":"[^"]*"' | cut -d'"' -f4)

if [[ -n "$ACCESS_TOKEN" ]]; then
  info "Access token captured: ${ACCESS_TOKEN:0:30}..."
else
  fail "Could not extract access token — check your login response field names"
fi


# section "4. Protected Route — Get Profile"

# call GET /auth/profile "" 200 "Get profile (authenticated)"


# section "5. Login with wrong password"

# call POST /auth/login \
#   "{\"email\":\"$TEST_EMAIL\",\"password\":\"wrongpassword\"}" \
#   401 "Login with wrong password (expect 401)"


# section "6. Login with non-existent user"

# call POST /auth/login \
#   "{\"email\":\"ghost@example.com\",\"password\":\"$TEST_PASSWORD\"}" \
#   401 "Login with unknown email (expect 401)"


# section "7. Register duplicate email"

# call POST /auth/register \
#   "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}" \
#   409 "Duplicate registration (expect 409)"


# section "8. Access protected route without token"

# # Temporarily clear token
# SAVED_TOKEN="$ACCESS_TOKEN"
# ACCESS_TOKEN=""

# call GET /auth/profile "" 401 "No token → expect 401"

# Restore token
# ACCESS_TOKEN="$SAVED_TOKEN"


# section "9. Access protected route with fake token"

# SAVED_TOKEN="$ACCESS_TOKEN"
# ACCESS_TOKEN="fake.invalid.token"

# call GET /auth/profile "" 401 "Fake token → expect 401"

# ACCESS_TOKEN="$SAVED_TOKEN"


# section "10. Refresh Token"

# if [[ -n "$REFRESH_TOKEN" ]]; then
#   REFRESH_RESPONSE=$(call POST /auth/refresh \
#     "{\"refreshToken\":\"$REFRESH_TOKEN\"}" \
#     200 "Refresh access token")

#   NEW_ACCESS_TOKEN=$(echo "$REFRESH_RESPONSE" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
#   [[ -n "$NEW_ACCESS_TOKEN" ]] && ACCESS_TOKEN="$NEW_ACCESS_TOKEN" \
#     && info "New access token captured: ${ACCESS_TOKEN:0:30}..."
# else
#   info "Skipping refresh test — no refresh token was captured from login"
# fi


# section "11. Logout"

# call POST /auth/logout "" 200 "Logout"


# =============================================================================
#  SUMMARY
# =============================================================================

echo -e "\n${BOLD}${YELLOW}════════════════════════════════════${NC}"
echo -e "${BOLD}  Test run complete${NC}"
echo -e "${BOLD}${YELLOW}════════════════════════════════════${NC}"
echo -e "  Base URL : $BASE_URL"
echo -e "  Email    : $TEST_EMAIL"
echo -e ""
echo -e ""