import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/userStore'

export function useRegisterView() {
  const router = useRouter()
  const userStore = useUserStore()

  const form = reactive({
    username: '',
    email: '',
    password: ''
  })

  const handleRegister = async () => {
    await userStore.register(form)
    router.push('/')
  }

  return {
    userStore,
    form,
    handleRegister
  }
}

