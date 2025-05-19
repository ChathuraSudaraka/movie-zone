import { useState } from 'react';
import { Shield, Key, Lock, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../config/supabase';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

export function Security() {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { deleteAccount, user } = useAuth();

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    if (!user?.email) {
      toast.error('User email not found. Please re-login.');
      return;
    }
    
    setIsLoading(true);

    try {
      // Re-authenticate user with current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: oldPassword,
      });

      if (signInError) {
        toast.error('Current password is incorrect');
        setIsLoading(false);
        return;
      }

      // If re-auth successful, update password
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
      toast.success('Password updated successfully');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error updating password:', error);
      toast.error('Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccountClick = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") {
      toast.error('Please type DELETE to confirm account deletion');
      return;
    }

    try {
      await deleteAccount();
      // Navigation happens in the deleteAccount function
    } catch (error) {
      console.error('Error in account deletion:', error);
    } finally {
      setShowDeleteConfirm(false);
      setDeleteConfirmText('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-zinc-800">
        <Shield className="w-6 h-6 text-red-500" />
        <h2 className="text-xl font-semibold text-white">Security Settings</h2>
      </div>

      <div className="grid gap-6">
        {/* Password Change Section */}
        <div className="bg-zinc-900/50 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Key className="w-5 h-5 text-gray-400" />
            <h3 className="text-lg font-medium text-white">Change Password</h3>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">
                Current Password
              </label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white focus:border-red-500 focus:ring-red-500"
                placeholder="Enter your current password"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white focus:border-red-500 focus:ring-red-500"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  tabIndex={-1}
                >
                  {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white focus:border-red-500 focus:ring-red-500"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>

        {/* Two-Factor Authentication */}
        <div className="bg-zinc-900/50 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-gray-400" />
              <h3 className="text-lg font-medium text-white">Two-Factor Authentication</h3>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-zinc-700 rounded-full peer peer-checked:bg-red-600
                           peer-checked:after:translate-x-full after:content-[''] after:absolute
                           after:top-0.5 after:left-[2px] after:bg-white after:rounded-full
                           after:h-5 after:w-5 after:transition-all" />
            </label>
          </div>
          <p className="text-gray-400 mt-4">
            Enable two-factor authentication for an extra layer of security. When enabled, you'll need to provide a verification code in addition to your password when signing in.
          </p>
        </div>

        {/* Delete Account Section */}
        <div className="bg-zinc-900/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h3 className="text-lg font-medium text-white">Delete Account</h3>
            </div>
          </div>
          
          <p className="text-gray-400 mb-4">
            This action permanently deletes your account and all associated data. This cannot be undone.
          </p>
          
          <button
            onClick={handleDeleteAccountClick}
            className="px-4 py-2 bg-red-600/20 text-red-500 border border-red-600/20 rounded-md hover:bg-red-600/30 transition"
          >
            Delete My Account
          </button>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 text-red-500 mb-4">
              <AlertTriangle className="w-6 h-6" />
              <h2 className="text-xl font-bold">Delete Account</h2>
            </div>
            
            <p className="text-gray-300 mb-4">
              This will permanently delete your account, including:
            </p>
            
            <ul className="list-disc list-inside text-gray-400 mb-6 space-y-1">
              <li>Your profile and personal information</li>
              <li>Your watch history</li>
              <li>Your watchlist</li>
              <li>Your preferences and settings</li>
            </ul>
            
            <p className="text-gray-300 mb-4 font-medium">
              Type DELETE to confirm this irreversible action:
            </p>
            
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white mb-6"
              placeholder="Type DELETE here"
            />
            
            <div className="flex justify-end gap-4">
              <button 
                className="px-4 py-2 bg-zinc-800 text-white rounded-lg"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button 
                className="px-4 py-2 bg-red-600 text-white rounded-lg disabled:opacity-50"
                disabled={deleteConfirmText !== 'DELETE'}
                onClick={confirmDeleteAccount}
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
