#!/usr/bin/env bash
# Registers a (simulated) fingerprint device on a FitOps deployment and links
# members to biometric IDs, ready for `npm run scanner`.
#
#   bash src/scripts/register-device.sh [device-name] [serial]
#
# Prompts for the admin password rather than taking it as an argument, so it
# never lands in shell history. The device key is saved to
# ~/.config/fitops/device-key (mode 600). Re-running with the same serial
# rotates that device's key instead of failing.
set -euo pipefail

API_URL="${API_URL:-https://fit-ops-two.vercel.app}"
API_URL="${API_URL%/}"
NAME="${1:-Front desk (simulated)}"
SERIAL="${2:-SIM-001}"
KEY_FILE="$HOME/.config/fitops/device-key"

json() { node -e 'const j=JSON.parse(require("fs").readFileSync(0,"utf8"));const v=eval("j"+process.argv[1]);console.log(typeof v==="string"?v:JSON.stringify(v))' "$1"; }

# Prints the body; fails with the server's message on a non-2xx status.
api() {
  local method=$1 path=$2 body=${3:-}
  local out status
  out=$(curl -sS -X "$method" "$API_URL/api$path" \
    -H "authorization: Bearer ${TOKEN:-}" -H 'content-type: application/json' \
    ${body:+-d "$body"} -w $'\n%{http_code}')
  status=${out##*$'\n'}
  out=${out%$'\n'*}
  if [[ $status != 2* ]]; then
    echo "$method $path -> $status $out" >&2
    return 1
  fi
  printf '%s' "$out"
}

echo "FitOps at $API_URL"
read -rp "Admin email [admin@fitops.lk]: " EMAIL
EMAIL=${EMAIL:-admin@fitops.lk}
read -rsp "Password: " PASSWORD
echo

LOGIN=$(api POST /auth/login "$(EMAIL=$EMAIL PASSWORD=$PASSWORD node -pe 'JSON.stringify({email:process.env.EMAIL,password:process.env.PASSWORD})')")
unset PASSWORD
TOKEN=$(echo "$LOGIN" | json .token)
echo "Logged in."

DEVICES=$(api GET /devices)
DEVICE_ID=$(echo "$DEVICES" | SERIAL=$SERIAL json '.find(d=>d.serial===process.env.SERIAL)?.id ?? ""')
if [[ -n $DEVICE_ID ]]; then
  echo "Device $SERIAL already registered; rotating its key."
  DEVICE=$(api POST "/devices/$DEVICE_ID/rotate-key")
else
  DEVICE=$(api POST /devices "$(NAME=$NAME SERIAL=$SERIAL node -pe 'JSON.stringify({name:process.env.NAME,serial:process.env.SERIAL})')")
  echo "Registered device \"$NAME\" ($SERIAL)."
fi

mkdir -p "$(dirname "$KEY_FILE")"
(umask 077 && echo "$DEVICE" | json .apiKey > "$KEY_FILE")
echo "Device key saved to $KEY_FILE"
echo

echo "Members:"
MEMBERS=$(api GET /members)
echo "$MEMBERS" | node -e '
  const ms = JSON.parse(require("fs").readFileSync(0, "utf8"));
  console.table(ms.map(m => ({ membershipId: m.membershipId, name: m.name, status: m.status, biometricId: m.biometricId ?? "" })));'

echo "Link a member to a finger: enter a membership ID and a biometric ID. Leave blank to finish."
while true; do
  read -rp "Membership ID (e.g. GYM-0002): " MID
  [[ -z $MID ]] && break
  ID=$(echo "$MEMBERS" | MID=$MID json '.find(m=>m.membershipId===process.env.MID)?.id ?? ""')
  if [[ -z $ID ]]; then echo "  No member $MID."; continue; fi
  read -rp "Biometric ID for $MID: " BID
  [[ -z $BID ]] && continue
  if RES=$(api PATCH "/members/$ID/biometric" "$(BID=$BID node -pe 'JSON.stringify({biometricId:process.env.BID})')"); then
    echo "  $(echo "$RES" | json .name) -> $BID"
  fi
done

echo
echo "Ready. Simulate scans with:"
echo "  cd server && API_URL=$API_URL DEVICE_KEY=\$(cat $KEY_FILE) npm run scanner"
