import React, { useState, useEffect } from 'react';

interface NailTech {
  id: string;
  name: string;
}

interface EditUserModalProps {
  show: boolean;
  onHide: () => void;
  onUserUpdated: () => void;
  user: {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'staff';
    assignedNailTechId?: string | null;
    status: 'active' | 'inactive';
  } | null;
}

export default function EditUserModal({ show, onHide, onUserUpdated, user }: EditUserModalProps) {
  const [name, setName] = useState('');
  const [role, setRole] = useState<'admin' | 'staff'>('admin');
  const [assignedNailTechId, setAssignedNailTechId] = useState<string>('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [nailTechs, setNailTechs] = useState<NailTech[]>([]);
  const [loadingNailTechs, setLoadingNailTechs] = useState(false);

  // Load nail techs
  useEffect(() => {
    if (show) {
      fetchNailTechs();
    }
  }, [show]);

  // Populate form when user changes
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setRole(user.role || 'admin');
      setAssignedNailTechId(user.assignedNailTechId || '');
      setStatus(user.status || 'active');
      setError('');
      setSuccess('');
    }
  }, [user]);

  const fetchNailTechs = async () => {
    try {
      setLoadingNailTechs(true);
      const response = await fetch('/api/nail-techs?activeOnly=true');
      const data = await response.json();
      if (response.ok && data.nailTechs) {
        setNailTechs(data.nailTechs);
      }
    } catch (err) {
      console.error('Error fetching nail techs:', err);
    } finally {
      setLoadingNailTechs(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const updateData: any = {
        role,
        status,
      };

      // Only include name if it's not empty
      if (name && name.trim()) {
        updateData.name = name.trim();
      }

      // Handle assignedNailTechId
      if (role === 'staff') {
        updateData.assignedNailTechId = assignedNailTechId || null;
      } else {
        updateData.assignedNailTechId = null;
      }

      console.log('Sending update request:', { userId: user.id, updateData });

      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      console.log('Update response:', { status: response.status, data });

      if (!response.ok) {
        setError(data.error || 'Failed to update user');
        setLoading(false);
        return;
      }

      setSuccess('User updated successfully!');
      
      // Notify parent and close modal after a delay
      setTimeout(() => {
        onUserUpdated();
        onHide();
        setSuccess('');
      }, 1500);
    } catch (error: any) {
      console.error('Error updating user:', error);
      setError(error.message || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError('');
      setSuccess('');
      onHide();
    }
  };

  if (!show || !user) return null;

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
          style={{ maxWidth: '500px', margin: '1rem auto', position: 'relative', width: '100%' }} 
          role="document" 
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-content" style={{ borderRadius: '12px', border: '1px solid #e0e0e0', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' }}>
            <div className="modal-header" style={{ borderBottom: '1px solid #e0e0e0', padding: '1.25rem 1.5rem', backgroundColor: '#ffffff' }}>
              <h5 className="modal-title" style={{ fontWeight: 600, color: '#212529', fontSize: '1.125rem', margin: 0 }}>
                <i className="bi bi-pencil-square me-2" style={{ fontSize: '1rem' }}></i>
                Edit User
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={handleClose}
                aria-label="Close"
                disabled={loading}
                style={{ fontSize: '0.875rem', opacity: loading ? 0.5 : 1 }}
              ></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ padding: '1.5rem', backgroundColor: '#ffffff' }}>
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
                  <label className="form-label" style={{ fontWeight: 500, color: '#495057', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                    Email
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    value={user.email}
                    disabled
                    style={{ 
                      borderRadius: '8px', 
                      fontSize: '0.875rem', 
                      padding: '0.75rem', 
                      backgroundColor: '#f8f9fa',
                      borderColor: '#e0e0e0',
                      color: '#6c757d'
                    }}
                  />
                  <small className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                    <i className="bi bi-lock me-1"></i>Email cannot be changed
                  </small>
                </div>

                <div className="mb-3">
                  <label htmlFor="editName" className="form-label" style={{ fontWeight: 500, color: '#495057', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                    Name
                  </label>
                  <input
                    type="text"
                    id="editName"
                    className="form-control"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="User's full name"
                    disabled={loading}
                    style={{ 
                      borderRadius: '8px', 
                      fontSize: '0.875rem', 
                      padding: '0.75rem',
                      borderColor: '#ced4da'
                    }}
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="editRole" className="form-label" style={{ fontWeight: 500, color: '#495057', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                    Role <span className="text-danger">*</span>
                  </label>
                  <select
                    id="editRole"
                    className="form-select"
                    value={role}
                    onChange={(e) => {
                      setRole(e.target.value as 'admin' | 'staff');
                      if (e.target.value === 'admin') {
                        setAssignedNailTechId('');
                      }
                    }}
                    disabled={loading}
                    style={{ 
                      borderRadius: '8px', 
                      fontSize: '0.875rem', 
                      padding: '0.75rem',
                      borderColor: '#ced4da',
                      cursor: loading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <option value="admin">Admin</option>
                    <option value="staff">Staff</option>
                  </select>
                </div>

                {role === 'staff' && (
                  <div className="mb-3">
                    <label htmlFor="editAssignedNailTech" className="form-label" style={{ fontWeight: 500, color: '#495057', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                      Assigned Nail Tech
                    </label>
                    {loadingNailTechs ? (
                      <div className="form-control d-flex align-items-center" style={{ borderRadius: '8px', padding: '0.75rem', borderColor: '#ced4da', backgroundColor: '#f8f9fa' }}>
                        <span className="spinner-border spinner-border-sm me-2" style={{ width: '1rem', height: '1rem' }}></span>
                        <span style={{ fontSize: '0.875rem', color: '#6c757d' }}>Loading nail techs...</span>
                      </div>
                    ) : (
                      <select
                        id="editAssignedNailTech"
                        className="form-select"
                        value={assignedNailTechId}
                        onChange={(e) => setAssignedNailTechId(e.target.value)}
                        disabled={loading}
                        style={{ 
                          borderRadius: '8px', 
                          fontSize: '0.875rem', 
                          padding: '0.75rem',
                          borderColor: '#ced4da',
                          cursor: loading ? 'not-allowed' : 'pointer'
                        }}
                      >
                        <option value="">None</option>
                        {nailTechs.map((tech) => (
                          <option key={tech.id} value={tech.id}>
                            {tech.name}
                          </option>
                        ))}
                      </select>
                    )}
                    <small className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                      Select a nail tech to assign to this staff member
                    </small>
                  </div>
                )}

                <div className="mb-0">
                  <label htmlFor="editStatus" className="form-label" style={{ fontWeight: 500, color: '#495057', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                    Status <span className="text-danger">*</span>
                  </label>
                  <select
                    id="editStatus"
                    className="form-select"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
                    disabled={loading}
                    style={{ 
                      borderRadius: '8px', 
                      fontSize: '0.875rem', 
                      padding: '0.75rem',
                      borderColor: '#ced4da',
                      cursor: loading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer" style={{ borderTop: '1px solid #e0e0e0', padding: '1rem 1.5rem', backgroundColor: '#ffffff' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleClose}
                  disabled={loading}
                  style={{ 
                    borderRadius: '8px', 
                    fontSize: '0.875rem', 
                    padding: '0.5rem 1rem', 
                    fontWeight: 500,
                    borderColor: '#ced4da',
                    backgroundColor: '#ffffff',
                    color: '#495057'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-dark"
                  disabled={loading}
                  style={{ 
                    borderRadius: '8px', 
                    fontSize: '0.875rem', 
                    padding: '0.5rem 1rem', 
                    fontWeight: 500, 
                    backgroundColor: loading ? '#6c757d' : '#212529', 
                    borderColor: loading ? '#6c757d' : '#212529',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {loading ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                        style={{ width: '1rem', height: '1rem' }}
                      ></span>
                      Updating...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-circle me-2"></i>
                      Update User
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
