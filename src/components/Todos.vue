<script setup lang="ts">
import '@/assets/main.css';
import { onMounted, ref } from 'vue';

import { type Todo, Data } from '@/services/data';

const dataClass = new Data();

// create a reactive reference to the array of todos
const todos = ref<Array<Todo>>([]);

function listTodos() {
  dataClass.listTodos().then((value) => {
    todos.value = value
  });
}

function createTodo() {
  dataClass.createTodo({
    content: window.prompt("Todo content")
  }).then(() => {
    // After creating a new todo, update the list of todos
    listTodos();
  });
}

function deleteTodo(id: string) {
  dataClass.deleteTodo(id);
}

function setDone(id: string, done: boolean) {
  dataClass
    .updateTodo(id, { isDone: done })
    .then(() => {
      listTodos();
    })
}

// fetch todos when the component is mounted
 onMounted(() => {
  listTodos();
});

</script>

<template>
  <main>
    <h1>My todos</h1>
    <button @click="createTodo">+ new</button>
    <ul>
      <li 
        v-for="todo in todos" 
        :key="todo.id"
        :class="{done: todo.isDone}"
        @click="setDone(todo.id, !todo.isDone)"
      >
        <input type="checkbox" :checked="!!todo.isDone">
        {{ todo.content }}
        <button class="right" @click="deleteTodo(todo.id)">Delete</button>
      </li>
    </ul>
    <div>
      🥳 App successfully hosted. Try creating a new todo.
      <br />
      <a href="https://docs.amplify.aws/gen2/start/quickstart/nextjs-pages-router/">
        Review next steps of this tutorial.
      </a>
    </div>
  </main>
</template>

<style>
.done {
  background-color: lightgreen;
}
.right {
  float: right;
}
</style>