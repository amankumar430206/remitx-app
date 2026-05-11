import { apiClient } from './client'

export interface KycDocument {
  filename: string
  type: string
  path: string
}

export interface KycApplication {
  id: string
  status: 'pending' | 'submitted' | 'approved' | 'rejected'
  documents: KycDocument[]
  reviewed_at: string | null
  created_at: string
}

const kycApi = {
  status: () =>
    apiClient.get<{ success: boolean; data: KycApplication | null }>('/compliance/kyc/status'),

  initiate: () =>
    apiClient.post<{ success: boolean; data: KycApplication }>('/compliance/kyc/initiate'),

  upload: (formData: FormData) =>
    apiClient.post<{ success: boolean; data: { path: string } }>(
      '/compliance/kyc/documents', formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    ),
}

export default kycApi
