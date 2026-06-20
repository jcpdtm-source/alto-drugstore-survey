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
  screen_type: 'survey' | 'promo_image' | 'game'
  display_order: number
  is_enabled: boolean
  image_url: string | null
  image_name: string | null
  survey_id: string | null
  duration_seconds: number | null
}

export interface AdminSession {
  adminId: string
  role: AdminRole
  name: string
}

// ── Sistema de Premios ──────────────────────────────────────

export interface GameConfig {
  id: string
  is_active: boolean
  global_counter: number
  redemption_hours: number
  win_cooldown_days: number
  game_messages: string[]
  updated_at: string
}

export interface Prize {
  id: string
  name: string
  message: string
  activation_vote: number
  frequency: number
  priority: number
  stock: number | null
  stock_remaining: number | null
  is_active: boolean
  deliveries_count?: number
  created_at: string
}

export interface ConsolationMessage {
  id: string
  message: string
  is_active: boolean
  display_order: number
}

export interface PrizeDelivery {
  id: string
  prize_name: string
  prize_message: string
  device_fingerprint: string
  counter_value: number
  expires_at: string
  created_at: string
}

export interface PlayGameResult {
  won: boolean
  counter: number
  prize_id?: string
  prize_name?: string
  prize_message?: string
  delivery_id?: string
  expires_at?: string
  consolation_message?: string
  already_won_cooldown?: boolean
  error?: string
}
