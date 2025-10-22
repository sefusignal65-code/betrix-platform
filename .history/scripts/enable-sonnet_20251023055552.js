/*
Enable Claude Sonnet 3.5 for a list of client IDs (template).

Usage:
  node enable-sonnet.js --apiBase=https://api.example.com --apiKey=XXX --clients=client1,client2 --model=claude-sonnet-3.5 --canaryCount=2

Notes:
- This is a template. Replace the endpoint paths with your admin API endpoints.
- The script performs a dry-run by default. Use --apply to actually send the requests.
- It includes simple rate-limiting and retries.
*/

import fetch from 'node-fetch'
import process from 'process'

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function enableForClient(apiBase, apiKey, clientId, model, apply) {
  const url = `${apiBase.replace(/\/$/, '')}/admin/clients/${encodeURIComponent(clientId)}/models`
  const body = { model, enabled: true }
  if (!apply) {
    console.log(`[dry-run] Would enable ${model} for client=${clientId} via ${url}`)
    return { ok: true, dry: true }
  }
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(body),
        timeout: 15000,
      })
      const text = await res.text()
      if (res.ok) {
        console.log(`Enabled ${model} for ${clientId}: ${res.status}`)
        return { ok: true, status: res.status, body: text }
      }
      console.warn(`Attempt ${attempt} failed for ${clientId}: ${res.status} ${text}`)
    } catch (err) {
      console.warn(`Attempt ${attempt} error for ${clientId}:`, err.message || err)
    }
    await sleep(1000 * attempt)
  }
  return { ok: false }
}

function parseArg(name) {
  const arg = process.argv.find(a => a.startsWith(`--${name}=`))
  return arg ? arg.split('=')[1] : undefined
}

async function main() {
  const apiBase = parseArg('apiBase') || process.env.ADMIN_API_BASE
  const apiKey = parseArg('apiKey') || process.env.ADMIN_API_KEY
  const clientsArg = parseArg('clients') || process.env.TARGET_CLIENTS
  const model = parseArg('model') || 'claude-sonnet-3.5'
  const canaryCount = parseInt(parseArg('canaryCount') || '0', 10)
  const apply = !!process.argv.find(a => a === '--apply')

  if (!apiBase || !apiKey || !clientsArg) {
    console.error('Missing required args: --apiBase, --apiKey, --clients')
    process.exit(2)
  }
  const clients = clientsArg.split(',').map(s => s.trim()).filter(Boolean)
  if (clients.length === 0) {
    console.error('No clients provided')
    process.exit(2)
  }

  // Canary selection
  let targets = clients
  if (canaryCount > 0) {
    targets = clients.slice(0, canaryCount)
    console.log(`Running canary on ${targets.length} clients:`, targets)
  }

  for (const clientId of targets) {
    // small delay to avoid burst
    await sleep(250)
    const res = await enableForClient(apiBase, apiKey, clientId, model, apply)
    if (!res.ok) {
      console.error(`Failed to enable model for ${clientId}`)
    }
  }

  console.log('Done. For global rollout, run again with canaryCount=0 and --apply')
}

main().catch(err => { console.error(err); process.exit(1) })
