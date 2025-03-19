import { Bell, Mail, Film, Star, Clock } from 'lucide-react';

export function Notifications() {
  const notificationTypes = [
    { id: 'email', label: 'Email Notifications', icon: Mail },
    { id: 'newReleases', label: 'New Releases', icon: Film },
    { id: 'recommendations', label: 'Recommendations', icon: Star },
    { id: 'watchlist', label: 'Watchlist Updates', icon: Clock },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-zinc-800">
        <Bell className="w-6 h-6 text-red-500" />
        <h2 className="text-xl font-semibold text-white">Notification Settings</h2>
      </div>

      <div className="grid gap-4">
        {notificationTypes.map((type) => (
          <div
            key={type.id}
            className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <type.icon className="w-5 h-5 text-gray-400" />
              <span className="text-white">{type.label}</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-zinc-700 rounded-full peer peer-checked:bg-red-600
                           peer-checked:after:translate-x-full after:content-[''] after:absolute
                           after:top-0.5 after:left-[2px] after:bg-white after:rounded-full
                           after:h-5 after:w-5 after:transition-all" />
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
