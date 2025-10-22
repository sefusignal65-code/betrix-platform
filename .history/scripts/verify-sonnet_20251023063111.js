/*
Simple verification script that queries a small test endpoint for a client to confirm the model is available.
Usage:
  node verify-sonnet.js --apiBase=... --apiKey=... --client=client1 --model=claude-sonnet-3.5
*/

import fetch from 'node-fetch'
import process from 'process'

function parseArg(name) {
  const arg = process.argv.find(a => a.startsWith(`--${name}=`))
  return arg ? arg.split('=')[1] : undefined
}

async function main() {
  const apiBase = parseArg('apiBase') || process.env.ADMIN_API_BASE
  const apiKey = parseArg('apiKey') || process.env.ADMIN_API_KEY
  const client = parseArg('client') || process.env.CANARY_CLIENT
  const model = parseArg('model') || 'claude-sonnet-3.5'

  if (!apiBase || !apiKey || !client) {
    console.error('Missing required args: --apiBase, --apiKey, --client')
    process.exit(2)
  }

  const url = `${apiBase.replace(/\/$/, '')}/admin/clients/${encodeURIComponent(client)}/models/${encodeURIComponent(model)}`
  const res = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}` } })
  if (!res.ok) {
    console.error('Verification API returned', res.status)
    process.exit(1)
  }
  const body = await res.json()
  console.log('Verification response:', body)
}

main().catch(err => { console.error(err); process.exit(1) })
