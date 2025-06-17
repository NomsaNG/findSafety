/**
 * Authentication service for FindSafety
 * Handles user authentication and token management
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || " https://findsafety-302256036189.us-central1.run.app"

/**
 * Check if localStorage is available (browser environment)
 */
const isBrowser = typeof window !== "undefined"

/**
 * Generic fetch wrapper with authentication
 */
async function fetchWithAuth<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`

  // Get token from localStorage
  const token = localStorage.getItem("auth_token")

  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  if (!response.ok) {
    // Handle authentication errors
    if (response.status === 401) {
      // Token expired or invalid, clear local storage
      localStorage.removeItem("auth_token")
      localStorage.removeItem("user_data")

      // Redirect to login if not already on auth page
      if (!window.location.pathname.startsWith("/auth")) {
        window.location.href = "/auth/signin"
      }
    }

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
 * Authentication API functions
 */
export const authAPI = {
  // Register new user
  register: async (email: string, password: string, firstName: string, lastName: string) => {
    return fetchWithAuth<{
      user: any
      token: string
      message: string
    }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
        first_name: firstName,
        last_name: lastName,
      }),
    })
  },

  // Login user
  login: async (email: string, password: string) => {
    return fetchWithAuth<{
      user: any
      token: string
      message: string
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
      }),
    })
  },

  // Get user profile
  getProfile: async () => {
    return fetchWithAuth<{
      user: any
    }>("/auth/profile")
  },

  // Update user profile
  updateProfile: async (profileData: any) => {
    return fetchWithAuth<{
      user: any
      message: string
    }>("/auth/profile", {
      method: "PUT",
      body: JSON.stringify(profileData),
    })
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    if (!isBrowser) return false
    const token = localStorage.getItem("auth_token")
    const userData = localStorage.getItem("user_data")
    return !!(token && userData)
  },

  // Get current user data
  getCurrentUser: () => {
    if (!isBrowser) return null
    const userData = localStorage.getItem("user_data")
    return userData ? JSON.parse(userData) : null
  },

  // Logout user
  logout: () => {
    if (isBrowser) {
      localStorage.removeItem("auth_token")
      localStorage.removeItem("user_data")
      window.location.href = "/auth/signin"
    }
  },
}

/**
 * Auth guard hook for protecting routes
 */
export const useAuthGuard = () => {
  const isAuthenticated = authAPI.isAuthenticated()

  if (!isAuthenticated && typeof window !== "undefined") {
    // Redirect to login if not authenticated
    window.location.href = "/auth/signin"
  }

  return isAuthenticated
}
