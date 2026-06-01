import { apiClient } from './client'

const admin = {
  payments: {
    process: (id: string, action: 'complete' | 'fail', notes?: string, providerRef?: string) =>
      apiClient.put(`/admin/payments/${id}/process`, { action, notes, providerRef }),
  },
}

export default admin
