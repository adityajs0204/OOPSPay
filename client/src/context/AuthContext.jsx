import { createContext, useContext, useState, useEffect } from 'react'
import { auth } from '../firebase'
import { onAuthStateChanged, signOut } from 'firebase/auth'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for demo user first
    const demoUser = localStorage.getItem('demoUser')
    if (demoUser) {
      setUser(JSON.parse(demoUser))
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const profile = localStorage.getItem('userProfile')
        setUser(profile ? JSON.parse(profile) : {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName
        })
      } else {
        setUser(null)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const demoLogin = (profile) => {
    localStorage.setItem('demoUser', JSON.stringify(profile))
    localStorage.setItem('userProfile', JSON.stringify(profile))
    setUser(profile)
  }

  const logout = async () => {
    localStorage.removeItem('demoUser')
    localStorage.removeItem('userProfile')
    localStorage.removeItem('authToken')
    try { await signOut(auth) } catch {}
    setUser(null)
  }

  const updateProfile = (profile) => {
    localStorage.setItem('userProfile', JSON.stringify(profile))
    setUser(profile)
  }

  return (
    <AuthContext.Provider value={{ user, loading, demoLogin, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
