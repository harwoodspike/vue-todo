export interface Todo {
    id: string
    content: string
    isDone: boolean
}

class Data {
    getTodo(id: string): Promise<Todo> {
        return fetch(`/api/todos/${id}`).then(r => r.json())
    }

    listTodos(): Promise<Todo[]> {
        return fetch('/api/todos').then(r => r.json())
    }

    deleteTodo(id: string): void {
        fetch(`/api/todos/${id}`, { method: 'DELETE' })
    }

    updateTodo(id: string, data: Partial<Todo>): Promise<void> {
        return fetch(`/api/todos/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        }).then(() => undefined)
    }

    createTodo(data: Omit<Todo, 'id'>): Promise<void> {
        return fetch('/api/todos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        }).then(() => undefined)
    }
}

export { Data }