import { ActivityItem } from "../../types/user";
import {
  History,
  ThumbsUp,
  Film,
  Calendar,
  MessageCircle,
  Star,
  BookmarkPlus,
  Share2,
  Eye,
  ActivityIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { useState, useEffect } from "react";

interface ActivityProps {
  activities: ActivityItem[];
  loading: boolean;
}

export function Activity({ activities, loading }: ActivityProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Helper function to get icon for activity type
  const getActivityIcon = (type: string) => {
    switch (type) {
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
    switch (activity.type) {
      case "watch":
        return (
          <>
            Watched <span className="font-medium">{activity.title}</span>
          </>
        );
      case "like":
        return (
          <>
            Liked <span className="font-medium">{activity.title}</span>
          </>
        );
      case "add_to_list":
        return (
          <>
            Added <span className="font-medium">{activity.title}</span> to
            watchlist
          </>
        );
      case "rate":
        const rating = activity.metadata?.rating || "5";
        return (
          <>
            Rated <span className="font-medium">{activity.title}</span> {rating}
            /10
          </>
        );
      case "review":
        return (
          <>
            Reviewed <span className="font-medium">{activity.title}</span>
          </>
        );
      case "share":
        return (
          <>
            Shared <span className="font-medium">{activity.title}</span>
          </>
        );
      case "view":
        return (
          <>
            Viewed details for{" "}
            <span className="font-medium">{activity.title}</span>
          </>
        );
      case "finish_series":
        return (
          <>
            Finished watching{" "}
            <span className="font-medium">{activity.title}</span> series
          </>
        );
      default:
        return (
          <>
            Interacted with{" "}
            <span className="font-medium">{activity.title}</span>
          </>
        );
    }
  };

  // Simplified page change handler without activity tracking
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Reset to page 1 when activities change
  useEffect(() => {
    setCurrentPage(1);
  }, [activities.length]);

  // Calculate pagination
  const totalPages = Math.ceil(activities.length / itemsPerPage);

  // Get current page activities
  const currentActivities = activities.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Group activities by date for better organization
  const groupActivitiesByDate = () => {
    const groups: { [key: string]: ActivityItem[] } = {};

    currentActivities.forEach((activity) => {
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
      <div className="flex items-center gap-3 pb-4 border-b border-zinc-800">
        <ActivityIcon className="w-6 h-6 text-red-500" />
        <h2 className="text-xl font-semibold text-white">Activity History</h2>
      </div>
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-red-500 border-t-transparent" />
        </div>
      ) : activities.length > 0 ? (
        <>
          <div className="space-y-6">
            {Object.keys(activityGroups).map((date) => (
              <div key={date} className="space-y-4">
                <h3 className="text-sm font-medium text-gray-400 px-2">
                  {date}
                </h3>
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
                          {formatDistanceToNow(new Date(activity.timestamp), {
                            addSuffix: true,
                          })}
                        </p>
                        {activity.type === "review" &&
                          activity.metadata?.content && (
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center mt-8 space-x-2">
              <button
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-zinc-800 text-white rounded-md hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Previous
              </button>

              <div className="flex space-x-1">
                {/* First page */}
                {currentPage > 2 && (
                  <button
                    onClick={() => handlePageChange(1)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm bg-zinc-800 text-gray-400 hover:bg-zinc-700"
                  >
                    1
                  </button>
                )}

                {/* Ellipsis if needed */}
                {currentPage > 3 && (
                  <span className="w-8 h-8 flex items-center justify-center text-gray-500">
                    ...
                  </span>
                )}

                {/* Page before current */}
                {currentPage > 1 && (
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm bg-zinc-800 text-gray-400 hover:bg-zinc-700"
                  >
                    {currentPage - 1}
                  </button>
                )}

                {/* Current page */}
                <button className="w-8 h-8 rounded-full flex items-center justify-center text-sm bg-red-600 text-white">
                  {currentPage}
                </button>

                {/* Page after current */}
                {currentPage < totalPages && (
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm bg-zinc-800 text-gray-400 hover:bg-zinc-700"
                  >
                    {currentPage + 1}
                  </button>
                )}

                {/* Ellipsis if needed */}
                {currentPage < totalPages - 2 && (
                  <span className="w-8 h-8 flex items-center justify-center text-gray-500">
                    ...
                  </span>
                )}

                {/* Last page */}
                {currentPage < totalPages - 1 && (
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm bg-zinc-800 text-gray-400 hover:bg-zinc-700"
                  >
                    {totalPages}
                  </button>
                )}
              </div>

              <button
                onClick={() =>
                  handlePageChange(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-1 bg-zinc-800 text-white rounded-md hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Next
              </button>
            </div>
          )}

          <div className="text-center text-sm text-gray-500 mt-4">
            Showing{" "}
            {Math.min(activities.length, (currentPage - 1) * itemsPerPage + 1)}-
            {Math.min(currentPage * itemsPerPage, activities.length)} of{" "}
            {activities.length} activities
          </div>
        </>
      ) : (
        <div className="text-center py-12 bg-zinc-800/30 rounded-lg">
          <History className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No activity yet</p>
          <p className="text-sm text-gray-500 mt-2">
            Your activity will appear here as you watch movies, add to your
            watchlist, and more
          </p>
        </div>
      )}
    </div>
  );
}
