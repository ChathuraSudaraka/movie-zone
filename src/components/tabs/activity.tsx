import { ActivityItem } from "../../types/user";
import { History, ThumbsUp, Film } from "lucide-react";

interface ActivityProps {
  activities: ActivityItem[];
  loading: boolean;
}

export function Activity({ activities, loading }: ActivityProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-white mb-6">Recent Activity</h2>
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-red-500 border-t-transparent" />
        </div>
      ) : activities.length > 0 ? (
        <div className="space-y-4">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-4 p-4 bg-zinc-800/50 rounded-lg"
            >
              <div className="p-2 bg-zinc-700 rounded">
                {activity.type === "watch" && (
                  <History className="w-5 h-5 text-blue-400" />
                )}
                {activity.type === "like" && (
                  <ThumbsUp className="w-5 h-5 text-green-400" />
                )}
                {activity.type === "add_to_list" && (
                  <Film className="w-5 h-5 text-purple-400" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-white">
                  {activity.type === "watch" && "Watched"}
                  {activity.type === "like" && "Liked"}
                  {activity.type === "add_to_list" && "Added to list"}{" "}
                  <span className="font-medium">{activity.title}</span>
                </p>
                <p className="text-sm text-gray-400">
                  {new Date(activity.timestamp).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-400 text-center py-8">No recent activity</p>
      )}
    </div>
  );
}
