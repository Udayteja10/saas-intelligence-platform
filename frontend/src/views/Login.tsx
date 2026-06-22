import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, Mail, ArrowRight, Sparkles } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid email or password credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleMockGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      // Mock Google Profile details
      const googleMockEmails = [
        'eval.admin@technova.com',
        'eval.john@acme.com',
        'eval.ceo@startupx.com'
      ];
      const randomEmail = googleMockEmails[Math.floor(Math.random() * googleMockEmails.length)];
      const mockName = randomEmail.split('@')[0].replace('.', ' ').toUpperCase();
      
      await googleLogin(randomEmail, mockName);
      navigate('/dashboard');
    } catch (err: any) {
      setError('Mock Google login failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans transition-colors duration-200">
      {/* Decorative blurred circles for premium depth */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/5 dark:bg-indigo-500/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/5 dark:bg-indigo-500/10 rounded-full blur-[100px]" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <div className="mx-auto h-12 w-12 rounded-2xl bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center pulse-glow-indigo">
          <Sparkles className="w-6 h-6 text-white animate-float" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Welcome to SubTrack AI
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">
          Or{' '}
          <Link to="/register" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline transition-all">
            register a new organization workspace
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="glass-panel py-8 px-4 border border-slate-200 dark:border-slate-800/80 shadow-xl dark:shadow-2xl sm:rounded-2xl sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 p-3.5 rounded-xl text-xs flex gap-2">
                <Shield className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Corporate Email Address
              </label>
              <div className="mt-2 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <Mail className="w-4.5 h-4.5" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="glass-input pl-10 block w-full px-4 py-3 rounded-xl sm:text-sm"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Password
              </label>
              <div className="mt-2 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <Lock className="w-4.5 h-4.5" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass-input pl-10 block w-full px-4 py-3 rounded-xl sm:text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <label htmlFor="remember-me" className="ml-2 text-slate-500 dark:text-slate-400 font-medium">
                  Remember me
                </label>
              </div>

              <div className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">
                Forgot password?
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white dark:text-slate-950 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white focus:outline-none transition-all disabled:opacity-50"
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>
            </div>
          </form>

          {/* Social Sign-In Divider */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-800" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-white dark:bg-[#0f172a] text-slate-400 dark:text-slate-500 font-medium rounded-full">Or evaluate instantly</span>
              </div>
            </div>

            <div className="mt-4">
              <button
                onClick={handleMockGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white/60 hover:bg-slate-50 dark:bg-slate-900/60 dark:hover:bg-slate-800/80 transition-all"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.48 14.97 1 12 1 7.28 1 3.26 3.74 1.28 7.72l3.87 3a7.16 7.16 0 0 1 6.85-5.68z"/>
                  <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.44h6.44a5.52 5.52 0 0 1-2.4 3.63v3.01h3.87c2.26-2.08 3.58-5.15 3.58-8.74z"/>
                  <path fill="#FBBC05" d="M5.15 14.72a7.17 7.17 0 0 1 0-4.44l-3.87-3a11.96 11.96 0 0 0 0 10.44l3.87-3z"/>
                  <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.92l-3.87-3.01a7.18 7.18 0 0 1-10.94-3.75l-3.87 3A11.96 11.96 0 0 0 12 23z"/>
                </svg>
                Sign In with Google (Mock Evaluation Account)
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
