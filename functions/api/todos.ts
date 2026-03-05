interface Env {
  DB: D1Database
}

interface TodoRow {
  id: string
  content: string
  isDone: number
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const { results } = await env.DB.prepare(
    'SELECT id, content, isDone FROM todos'
  ).all<TodoRow>()
  const todos = results.map(row => ({ ...row, isDone: row.isDone === 1 }))
  return Response.json(todos)
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const { content } = await request.json<{ content: string }>()
  const id = crypto.randomUUID()
  await env.DB.prepare(
    'INSERT INTO todos (id, content, isDone) VALUES (?, ?, 0)'
  ).bind(id, content).run()
  return Response.json({ id, content, isDone: false }, { status: 201 })
}
