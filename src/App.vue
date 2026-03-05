<script setup lang="ts">

import Authenticator from "@/components/Authenticator.vue";
import "@aws-amplify/ui-vue/styles.css";
import Todos from './components/Todos.vue'
</script>

<template>
  <main>
    <authenticator>
      <template v-slot="{ user, signOut }">
        <h1>Hello {{user?.signInDetails?.loginId}}'s todos</h1>
        <Todos />
        <button @click="signOut">Sign Out</button>
      </template>
    </authenticator>
  </main>
</template>

