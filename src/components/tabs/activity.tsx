import { ActivityItem } from "../../types/user";
import { History, ThumbsUp, Film, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

interface ActivityProps {
  activities: ActivityItem[];
  loading: boolean;
}

export function Activity({ activities, loading }: ActivityProps) {
  // Helper function to get icon for activity type
  const getActivityIcon = (type: string) => {
    switch(type) {
      case "watch":
        return <History className="w-5 h-5 text-blue-400" />;
      case "like":
        return <ThumbsUp className="w-5 h-5 text-green-400" />;
      case "add_to_list":
        return <Film className="w-5 h-5 text-purple-400" />;
      default:
        return <Calendar className="w-5 h-5 text-gray-400" />;
    }
  };
  
  // Helper function to format activity text
  const getActivityText = (activity: ActivityItem) => {
    switch(activity.type) {
      case "watch":
        return <>Watched <span className="font-medium">{activity.title}</span></>;
      case "like":
        return <>Liked <span className="font-medium">{activity.title}</span></>;
      case "add_to_list":
        return <>Added <span className="font-medium">{activity.title}</span> to watchlist</>;
      default:
        return <>Interacted with <span className="font-medium">{activity.title}</span></>;
    }
  };

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
              className="flex items-start gap-4 p-4 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition"
            >
              <div className="p-2 bg-zinc-700 rounded">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1">
                <p className="text-white">
                  {getActivityText(activity)}
                </p>
                <p className="text-sm text-gray-400">
                  {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                </p>
              </div>
              {activity.media_id && activity.media_type && (
                <Link 
                  to={`/info/${activity.media_type}/${activity.media_id}`}
                  className="text-sm text-red-500 hover:text-red-400 self-center"
                >
                  View
                </Link>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-zinc-800/30 rounded-lg">
          <History className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No activity yet</p>
          <p className="text-sm text-gray-500 mt-2">
            Your activity will appear here as you use MovieZone
          </p>
        </div>
      )}
    </div>
  );
}
