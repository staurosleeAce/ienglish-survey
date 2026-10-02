const URL = 'https://fqadjocrgsxbaztmyknc.supabase.co'
const PUBLISHABLE = 'sb_publishable_hHjJTjtp0ltrWf24FkqQjQ_9jbZNzQj'
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || 'stauroslee@gmail.com'
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || '12345678'

const login = await fetch(`${URL}/auth/v1/token?grant_type=password`, {
  method: 'POST',
  headers: { apikey: PUBLISHABLE, 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
})
const session = await login.json()
const token = session.access_token

const res = await fetch(`${URL}/rest/v1/survey_responses?id=eq.104426b9-8316-4f39-bd6b-62fe39d89490`, {
  method: 'DELETE',
  headers: { apikey: PUBLISHABLE, Authorization: `Bearer ${token}` },
})
console.log('DELETE by id ->', res.status, await res.text())