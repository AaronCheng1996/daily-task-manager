import axios from 'axios'
import type { 
  User, 
  Task, 
  LoginCredentials, 
  RegisterData, 
  ApiResponse,
  HabitStatistics,
  HabitCompletionRecord,
  DailyTaskStatistics,
  LongTermTaskStatistics,
  Milestone
} from '@/types'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear invalid token
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<ApiResponse> => {
    const response = await api.post('/auth/login', credentials)
    return response.data
  },

  register: async (data: RegisterData): Promise<ApiResponse> => {
    const response = await api.post('/auth/register', data)
    return response.data
  },

  getProfile: async (): Promise<ApiResponse> => {
    const response = await api.get('/auth/profile')
    return response.data
  },

  updateProfile: async (updates: Partial<User>): Promise<ApiResponse> => {
    const response = await api.patch('/auth/profile', updates)
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

  // Habit specific APIs
  getHabitStatistics: async (id: string): Promise<ApiResponse & { stats: HabitStatistics }> => {
    const response = await api.get(`/tasks/${id}/habit-stats`)
    return response.data
  },

  getHabitHistory: async (id: string, limit: number = 50): Promise<ApiResponse & { history: HabitCompletionRecord[] }> => {
    const response = await api.get(`/tasks/${id}/habit-history?limit=${limit}`)
    return response.data
  },

  // Daily task specific APIs
  getDailyTaskStatistics: async (id: string): Promise<ApiResponse & { stats: DailyTaskStatistics }> => {
    const response = await api.get(`/tasks/${id}/daily-stats`)
    return response.data
  },

  processDailyReset: async (): Promise<ApiResponse> => {
    const response = await api.post('/tasks/daily-reset')
    return response.data
  },

  // Long-term task specific APIs
  getLongTermTaskStatistics: async (id: string): Promise<ApiResponse & { stats: LongTermTaskStatistics }> => {
    const response = await api.get(`/tasks/${id}/longterm-stats`)
    return response.data
  },

  // Milestone management APIs
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

  updateMilestone: async (milestoneId: string, updates: {
    title?: string;
    description?: string;
    order_index?: number;
  }): Promise<ApiResponse & { milestone: Milestone }> => {
    const response = await api.patch(`/tasks/milestones/${milestoneId}`, updates)
    return response.data
  },

  toggleMilestoneCompletion: async (milestoneId: string): Promise<ApiResponse> => {
    const response = await api.post(`/tasks/milestones/${milestoneId}/toggle`)
    return response.data
  },

  deleteMilestone: async (milestoneId: string): Promise<ApiResponse> => {
    const response = await api.delete(`/tasks/milestones/${milestoneId}`)
    return response.data
  },

  reorderMilestones: async (taskId: string, milestoneOrders: Array<{
    id: string;
    order_index: number;
  }>): Promise<ApiResponse> => {
    const response = await api.put(`/tasks/${taskId}/milestones/reorder`, { milestoneOrders })
    return response.data
  },
}

export default api
