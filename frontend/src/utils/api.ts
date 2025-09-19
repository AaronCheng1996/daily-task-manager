import axios from 'axios'
import type { 
  User, 
  Task, 
  LoginCredentials, 
  RegisterData, 
  ApiResponse,
  HabitStatistics,
  DailyTaskStatistics,
  LongTermTaskStatistics,
  Milestone,
  ResetPasswordData
} from '@/types'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error instanceof Error ? error : new Error(error.message || 'Request failed'))
  }
)

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<ApiResponse> => {
    const response = await api.post('/login', credentials)
    return response.data
  },

  register: async (data: RegisterData): Promise<ApiResponse> => {
    const response = await api.post('/register', data)
    return response.data
  },

  resetPassword: async (data: ResetPasswordData): Promise<ApiResponse> => {
    const response = await api.post('/reset-password', data)
    return response.data
  },

  getProfile: async (): Promise<ApiResponse> => {
    const response = await api.get('/profile')
    return response.data
  },

  updateProfile: async (updates: Partial<User>): Promise<ApiResponse> => {
    const response = await api.patch('/profile', updates)
    return response.data
  },
}

export const taskApi = {
  getTasks: async (): Promise<ApiResponse> => {
    const response = await api.get('/tasks')
    return response.data
  },

  getTask: async (id: string): Promise<ApiResponse> => {
    const response = await api.get(`/tasks/${id}`)
    return response.data
  },

  createTask: async (taskData: any): Promise<ApiResponse> => {
    const response = await api.post('/tasks', taskData)
    return response.data
  },

  updateTask: async (id: string, updates: Partial<Task>): Promise<ApiResponse> => {
    const response = await api.patch(`/tasks/${id}`, updates)
    return response.data
  },

  deleteTask: async (id: string): Promise<ApiResponse> => {
    const response = await api.delete(`/tasks/${id}`)
    return response.data
  },

  toggleTaskCompletion: async (id: string): Promise<ApiResponse> => {
    const response = await api.post(`/tasks/${id}/toggle`)
    return response.data
  },

  getTaskStatistics: async (id: string): Promise<ApiResponse & { stats: HabitStatistics | DailyTaskStatistics | LongTermTaskStatistics }> => {
    const response = await api.get(`/tasks/${id}/stats`)
    return response.data
  },

  getTaskMilestones: async (taskId: string): Promise<ApiResponse & { milestones: Milestone[] }> => {
    const response = await api.get(`/tasks/${taskId}/milestones`)
    return response.data
  },

  createMilestone: async (taskId: string, milestoneData: {
    title: string;
    description?: string;
    order_index?: number;
  }): Promise<ApiResponse & { milestone: Milestone }> => {
    const response = await api.post(`/tasks/${taskId}/milestones`, milestoneData)
    return response.data
  },

  updateMilestone: async (taskId: string, milestoneId: string, updates: {
    title?: string;
    description?: string;
    order_index?: number;
  }): Promise<ApiResponse & { milestone: Milestone }> => {
    const response = await api.patch(`/tasks/${taskId}/milestones/${milestoneId}`, updates)
    return response.data
  },

  toggleMilestoneCompletion: async (taskId: string, milestoneId: string): Promise<ApiResponse> => {
    const response = await api.post(`/tasks/${taskId}/milestones/${milestoneId}/toggle`)
    return response.data
  },

  deleteMilestone: async (taskId: string, milestoneId: string): Promise<ApiResponse> => {
    const response = await api.delete(`/tasks/${taskId}/milestones/${milestoneId}`)
    return response.data
  },

  reorderTasks: async (taskId: string, prevOrderIndex: number | null, nextOrderIndex: number | null): Promise<ApiResponse> => {
    const response = await api.post(`/tasks/${taskId}/reorder`, { prevOrderIndex, nextOrderIndex })
    return response.data
  },

  reorderMilestones: async (taskId: string, milestoneOrders: Array<{ id: string; order_index: number }>): Promise<ApiResponse> => {
    const response = await api.post(`/tasks/${taskId}/milestones/reorder`, { milestoneOrders })
    return response.data
  },
}

export default api
