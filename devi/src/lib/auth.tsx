"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { api } from "@/lib/api"

interface User {
  id: string
  username: string
  role: "admin" | "operator" | "viewer"
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: async () => {},
  logout: () => {},
  loading: true,
})

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem("devi_token")
    const storedUser = localStorage.getItem("devi_user")
    if (stored && storedUser) {
      setToken(stored)
      setUser(JSON.parse(storedUser))
      api.defaults.headers.common["Authorization"] = `Bearer ${stored}`
    }
    setLoading(false)
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    const res = await api.post("/auth/login", { username, password })
    const { user: u, token: t, refreshToken } = res.data.data
    localStorage.setItem("devi_token", t)
    localStorage.setItem("devi_user", JSON.stringify(u))
    localStorage.setItem("devi_refresh", refreshToken)
    api.defaults.headers.common["Authorization"] = `Bearer ${t}`
    setToken(t)
    setUser(u)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem("devi_token")
    localStorage.removeItem("devi_user")
    localStorage.removeItem("devi_refresh")
    delete api.defaults.headers.common["Authorization"]
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
