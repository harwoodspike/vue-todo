import { getToken } from './auth-token'

export interface Todo {
    id: string
    content: string
    isDone: boolean
}

function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
    const token = getToken()
    return token
        ? { Authorization: `Bearer ${token}`, ...extra }
        : extra
}

class Data {
    getTodo(id: string): Promise<Todo> {
        return fetch(`/api/todos/${id}`, { headers: authHeaders() }).then(r => r.json())
    }

    listTodos(): Promise<Todo[]> {
        return fetch('/api/todos', { headers: authHeaders() }).then(r => r.json())
    }

    deleteTodo(id: string): void {
        fetch(`/api/todos/${id}`, { method: 'DELETE', headers: authHeaders() })
    }

    updateTodo(id: string, data: Partial<Todo>): Promise<void> {
        return fetch(`/api/todos/${id}`, {
            method: 'PATCH',
            headers: authHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify(data),
        }).then(() => undefined)
    }

    createTodo(data: Omit<Todo, 'id'>): Promise<void> {
        return fetch('/api/todos', {
            method: 'POST',
            headers: authHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify(data),
        }).then(() => undefined)
    }
}

export { Data }
