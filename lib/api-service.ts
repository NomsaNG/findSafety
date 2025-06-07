/**
 * API Service for FindSafety
 * Handles all communication with the backend API
 */

// Use the API proxy in development to avoid CORS issues
const useApiProxy = process.env.NODE_ENV === "development"
const API_BASE_URL = useApiProxy ? "/api/proxy" : process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

/**
 * Generic fetch wrapper with error handling
 */
async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  if (!response.ok) {
    // Try to get error message from response
    let errorMessage
    try {
      const errorData = await response.json()
      errorMessage = errorData.error || `API error: ${response.status}`
    } catch (e) {
      errorMessage = `API error: ${response.status}`
    }

    throw new Error(errorMessage)
  }

  return response.json()
}

/**
 * Crime data API functions
 */
export const crimeAPI = {
  // Get crimes with optional filtering
  getCrimes: async (params: {
    type?: string
    location?: string
    startDate?: string
    endDate?: string
    severity?: string
    limit?: number
  }) => {
    const queryParams = new URLSearchParams()

    if (params.type) queryParams.append("type", params.type)
    if (params.location) queryParams.append("location", params.location)
    if (params.startDate) queryParams.append("start_date", params.startDate)
    if (params.endDate) queryParams.append("end_date", params.endDate)
    if (params.severity) queryParams.append("severity", params.severity)
    if (params.limit) queryParams.append("limit", params.limit.toString())

    return fetchAPI<{
      crimes: any[]
      total: number
      query: any
    }>(`/crimes?${queryParams.toString()}`)
  },

  // Search crimes with natural language query
  searchCrimes: async (query: string, limit = 10) => {
    return fetchAPI<{
      results: any[]
      query: string
      total: number
    }>("/crimes/search", {
      method: "POST",
      body: JSON.stringify({ query, limit }),
    })
  },

  // Get crime statistics
  getStats: async () => {
    return fetchAPI<{
      stats: any[]
      period: { start: string; end: string }
    }>("/crimes/stats")
  },

  // Get crime trends over time
  getTrends: async () => {
    return fetchAPI<{
      trends: any[]
      period: { start: string; end: string }
    }>("/crimes/trends")
  },

  // Get heatmap data
  getHeatmapData: async (
    params: {
      type?: string
      days?: number
    } = {},
  ) => {
    const queryParams = new URLSearchParams()

    if (params.type) queryParams.append("type", params.type)
    if (params.days) queryParams.append("days", params.days.toString())

    return fetchAPI<{
      heatmap_data: any[]
      total_points: number
    }>(`/crimes/heatmap?${queryParams.toString()}`)
  },
}

/**
 * Chat API functions
 */
export const chatAPI = {
  // Send message to AI assistant
  sendMessage: async (message: string) => {
    return fetchAPI<{
      response: string
      relevant_crimes: any[]
      timestamp: string
    }>("/chat", {
      method: "POST",
      body: JSON.stringify({ message }),
    })
  },
}

/**
 * Alerts API functions
 */
export const alertsAPI = {
  // Get user alerts
  getAlerts: async (userId = "default_user") => {
    return fetchAPI<{
      alerts: any[]
      total: number
    }>(`/alerts?user_id=${userId}`)
  },

  // Create new alert
  createAlert: async (alertData: any) => {
    return fetchAPI<{
      alert: any
      message: string
    }>("/alerts", {
      method: "POST",
      body: JSON.stringify(alertData),
    })
  },

  // Update existing alert
  updateAlert: async (alertId: string, alertData: any) => {
    return fetchAPI<{
      alert: any
      message: string
    }>(`/alerts/${alertId}`, {
      method: "PUT",
      body: JSON.stringify(alertData),
    })
  },

  // Delete alert
  deleteAlert: async (alertId: string) => {
    return fetchAPI<{
      message: string
    }>(`/alerts/${alertId}`, {
      method: "DELETE",
    })
  },
}

/**
 * Health check API
 */
export const healthAPI = {
  check: async () => {
    return fetchAPI<{
      status: string
      timestamp: string
    }>("/health")
  },
}
