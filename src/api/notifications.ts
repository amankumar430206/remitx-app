import { apiClient } from './client'

export interface AppNotification {
  id: string
  type: string
  title: string
  body: string
  read_at: string | null
  created_at: string
  metadata?: Record<string, string>
}

const notificationsApi = {
  list: (params?: { page?: number; limit?: number }) =>
    apiClient.get<{ success: boolean; data: AppNotification[]; meta: { page: number; limit: number; total: number } }>(
      '/notifications', { params }
    ),

  markRead: (id: string) =>
    apiClient.patch(`/notifications/${id}/read`),

  markAllRead: () =>
    apiClient.patch('/notifications/read-all'),
}

export default notificationsApi
