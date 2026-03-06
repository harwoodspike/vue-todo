interface Env {
  DB: D1Database
}

interface TodoRow {
  id: string
  content: string
  isDone: number
  createdAt: string
  updatedAt: string
}

function getUserId(request: Request): string | null {
  const auth = request.headers.get('Authorization')
  if (!auth?.startsWith('Bearer ')) return null
  const payload = auth.slice(7).split('.')[1]
  try {
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
    return decoded.sub ?? null
  } catch {
    return null
  }
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const userId = getUserId(request)
  if (!userId) return new Response('Unauthorized', { status: 401 })
  const { results } = await env.DB.prepare(
    'SELECT id, content, isDone, createdAt, updatedAt FROM todos WHERE userId = ?'
  ).bind(userId).all<TodoRow>()
  const todos = results.map(row => ({ ...row, isDone: row.isDone === 1 }))
  return Response.json(todos)
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const userId = getUserId(request)
  if (!userId) return new Response('Unauthorized', { status: 401 })
  const { content } = await request.json<{ content: string }>()
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  await env.DB.prepare(
    'INSERT INTO todos (id, content, isDone, userId, createdAt, updatedAt) VALUES (?, ?, 0, ?, ?, ?)'
  ).bind(id, content, userId, now, now).run()
  return Response.json({ id, content, isDone: false, createdAt: now, updatedAt: now }, { status: 201 })
}
