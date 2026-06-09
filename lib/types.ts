export type AdminRole = 'super' | 'local'

export interface Admin {
  id: string
  email: string
  role: AdminRole
  name: string
  created_at: string
}

export interface Survey {
  id: string
  title: string
  question: string
  is_active: boolean
  result_order: 'rank' | 'original'
  created_by: string
  created_at: string
  closed_at: string | null
}

export interface SurveyOption {
  id: string
  survey_id: string
  text: string
  display_order: number
}

export interface SurveyResponse {
  id: string
  survey_id: string
  option_id: string
  device_fingerprint: string | null
  created_at: string
}

export interface SurveyResult {
  survey_id: string
  question: string
  option_id: string
  option_text: string
  display_order: number
  response_count: number
  percentage: number
}

export interface TvConfig {
  id: string
  promo_message: string
  screen_rotation_enabled: boolean
  rotation_interval_seconds: number
  orientation: 'horizontal' | 'vertical'
  updated_at: string
}

export interface TvScreen {
  id: string
  screen_type: 'survey' | 'promo_image'
  display_order: number
  is_enabled: boolean
  image_url: string | null
  image_name: string | null
  survey_id: string | null
}

export interface AdminSession {
  adminId: string
  role: AdminRole
  name: string
}
