import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/userStore'

export function useLoginView() {
  const router = useRouter()
  const userStore = useUserStore()

  const form = reactive({
    usernameOrEmail: '',
    password: ''
  })

  const handleLogin = async () => {
    await userStore.login(form)
    router.push('/')
  }

  return {
    userStore,
    form,
    handleLogin
  }
}

