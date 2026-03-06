<script lang="ts" setup>
import { ref } from 'vue'
import {
  CognitoUserPool,
  CognitoUser,
  CognitoUserAttribute,
  AuthenticationDetails,
  type CognitoUserSession,
} from 'amazon-cognito-identity-js'
import { setToken } from '@/services/auth-token'

export interface AuthUser {
  signInDetails: {
    loginId: string
  }
}

const userPool = new CognitoUserPool({
  UserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
  ClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
})

const user = ref<AuthUser | null>(null)
const tab = ref<'signIn' | 'createAccount' | 'confirm'>('signIn')
const email = ref('')
const password = ref('')
const confirmationCode = ref('')
const showPassword = ref(false)
const error = ref('')
let pendingCognitoUser: CognitoUser | null = null

// Restore session on mount
const existingUser = userPool.getCurrentUser()
if (existingUser) {
  existingUser.getSession((err: Error | null, session: CognitoUserSession | null) => {
    if (!err && session?.isValid()) {
      setToken(session.getIdToken().getJwtToken())
      const loginId = session.getIdToken().payload.email ?? existingUser.getUsername()
      user.value = { signInDetails: { loginId } }
    }
  })
}

function signIn() {
  error.value = ''
  const authDetails = new AuthenticationDetails({
    Username: email.value,
    Password: password.value,
  })
  const cognitoUser = new CognitoUser({
    Username: email.value,
    Pool: userPool,
  })
  cognitoUser.authenticateUser(authDetails, {
    onSuccess(session) {
      setToken(session.getIdToken().getJwtToken())
      user.value = { signInDetails: { loginId: email.value } }
    },
    onFailure(err) {
      error.value = err.message ?? 'Sign in failed'
    },
  })
}

function createAccount() {
  error.value = ''
  const emailAttr = new CognitoUserAttribute({ Name: 'email', Value: email.value })
  userPool.signUp(email.value, password.value, [emailAttr], [], (err, result) => {
    if (err) {
      error.value = err.message ?? 'Sign up failed'
      return
    }
    pendingCognitoUser = result?.user ?? null
    tab.value = 'confirm'
  })
}

function confirmEmail() {
  error.value = ''
  if (!pendingCognitoUser) {
    if (!email.value) {
      error.value = 'Please enter the email address you signed up with.'
      return
    }
    pendingCognitoUser = new CognitoUser({ Username: email.value, Pool: userPool })
  }
  pendingCognitoUser.confirmRegistration(confirmationCode.value, true, (err) => {
    if (err) {
      error.value = err.message ?? 'Confirmation failed'
      return
    }
    confirmationCode.value = ''
    tab.value = 'signIn'
  })
}

function signOut() {
  userPool.getCurrentUser()?.signOut()
  setToken(null)
  user.value = null
  email.value = ''
  password.value = ''
}
</script>

