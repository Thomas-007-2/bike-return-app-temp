import React, { useState } from 'react'
import { supabase } from '../utils/supabase'
import { User, Mail, Lock, Loader } from 'lucide-react'
import i18n from '../utils/i18n'

const Auth = ({ onAuth }) => {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      let result
      if (isLogin) {
        result = await supabase.auth.signInWithPassword({
          email,
          password
        })
      } else {
        result = await supabase.auth.signUp({
          email,
          password
        })
      }

      if (result.error) {
        setError(result.error.message)
      } else {
        onAuth(result.data.user)
      }
    } catch (err) {
      setError(i18n.t('authError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{i18n.t('loginTitle')}</h1>
          <p className="text-gray-600 mt-2">
            {isLogin ? i18n.t('loginSubtitle') : i18n.t('registerSubtitle')}
          </p>
        </div>

        <div className="card">
          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {i18n.t('emailLabel')}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-10"
                  placeholder={i18n.t('emailPlaceholder')}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {i18n.t('passwordLabel')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-10"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center"
            >
              {loading ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                isLogin ? i18n.t('loginButton') : i18n.t('registerButton')
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              {isLogin 
                ? i18n.t('noAccount')
                : i18n.t('hasAccount')
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Auth