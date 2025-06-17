/**
 * API Service for FindSafety
 * Handles all communication with the backend API
 */

// Use the API proxy in development to avoid CORS issues
const useApiProxy = false;
const API_BASE_URL = useApiProxy ? "/api/proxy" : process.env.NEXT_PUBLIC_API_URL || " https://findsafety-302256036189.us-central1.run.app"

/**
 * Generic fetch wrapper with error handling and authentication
 */
async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  // Get token from localStorage if available
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null

  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };
  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });
    if (!response.ok) {
      // Handle authentication errors
    if (response.status === 401 && typeof window !== "undefined") {
      // Token expired or invalid, clear local storage
      localStorage.removeItem("auth_token")
      localStorage.removeItem("user_data")

      // Redirect to login if not already on auth page
      if (!window.location.pathname.startsWith("/auth")) {
        window.location.href = "/auth/signin"
      }
    }

    // Try to get error message from response
      let errorMessage;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || `API error: ${response.status}`;
      } catch (e) {
        errorMessage = `API error: ${response.status}`;
      }
      throw new Error(`Error fetching ${options.method || 'GET'} ${url}: ${errorMessage}`);
    }
    return response.json();
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error in fetchAPI: ${error.message}`, { endpoint, options });
    } else {
      console.error(`Unknown error in fetchAPI`, { endpoint, options, error });
    }
    throw error;
  }
}

/**
 * Crime data API functions
 */
export const crimeAPI = {
  // Get crimes with optional filtering
  getCrimes: async (params: {
    type?: string
    location?: string
    start_date?: string
    end_date?: string
    severity?: string
    limit?: number
  }) => {
    const queryParams = new URLSearchParams()

    if (params.type) queryParams.append("type", params.type)
    if (params.location) queryParams.append("location", params.location)
    if (params.start_date) queryParams.append("start_date", params.start_date)
    if (params.end_date) queryParams.append("end_date", params.end_date)
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
  getStats: async (
    params: {
      location?: string
      start_date?: string
      end_date?: string
    } = {},
  ) => {
    const queryParams = new URLSearchParams()

    if (params.location) queryParams.append("location", params.location)
    if (params.start_date) queryParams.append("start_date", params.start_date)
    if (params.end_date) queryParams.append("end_date", params.end_date)

    return fetchAPI<{
      stats: any[]
      period: { start: string; end: string }
    }>(`/crimes/stats?${queryParams.toString()}`)
  },

  // Get crime trends over time
  getTrends: async (
    params: {
      location?: string
      start_date?: string
      end_date?: string
    } = {},
  ) => {
    const queryParams = new URLSearchParams()

    if (params.location) queryParams.append("location", params.location)
    if (params.start_date) queryParams.append("start_date", params.start_date)
    if (params.end_date) queryParams.append("end_date", params.end_date)

    return fetchAPI<{
      trends: any[]
      period: { start: string; end: string }
    }>(`/crimes/trends?${queryParams.toString()}`)
  },

  // Get heatmap data
  getHeatmapData: async (
    params: {
      type?: string
      location?: string
      start_date?: string
      end_date?: string
      days?: number
    } = {},
  ) => {
    const queryParams = new URLSearchParams()

    if (params.type) queryParams.append("type", params.type)
    if (params.location) queryParams.append("location", params.location)
    if (params.start_date) queryParams.append("start_date", params.start_date)
    if (params.end_date) queryParams.append("end_date", params.end_date)
    if (params.days) queryParams.append("days", params.days.toString())

    return fetchAPI<{
      heatmap_data: any[]
      total_points: number
    }>(`/crimes/heatmap?${queryParams.toString()}`)
  },

  // Add method to fetch police station data
  getPoliceStations: async () => {
    return fetchAPI<{
      stations: {
        name: string
        address: string
        lat: number
        lng: number
      }[]
    }>("/police-stations")
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
  getAlerts: async () => {
    return fetchAPI<{
      alerts: any[]
      total: number
    }>("/alerts")
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
