#!/bin/bash
# Sends the QA automation execution report email via the shared reporting
# API (crs.farmjunction.in), using the latest published Allure report.
#
# Prerequisites (run first, or via `npm run test:en:full-report` style
# pipeline once one exists):
#   npm run generate:report   # builds allure-report/ from allure-results/
#   npm run report:publish    # publishes it to GitHub Pages, writes
#                              # reports/last-report-publish.json
#
# Reads REPORT_EMAIL_API_KEY from cypress/.env (gitignored) — never hardcode
# the API key here.
#
# Usage: ./Send_mail.sh

set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"

# Recompute the email data (stats/URLs) fresh from the latest report/publish.
node scripts/send-report-email.js

# shellcheck disable=SC1091
source reports/report-email-data.sh

if [ -f cypress/.env ]; then
  # shellcheck disable=SC1091
  source cypress/.env
fi

if [ -z "${REPORT_EMAIL_API_KEY:-}" ]; then
  echo "Send_mail.sh: REPORT_EMAIL_API_KEY is not set (expected in cypress/.env)." >&2
  exit 1
fi

# Recipients: comma-separated in REPORT_EMAIL_RECIPIENTS (cypress/.env).
REPORT_EMAIL_RECIPIENTS="${REPORT_EMAIL_RECIPIENTS:-roshanpaswan@tractorjunction.com,mujjamilsalim@tractorjunction.com,kshitizchandra@tractorjunction.com,vikassingh@tractorjunction.com,shubham@tractorjunction.com}"
SENDER_NAME="${REPORT_EMAIL_SENDER_NAME:-Roshan Paswan}"

# GitHub Actions sets CI=true. Outside CI (a developer running the pipeline
# locally) always send to just this one address, regardless of
# REPORT_EMAIL_RECIPIENTS, so a local test run never spams the real
# distribution list.
if [ -z "${CI:-}" ]; then
  echo "Send_mail.sh: not running in CI — restricting recipients to roshanpaswan@tractorjunction.com."
  REPORT_EMAIL_RECIPIENTS="roshanpaswan@tractorjunction.com"
fi

# Parse comma-separated list into a bash array (trim whitespace around each).
IFS=',' read -ra RECIPIENT_LIST <<< "${REPORT_EMAIL_RECIPIENTS}"

# Field set mirrors the original working curl example exactly. This API has
# been observed to fail delivery when any template field is dropped or empty
# (data[screenshotUrl], data[passedCount], attachments[] as a real file, etc.).
require_non_empty() {
  local label="$1"
  local value="$2"
  if [ -z "${value}" ]; then
    echo "Send_mail.sh: required field ${label} is empty." >&2
    exit 1
  fi
}

require_non_empty EXECUTION_DATETIME "${EXECUTION_DATETIME}"
require_non_empty REPORT_ENVIRONMENT "${REPORT_ENVIRONMENT}"
require_non_empty REPORT_URL "${REPORT_URL}"
require_non_empty PRIMARY_SCREENSHOT_URL "${PRIMARY_SCREENSHOT_URL}"
require_non_empty FAILED_COUNT "${FAILED_COUNT}"
require_non_empty TOTAL_TEST_CASES "${TOTAL_TEST_CASES}"
require_non_empty EMAIL_DESCRIPTION "${EMAIL_DESCRIPTION}"
require_non_empty EMAIL_PRIORITY "${EMAIL_PRIORITY}"
require_non_empty EMAIL_SUBJECT "${EMAIL_SUBJECT}"

CURL_ARGS=(
  --location 'https://crs.farmjunction.in/api/send/email'
  --header "X-Api-Key: ${REPORT_EMAIL_API_KEY}"
  --header 'Accept: application/json'
)

for addr in "${RECIPIENT_LIST[@]}"; do
  addr="$(echo "${addr}" | xargs)"
  if [ -n "${addr}" ]; then
    CURL_ARGS+=(--form "email[]=${addr}")
  fi
done

CURL_ARGS+=(
  --form 'source=Finj'
  --form 'identifier=qa-automation-report'
  --form 'data[projectName]=Truck Junction'
  --form "data[executionDateTime]=${EXECUTION_DATETIME}"
  --form "data[environment]=${REPORT_ENVIRONMENT}"
  --form "data[reportUrl]=${REPORT_URL}"
  --form "data[screenshotUrl]=${PRIMARY_SCREENSHOT_URL}"
  --form "data[failedCount]=${FAILED_COUNT}"
  --form "data[totalTestCases]=${TOTAL_TEST_CASES}"
  --form "data[senderName]=${SENDER_NAME}"
  --form "data[description]=${EMAIL_DESCRIPTION}"
  --form "data[priority]=${EMAIL_PRIORITY}"
  --form "subject=${EMAIL_SUBJECT}"
)

if [ -z "${ATTACHMENT_LOCAL_PATH:-}" ]; then
  echo "Send_mail.sh: no attachment file available (required by mail API)." >&2
  exit 1
fi

CURL_ARGS+=(--form "attachments[]=@${ATTACHMENT_LOCAL_PATH}")

echo "Sending report email to: ${REPORT_EMAIL_RECIPIENTS}..."
RESPONSE="$(curl -sS "${CURL_ARGS[@]}")"
echo "${RESPONSE}"
if echo "${RESPONSE}" | grep -Eqi 'failed to queue|"success"[[:space:]]*:[[:space:]]*false|\"errors\"'; then
  echo "Send_mail.sh: mail API rejected the request (see response above)." >&2
  exit 1
fi
echo "Done."
