import React, { useState } from 'react';

interface AddUserModalProps {
  show: boolean;
  onHide: () => void;
  onUserAdded: () => void;
}

type AuthMethod = 'google' | 'password';

export default function AddUserModal({ show, onHide, onUserAdded }: AddUserModalProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authMethod, setAuthMethod] = useState<AuthMethod>('google');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Validation
    if (!email) {
      setError('Email is required');
      setLoading(false);
      return;
    }

    if (authMethod === 'password') {
      if (!password) {
        setError('Password is required');
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        setLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }
    }

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          name: name || undefined,
          password: authMethod === 'password' ? password : undefined,
          authMethod,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create user');
        setLoading(false);
        return;
      }

      // Show appropriate success message
      if (data.emailSent) {
        setSuccess(data.message || 'User created successfully! Invitation email sent.');
      } else if (data.inviteLink) {
        // Email service not configured - show link
        setSuccess(
          `User created! Email service not configured. Invitation link: ${data.inviteLink}`
        );
      } else {
        setSuccess(data.message || 'User created successfully!');
      }
      
      // Reset form
      setEmail('');
      setName('');
      setPassword('');
      setConfirmPassword('');
      setAuthMethod('google');

      // Notify parent and close modal after a delay
      setTimeout(() => {
        onUserAdded();
        onHide();
        setSuccess('');
      }, data.inviteLink ? 5000 : 1500); // Longer delay if showing link
    } catch (error: any) {
      setError(error.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setEmail('');
      setName('');
      setPassword('');
      setConfirmPassword('');
      setAuthMethod('google');
      setError('');
      setSuccess('');
      onHide();
    }
  };

  if (!show) return null;

  return (
    <>
      <div
        className={`modal fade ${show ? 'show' : ''}`}
        style={{ 
          display: show ? 'flex' : 'none', 
          zIndex: 1055,
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        tabIndex={-1}
        role="dialog"
        onClick={(e) => {
          if (e.target === e.currentTarget && !loading) {
            handleClose();
          }
        }}
      >
        <div 
          className="modal-dialog modal-dialog-centered" 
          style={{ maxWidth: '500px', margin: '1rem auto', position: 'relative' }} 
          role="document" 
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-content" style={{ borderRadius: '12px', border: '1px solid #e0e0e0' }}>
            <div className="modal-header" style={{ borderBottom: '1px solid #e0e0e0', padding: '1.25rem 1.5rem' }}>
              <h5 className="modal-title" style={{ fontWeight: 600, color: '#212529', fontSize: '1.125rem', margin: 0 }}>
                Add New User
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={handleClose}
                aria-label="Close"
                disabled={loading}
                style={{ fontSize: '0.875rem' }}
              ></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ padding: '1.5rem' }}>
                {error && (
                  <div className="alert alert-danger d-flex align-items-center mb-3" role="alert" style={{ borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.875rem' }}>
                    <i className="bi bi-exclamation-circle me-2"></i>
                    <div style={{ fontSize: '0.875rem' }}>{error}</div>
                  </div>
                )}

                {success && (
                  <div className="alert alert-success d-flex align-items-center mb-3" role="alert" style={{ borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.875rem' }}>
                    <i className="bi bi-check-circle me-2"></i>
                    <div style={{ fontSize: '0.875rem' }}>{success}</div>
                  </div>
                )}

                <div className="mb-3">
                  <label htmlFor="authMethod" className="form-label" style={{ fontWeight: 500, color: '#495057', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                    Authentication Method <span className="text-danger">*</span>
                  </label>
                  <select
                    id="authMethod"
                    className="form-select"
                    value={authMethod}
                    onChange={(e) => {
                      setAuthMethod(e.target.value as AuthMethod);
                      setPassword('');
                      setConfirmPassword('');
                      setError('');
                    }}
                    disabled={loading}
                    style={{ borderRadius: '8px', fontSize: '0.875rem', padding: '0.75rem' }}
                  >
                    <option value="google">Google OAuth (Email Invite)</option>
                    <option value="password">Email & Password</option>
                  </select>
                  <small className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                    {authMethod === 'google'
                      ? 'User will receive an email invitation to sign in with Google'
                      : 'User will sign in with email and password'}
                  </small>
                </div>

                <div className="mb-3">
                  <label htmlFor="email" className="form-label" style={{ fontWeight: 500, color: '#495057', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                    Email Address <span className="text-danger">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="form-control"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    required
                    disabled={loading}
                    style={{ borderRadius: '8px', fontSize: '0.875rem', padding: '0.75rem' }}
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="name" className="form-label" style={{ fontWeight: 500, color: '#495057', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                    Name <span className="text-muted" style={{ fontSize: '0.75rem' }}>(Optional)</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    className="form-control"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="User's full name"
                    disabled={loading}
                    style={{ borderRadius: '8px', fontSize: '0.875rem', padding: '0.75rem' }}
                  />
                </div>

                {authMethod === 'password' && (
                  <>
                    <div className="mb-3">
                      <label htmlFor="password" className="form-label" style={{ fontWeight: 500, color: '#495057', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                        Password <span className="text-danger">*</span>
                      </label>
                      <input
                        type="password"
                        id="password"
                        className="form-control"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Minimum 6 characters"
                        required
                        minLength={6}
                        disabled={loading}
                        style={{ borderRadius: '8px', fontSize: '0.875rem', padding: '0.75rem' }}
                      />
                    </div>

                    <div className="mb-3">
                      <label htmlFor="confirmPassword" className="form-label" style={{ fontWeight: 500, color: '#495057', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                        Confirm Password <span className="text-danger">*</span>
                      </label>
                      <input
                        type="password"
                        id="confirmPassword"
                        className="form-control"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        required
                        minLength={6}
                        disabled={loading}
                        style={{ borderRadius: '8px', fontSize: '0.875rem', padding: '0.75rem' }}
                      />
                    </div>
                  </>
                )}

                {authMethod === 'google' && (
                  <div className="alert alert-info d-flex align-items-start mb-0" role="alert" style={{ borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.8125rem', backgroundColor: '#e7f3ff', borderColor: '#b3d9ff', color: '#004085' }}>
                    <i className="bi bi-info-circle me-2" style={{ marginTop: '0.125rem' }}></i>
                    <div style={{ lineHeight: '1.5' }}>
                      <strong style={{ fontSize: '0.8125rem' }}>Google OAuth:</strong>
                      <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                        User will receive an invitation email and can sign in with their Google account.
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer" style={{ borderTop: '1px solid #e0e0e0', padding: '1rem 1.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleClose}
                  disabled={loading}
                  style={{ borderRadius: '8px', fontSize: '0.875rem', padding: '0.5rem 1rem', fontWeight: 500 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-dark"
                  disabled={loading}
                  style={{ borderRadius: '8px', fontSize: '0.875rem', padding: '0.5rem 1rem', fontWeight: 500, backgroundColor: '#212529', borderColor: '#212529' }}
                >
                  {loading ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      Creating...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-person-plus me-2"></i>
                      {authMethod === 'google' ? 'Send Invite' : 'Create User'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {show && (
        <div
          className="modal-backdrop fade show"
          style={{ zIndex: 1050 }}
          onClick={!loading ? handleClose : undefined}
        ></div>
      )}
    </>
  );
}
