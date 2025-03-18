import { Fragment, useEffect, useState, useMemo } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Bell, CalendarCheck, Film } from "lucide-react";
import axios from "@/utils/axios";
import { useAuth } from '../../context/AuthContext';

interface NotificationDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
  read: boolean;
  image: string | null;
  type: 'upcoming' | 'new_release';
  uniqueId?: string;
}

interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: 'movie' | 'tv';
  posterPath?: string;
  timestamp: string;
}

export function NotificationDialog({ isOpen, onClose }: NotificationDialogProps) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return; // Don't fetch if no user

      try {
        setLoading(true);
        // Fetch upcoming movies
        const upcomingRes = await axios.get('/movie/upcoming');
        const newReleasesRes = await axios.get('/movie/now_playing');

        const upcomingNotifications = upcomingRes.data.results.slice(0, 5).map((movie: any) => ({
          id: movie.id,
          title: 'Upcoming Release',
          message: `${movie.title} will be released on ${new Date(movie.release_date).toLocaleDateString()}`,
          time: `Release: ${new Date(movie.release_date).toLocaleDateString()}`,
          read: false,
          image: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
          type: 'upcoming' as const
        }));

        const newReleaseNotifications = newReleasesRes.data.results.slice(0, 5).map((movie: any) => ({
          id: movie.id,
          title: 'New Release',
          message: `${movie.title} is now available to watch`,
          time: `Released: ${new Date(movie.release_date).toLocaleDateString()}`,
          read: false,
          image: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
          type: 'new_release' as const
        }));

        setNotifications([...upcomingNotifications, ...newReleaseNotifications]);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && user) {
      fetchNotifications();
    }
  }, [isOpen, user]);

  const notificationItems = useMemo(() => {
    return notifications.map((item, index) => ({
      ...item,
      uniqueId: `${item.id}-${index}`, // Add unique identifier
    }));
  }, [notifications]);

  if (!user) return null; // Don't render anything if no user

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25" />
        </Transition.Child>

        {/* Desktop Version */}
        <div className="hidden md:block fixed right-0 top-[68px]">
          <div className="flex min-h-full items-start justify-end p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 -translate-y-4"
              enterTo="opacity-100 translate-y-0"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 -translate-y-4"
            >
              <Dialog.Panel className="w-[400px] max-w-md transform overflow-hidden rounded-lg bg-[#141414] border border-gray-800/50 shadow-xl transition-all">
                <NotificationContent notifications={notificationItems} loading={loading} />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>

        {/* Mobile Version */}
        <div className="md:hidden fixed inset-x-0 bottom-0">
          <div className="flex items-end justify-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4"
              enterTo="opacity-100 translate-y-0"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-4"
            >
              <Dialog.Panel className="w-full transform overflow-hidden rounded-t-xl bg-[#141414] border-t border-gray-800/50 shadow-xl transition-all">
                <div className="relative">
                  {/* Handle */}
                  <div className="absolute left-1/2 -translate-x-1/2 -top-3">
                    <div className="w-12 h-1 bg-gray-600 rounded-full" />
                  </div>

                  <NotificationContent notifications={notificationItems} loading={loading} />
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

// Helper component for notification content
function NotificationContent({ 
  notifications, 
  loading 
}: { 
  notifications: Notification[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-red-500 border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <Dialog.Title className="text-lg font-medium text-white mb-4 flex items-center justify-between">
        <span>Notifications</span>
        <span className="text-xs text-gray-400 font-normal">
          {notifications.filter(n => !n.read).length} new
        </span>
      </Dialog.Title>
      <div className="space-y-4 max-h-[60vh] md:max-h-[400px] overflow-y-auto">
        {notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.uniqueId} // Use unique identifier here
                className={`flex gap-3 p-3 rounded-lg transition-colors
                  ${notification.read ? "bg-gray-800/30" : "bg-gray-800/50"}
                  hover:bg-gray-700/50 cursor-pointer`}
              >
                {notification.image ? (
                  <img
                    src={notification.image}
                    alt=""
                    className="w-12 h-12 rounded-md object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-md bg-gray-800 flex items-center justify-center">
                    {notification.type === 'upcoming' ? (
                      <CalendarCheck className="w-6 h-6 text-gray-600" />
                    ) : (
                      <Film className="w-6 h-6 text-gray-600" />
                    )}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-white mb-1">
                    {notification.title}
                  </h3>
                  <p className="text-sm text-gray-400 mb-1 line-clamp-2">
                    {notification.message}
                  </p>
                  <span className="text-xs text-gray-500">
                    {notification.time}
                  </span>
                </div>
                {!notification.read && (
                  <div className="w-2 h-2 rounded-full bg-red-500 mt-2" />
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <Bell className="w-12 h-12 mx-auto text-gray-600 mb-3" />
            <p className="text-gray-400 text-sm">No notifications available</p>
          </div>
        )}
      </div>
    </div>
  );
}
