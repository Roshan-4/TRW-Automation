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

RECIPIENT_EMAIL="roshanpaswan@tractorjunction.com"
SENDER_NAME="Roshan Paswan"

# Field set and order deliberately mirror the original working curl
# example exactly (source/identifier/screenshotUrl singular/attachments[]
# as a real file) — this API has been observed to report "queued
# successfully" but silently never deliver the email when a field present
# in that original example is dropped entirely or left empty. Only the
# values explicitly requested to change (recipient, sender, projectName,
# environment, counts, urls, subject) differ from the original; nothing
# is removed, and data[screenshotUrl] always carries a non-empty value
# (see PRIMARY_SCREENSHOT_URL fallback in scripts/send-report-email.js).
CURL_ARGS=(
  --location 'https://crs.farmjunction.in/api/send/email'
  --header "X-Api-Key: ${REPORT_EMAIL_API_KEY}"
  --header 'Accept: application/json'
  --form "email[]=${RECIPIENT_EMAIL}"
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

for path in "${SCREENSHOT_LOCAL_PATHS[@]}"; do
  CURL_ARGS+=(--form "attachments[]=@${path}")
done

echo "Sending report email to ${RECIPIENT_EMAIL}..."
curl "${CURL_ARGS[@]}"
echo
echo "Done."
