import { ActivityItem } from "../../types/user";
import { History, ThumbsUp, Film, Calendar, MessageCircle, Star, BookmarkPlus, Share2, Eye } from "lucide-react";
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
        return <BookmarkPlus className="w-5 h-5 text-purple-400" />;
      case "rate":
        return <Star className="w-5 h-5 text-yellow-400" />;
      case "review":
        return <MessageCircle className="w-5 h-5 text-orange-400" />;
      case "share":
        return <Share2 className="w-5 h-5 text-indigo-400" />;
      case "view":
        return <Eye className="w-5 h-5 text-teal-400" />;
      case "finish_series":
        return <Film className="w-5 h-5 text-pink-400" />;
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
      case "rate":
        const rating = activity.metadata?.rating || "5";
        return <>Rated <span className="font-medium">{activity.title}</span> {rating}/10</>;
      case "review":
        return <>Reviewed <span className="font-medium">{activity.title}</span></>;
      case "share":
        return <>Shared <span className="font-medium">{activity.title}</span></>;
      case "view":
        return <>Viewed details for <span className="font-medium">{activity.title}</span></>;
      case "finish_series":
        return <>Finished watching <span className="font-medium">{activity.title}</span> series</>;
      default:
        return <>Interacted with <span className="font-medium">{activity.title}</span></>;
    }
  };

  // Group activities by date for better organization
  const groupActivitiesByDate = () => {
    const groups: {[key: string]: ActivityItem[]} = {};
    
    activities.forEach(activity => {
      const date = new Date(activity.timestamp).toLocaleDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(activity);
    });
    
    return groups;
  };

  const activityGroups = groupActivitiesByDate();
  
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-white mb-6">Activity History</h2>
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-red-500 border-t-transparent" />
        </div>
      ) : activities.length > 0 ? (
        <div className="space-y-6">
          {Object.keys(activityGroups).map((date) => (
            <div key={date} className="space-y-4">
              <h3 className="text-sm font-medium text-gray-400 px-2">{date}</h3>
              <div className="space-y-2">
                {activityGroups[date].map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-4 p-4 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition"
                  >
                    <div className="p-2 bg-zinc-700 rounded flex-shrink-0">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1">
                      <p className="text-white">
                        {getActivityText(activity)}
                      </p>
                      <p className="text-sm text-gray-400">
                        {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                      </p>
                      {activity.type === 'review' && activity.metadata?.content && (
                        <p className="mt-2 text-sm text-gray-300 bg-zinc-800 p-2 rounded border-l-2 border-orange-400">
                          "{activity.metadata.content}"
                        </p>
                      )}
                    </div>
                    {activity.media_id && activity.media_type && (
                      <Link 
                        to={`/info/${activity.media_type}/${activity.media_id}`}
                        className="text-sm text-red-500 hover:text-red-400 self-center flex-shrink-0"
                      >
                        View
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-zinc-800/30 rounded-lg">
          <History className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No activity yet</p>
          <p className="text-sm text-gray-500 mt-2">
            Your activity will appear here as you watch movies, add to your watchlist, and more
          </p>
        </div>
      )}
    </div>
  );
}
