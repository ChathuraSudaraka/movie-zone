import { useState } from 'react';
import { Shield, Key, Lock } from 'lucide-react';
import { supabase } from '../../config/supabase';
import toast from 'react-hot-toast';

export function Security() {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
    
    setIsLoading(true);

    try {
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
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white focus:border-red-500 focus:ring-red-500"
                placeholder="Enter new password"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white focus:border-red-500 focus:ring-red-500"
                placeholder="Confirm new password"
              />
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
      </div>
    </div>
  );
}
