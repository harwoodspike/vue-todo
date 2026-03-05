export interface Todo {
    id: string
    content: string
    isDone: boolean
}

class Data {
    getTodo (id) : Promise<Todo> {
        return
    }

    listTodos() : Promise<Todo> {
        return
    }

    deleteTodo (id) {}

    updateTodo (id, data) : Promise<void> {
        return
    }

    createTodo (data) : Promise<void> {
        return
    }
}

export { Data }