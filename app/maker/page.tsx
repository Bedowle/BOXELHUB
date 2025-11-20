'use client'
import { useState, useEffect, useCallback } from 'react'
import { useDebounce } from 'use-debounce'
import { useRouter } from 'next/navigation'

const RegisterForm = () => {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null)

  // Debounce para evitar demasiadas llamadas API
  const [debouncedUsername] = useDebounce(username, 500)
  const [debouncedEmail] = useDebounce(email, 500)

  const checkUsername = useCallback(async (username: string) => {
    if (username.length < 3) {
      setUsernameAvailable(null)
      return
    }
    try {
      const response = await fetch('/api/check-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      })
      const { available } = await response.json()
      setUsernameAvailable(available)
    } catch (error) {
      console.error('Error checking username:', error)
    }
  }, [])

  const checkEmail = useCallback(async (email: string) => {
    if (!email.includes('@')) {
      setEmailAvailable(null)
      return
    }
    try {
      const response = await fetch('/api/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const { available } = await response.json()
      setEmailAvailable(available)
    } catch (error) {
      console.error('Error checking email:', error)
    }
  }, [])

  useEffect(() => {
    if (debouncedUsername) checkUsername(debouncedUsername)
  }, [debouncedUsername, checkUsername])

  useEffect(() => {
    if (debouncedEmail) checkEmail(debouncedEmail)
  }, [debouncedEmail, checkEmail])

  // 🚀 Aquí está lo que faltaba: enviar datos al backend
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    })

    const data = await res.json()

    if (data.success) {
      router.push('/maker/test') // redirige a tu página de prueba
    } else {
      alert('Error al registrar: ' + data.error)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-6 bg-white rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-4">Registro</h1>

      <input
        type="text"
        placeholder="Nombre de usuario"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="w-full px-4 py-2 mb-4 border rounded"
      />
      {usernameAvailable !== null && (
        <p className={usernameAvailable ? 'text-green-600' : 'text-red-600'}>
          {usernameAvailable ? 'Usuario disponible' : 'Usuario no disponible'}
        </p>
      )}

      <input
        type="email"
        placeholder="Correo electrónico"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full px-4 py-2 mb-4 border rounded"
      />
      {emailAvailable !== null && (
        <p className={emailAvailable ? 'text-green-600' : 'text-red-600'}>
          {emailAvailable ? 'Correo disponible' : 'Correo no disponible'}
        </p>
      )}

      <input
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full px-4 py-2 mb-4 border rounded"
      />

      <button
        type="submit"
        className="w-full px-6 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-500"
      >
        Registrarse
      </button>
    </form>
  )
}

export default RegisterForm