<template>
  <div v-if="user">
    <slot :user="user" :signOut="signOut" />
  </div>
  <div v-else class="auth-screen">
    <div class="auth-card">
      <div v-if="tab !== 'confirm'" class="auth-tabs">
        <button :class="['tab', { active: tab === 'signIn' }]" @click="tab = 'signIn'">Sign In</button>
        <button :class="['tab', { active: tab === 'createAccount' }]" @click="tab = 'createAccount'">Create Account</button>
      </div>
      <div v-else class="auth-tabs">
        <button class="tab active">Confirm Account</button>
      </div>

      <form v-if="tab === 'signIn'" @submit.prevent="signIn">
        <div class="field">
          <label for="email">Email</label>
          <input id="email" v-model="email" type="email" placeholder="Enter your Email" required />
        </div>
        <div class="field">
          <label for="password">Password</label>
          <div class="password-wrap">
            <input
              id="password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Enter your Password"
              required
            />
            <button type="button" class="eye-btn" @click="showPassword = !showPassword" aria-label="Toggle password visibility">
              <svg v-if="showPassword" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </button>
          </div>
        </div>
        <p v-if="error" class="error">{{ error }}</p>
        <button type="submit" class="submit-btn">Sign in</button>
        <a href="#" class="forgot-link">Forgot your password?</a>
      </form>

      <form v-else-if="tab === 'confirm'" @submit.prevent="confirmEmail">
        <div v-if="!email" class="field">
          <label for="confirm-email">Email</label>
          <input id="confirm-email" v-model="email" type="email" placeholder="Enter your Email" required />
        </div>
        <div class="field">
          <label for="code">Confirmation Code</label>
          <p v-if="email" class="confirm-hint">We sent a code to {{ email }}. Enter it below.</p>
          <input id="code" v-model="confirmationCode" type="text" placeholder="Enter your code" required />
        </div>
        <p v-if="error" class="error">{{ error }}</p>
        <button type="submit" class="submit-btn">Confirm</button>
        <a href="#" class="forgot-link" @click.prevent="tab = 'createAccount'">Back</a>
      </form>

      <form v-else @submit.prevent="createAccount">
        <div class="field">
          <label for="new-email">Email</label>
          <input id="new-email" v-model="email" type="email" placeholder="Enter your Email" required />
        </div>
        <div class="field">
          <label for="new-password">Password</label>
          <div class="password-wrap">
            <input
              id="new-password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Enter your Password"
              required
            />
            <button type="button" class="eye-btn" @click="showPassword = !showPassword" aria-label="Toggle password visibility">
              <svg v-if="showPassword" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </button>
          </div>
        </div>
        <p v-if="error" class="error">{{ error }}</p>
        <button type="submit" class="submit-btn">Create Account</button>
        <a href="#" class="forgot-link" @click.prevent="tab = 'confirm'">Already have a confirmation code?</a>
      </form>
    </div>
  </div>
</template>

<style scoped>
.auth-screen {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.auth-card {
  background: white;
  width: 500px;
  border: 1px solid #ccc;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  padding-bottom: 48px;
  border-top: 3px solid #2e7d8f;
}

.auth-tabs {
  display: flex;
  border-bottom: 1px solid #ddd;
}

.tab {
  flex: 1;
  padding: 20px;
  font-size: 16px;
  font-weight: 700;
  background: none;
  border: none;
  border-radius: 0;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  color: #1a1a2e;
  margin-bottom: -1px;
}

.tab.active {
  color: #2e7d8f;
  border-bottom-color: #2e7d8f;
  font-weight: 600;
}

form {
  padding: 24px 48px 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

label {
  font-size: 15px;
  font-weight: 500;
  color: #1a1a2e;
}

input[type="email"],
input[type="password"],
input[type="text"] {
  padding: 14px 16px;
  font-size: 15px;
  border: 1px solid #bbb;
  border-radius: 6px;
  background: #ffffff;
  outline: none;
  width: 100%;
  box-sizing: border-box;
}

input:focus {
  border-color: #2e7d8f;
}

.password-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.password-wrap input {
  padding-right: 48px;
}

.eye-btn {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  cursor: pointer;
  color: #555;
  padding: 0;
  display: flex;
  align-items: center;
}

.submit-btn {
  padding: 10px 16px;
  background: #2e7d8f;
  color: white;
  font-size: 16px;
  font-weight: 700;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  width: 100%;
}

.submit-btn:hover {
  background: #256575;
}

.forgot-link {
  display: block;
  text-align: center;
  color: #2e7d8f;
  font-size: 14px;
  font-weight: normal;
  text-decoration: none;
  padding: 12px 0;
}

.forgot-link:hover {
  text-decoration: underline;
}

.error {
  color: #c0392b;
  font-size: 14px;
  margin: 0;
}

.confirm-hint {
  font-size: 13px;
  color: #555;
  margin: 0;
}
</style>
