import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Label } from '@/components/ui/Label';
import { Alert, AlertDescription } from '@/components/ui/Alert';

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

      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

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

  if (!user) return null;

  return (
    <Dialog open={show} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            <i className="bi bi-pencil-square mr-2"></i>
            Edit User
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="py-4 space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert variant="success">
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={user.email}
                disabled
                className="bg-gray-100"
              />
              <small className="text-gray-500 text-xs block">
                <i className="bi bi-lock mr-1"></i>Email cannot be changed
              </small>
            </div>

            <div className="space-y-2">
              <Label htmlFor="editName">Name</Label>
              <Input
                type="text"
                id="editName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="User's full name"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editRole">
                Role <span className="text-red-500">*</span>
              </Label>
              <Select
                value={role}
                onValueChange={(value) => {
                  setRole(value as 'admin' | 'staff');
                  if (value === 'admin') {
                    setAssignedNailTechId('');
                  }
                }}
                disabled={loading}
              >
                <SelectTrigger id="editRole">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {role === 'staff' && (
              <div className="space-y-2">
                <Label htmlFor="editAssignedNailTech">Assigned Nail Tech</Label>
                {loadingNailTechs ? (
                  <div className="px-4 py-2 bg-gray-100 rounded-2xl flex items-center">
                    <span className="spinner-border spinner-border-sm mr-2"></span>
                    <span className="text-gray-600 text-sm">Loading nail techs...</span>
                  </div>
                ) : (
                  <Select
                    value={assignedNailTechId}
                    onValueChange={setAssignedNailTechId}
                    disabled={loading}
                  >
                    <SelectTrigger id="editAssignedNailTech">
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {nailTechs.map((tech) => (
                        <SelectItem key={tech.id} value={tech.id}>
                          {tech.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <small className="text-gray-500 text-xs block">
                  Select a nail tech to assign to this staff member
                </small>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="editStatus">
                Status <span className="text-red-500">*</span>
              </Label>
              <Select
                value={status}
                onValueChange={(value) => setStatus(value as 'active' | 'inactive')}
                disabled={loading}
              >
                <SelectTrigger id="editStatus">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              disabled={loading}
              loading={loading}
            >
              <i className="bi bi-check-circle mr-2"></i>
              Update User
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
