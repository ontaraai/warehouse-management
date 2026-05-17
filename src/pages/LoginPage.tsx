import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { Package, Mail, Lock } from 'lucide-react';
import { Navigate } from 'react-router-dom';

export const LoginPage: React.FC = () => {
  const { user, signInWithGoogle } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{ display: 'inline-flex', padding: '16px', background: 'var(--color-primary)', borderRadius: '16px', color: 'white', marginBottom: '16px' }}>
          <Package size={40} />
        </div>
        <h1 className="page-title">Warehouse Manager</h1>
        <p style={{ color: 'var(--color-text-muted)' }}>Secure & Reliable PWA</p>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: '24px', fontSize: '20px' }}>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
        
        {error && <div style={{ padding: '12px', background: '#fee2e2', color: 'var(--color-danger)', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              <input 
                type="email" 
                placeholder="Enter your email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '40px' }}
                required 
              />
            </div>
          </div>
          
          <div className="input-group">
            <label>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              <input 
                type="password" 
                placeholder="Enter your password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '40px' }}
                required 
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '8px' }}>
            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <div style={{ margin: '24px 0', display: 'flex', alignItems: 'center', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }}></div>
          <span style={{ padding: '0 12px', fontSize: '14px' }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }}></div>
        </div>

        <button onClick={signInWithGoogle} className="btn btn-outline" style={{ marginBottom: '16px' }}>
          <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
            <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
              <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 52.749 L -8.284 52.749 C -8.574 53.879 -9.184 54.819 -10.144 55.459 L -10.144 57.779 L -6.244 57.779 C -3.964 55.679 -3.264 52.519 -3.264 51.509 Z"/>
              <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.144 58.009 C -11.214 58.729 -12.564 59.159 -14.754 59.159 C -18.984 59.159 -22.564 56.329 -23.824 52.539 L -27.834 52.539 L -27.834 55.629 C -25.854 59.549 -20.654 63.239 -14.754 63.239 Z"/>
              <path fill="#FBBC05" d="M -23.824 52.539 C -24.144 51.589 -24.314 50.589 -24.314 49.539 C -24.314 48.489 -24.144 47.489 -23.824 46.539 L -23.824 43.449 L -27.834 43.449 C -28.684 45.149 -29.184 47.059 -29.184 49.039 C -29.184 51.019 -28.684 52.929 -27.834 54.629 L -23.824 52.539 Z"/>
              <path fill="#EA4335" d="M -14.754 39.839 C -12.984 39.839 -11.404 40.449 -10.154 41.649 L -6.744 38.239 C -8.804 36.319 -11.514 35.239 -14.754 35.239 C -20.654 35.239 -25.854 38.929 -27.834 42.849 L -23.824 45.939 C -22.564 42.149 -18.984 39.839 -14.754 39.839 Z"/>
            </g>
          </svg>
          Continue with Google
        </button>

        <p style={{ textAlign: 'center', fontSize: '14px', color: 'var(--color-text-muted)' }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button type="button" onClick={() => setIsLogin(!isLogin)} style={{ color: 'var(--color-primary)', fontWeight: '600' }}>
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  );
};
