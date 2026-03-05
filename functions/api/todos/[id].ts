interface Env {
  DB: D1Database
}

interface TodoRow {
  id: string
  content: string
  isDone: number
}

export const onRequestGet: PagesFunction<Env> = async ({ params, env }) => {
  const id = params.id as string
  const row = await env.DB.prepare(
    'SELECT id, content, isDone FROM todos WHERE id = ?'
  ).bind(id).first<TodoRow>()
  if (!row) return new Response('Not found', { status: 404 })
  return Response.json({ ...row, isDone: row.isDone === 1 })
}

export const onRequestDelete: PagesFunction<Env> = async ({ params, env }) => {
  const id = params.id as string
  await env.DB.prepare('DELETE FROM todos WHERE id = ?').bind(id).run()
  return new Response(null, { status: 204 })
}

export const onRequestPatch: PagesFunction<Env> = async ({ params, request, env }) => {
  const id = params.id as string
  const data = await request.json<{ content?: string; isDone?: boolean }>()
  const fields: string[] = []
  const values: (string | number)[] = []
  if (data.content !== undefined) { fields.push('content = ?'); values.push(data.content) }
  if (data.isDone !== undefined) { fields.push('isDone = ?'); values.push(data.isDone ? 1 : 0) }
  if (fields.length === 0) return new Response('No fields to update', { status: 400 })
  values.push(id)
  await env.DB.prepare(
    `UPDATE todos SET ${fields.join(', ')} WHERE id = ?`
  ).bind(...values).run()
  return new Response(null, { status: 204 })
}
