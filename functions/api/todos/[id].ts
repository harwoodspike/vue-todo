interface Env {
  DB: D1Database
}

interface TodoRow {
  id: string
  content: string
  isDone: number
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

export const onRequestGet: PagesFunction<Env> = async ({ params, request, env }) => {
  const userId = getUserId(request)
  if (!userId) return new Response('Unauthorized', { status: 401 })
  const id = params.id as string
  const row = await env.DB.prepare(
    'SELECT id, content, isDone FROM todos WHERE id = ? AND userId = ?'
  ).bind(id, userId).first<TodoRow>()
  if (!row) return new Response('Not found', { status: 404 })
  return Response.json({ ...row, isDone: row.isDone === 1 })
}

export const onRequestDelete: PagesFunction<Env> = async ({ params, request, env }) => {
  const userId = getUserId(request)
  if (!userId) return new Response('Unauthorized', { status: 401 })
  const id = params.id as string
  await env.DB.prepare('DELETE FROM todos WHERE id = ? AND userId = ?').bind(id, userId).run()
  return new Response(null, { status: 204 })
}

export const onRequestPatch: PagesFunction<Env> = async ({ params, request, env }) => {
  const userId = getUserId(request)
  if (!userId) return new Response('Unauthorized', { status: 401 })
  const id = params.id as string
  const data = await request.json<{ content?: string; isDone?: boolean }>()
  const fields: string[] = []
  const values: (string | number)[] = []
  if (data.content !== undefined) { fields.push('content = ?'); values.push(data.content) }
  if (data.isDone !== undefined) { fields.push('isDone = ?'); values.push(data.isDone ? 1 : 0) }
  if (fields.length === 0) return new Response('No fields to update', { status: 400 })
  values.push(id, userId)
  await env.DB.prepare(
    `UPDATE todos SET ${fields.join(', ')} WHERE id = ? AND userId = ?`
  ).bind(...values).run()
  return new Response(null, { status: 204 })
}
