import { Settings, Monitor, Volume2, Globe } from 'lucide-react';
import { UserPreferences } from '@/types/user';

interface PreferencesProps {
  preferences: UserPreferences;
  updatePreferences: (newPrefs: Partial<UserPreferences>) => Promise<void>;
}

export function Preferences({ preferences, updatePreferences }: PreferencesProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-zinc-800">
        <Settings className="w-6 h-6 text-red-500" />
        <h2 className="text-xl font-semibold text-white">Preferences</h2>
      </div>

      {/* Playback Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-white flex items-center gap-2">
          <Monitor className="w-5 h-5" />
          Playback Settings
        </h3>
        <div className="grid gap-4">
          <div className="p-4 bg-zinc-800/50 rounded-lg">
            <label className="block text-white mb-2">
              Default Playback Quality
            </label>
            <select
              value={preferences.defaultPlaybackQuality}
              onChange={(e) =>
                updatePreferences({
                  defaultPlaybackQuality: e.target.value as any,
                })
              }
              className="w-full bg-zinc-700 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="auto">Auto</option>
              <option value="720p">720p</option>
              <option value="1080p">1080p</option>
              <option value="4k">4K</option>
            </select>
          </div>

          <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg">
            <label className="text-white">Autoplay Trailers</label>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.autoplayTrailers}
                onChange={(e) =>
                  updatePreferences({
                    autoplayTrailers: e.target.checked,
                  })
                }
                className="sr-only peer"
              />
              <div
                className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer 
                peer-checked:after:translate-x-full peer-checked:after:border-white 
                after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
                after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all 
                peer-checked:bg-red-600"
              ></div>
            </label>
          </div>
        </div>
      </div>

      {/* Language Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-white flex items-center gap-2">
          <Globe className="w-5 h-5" />
          Language & Region
        </h3>
        {/* ...existing language settings... */}
      </div>
    </div>
  );
}
