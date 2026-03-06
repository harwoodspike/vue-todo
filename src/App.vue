<script setup lang="ts">

import Authenticator from "@/components/Authenticator.vue";
import Todos from './components/Todos.vue'
</script>

<template>
  <authenticator>
    <template v-slot="{ user, signOut }">
      <div class="app">
        <h1>Hello {{user?.signInDetails?.loginId}}'s todos</h1>
        <Todos />
        <button @click="signOut">Sign Out</button>
      </div>
    </template>
  </authenticator>
</template>

<style scoped>
.app {
  max-width: 600px;
  margin: 40px auto;
  padding: 0 24px;
}
</style>
