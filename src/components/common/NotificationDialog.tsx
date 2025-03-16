import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Bell } from "lucide-react";

interface NotificationDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationDialog({
  isOpen,
  onClose,
}: NotificationDialogProps) {
  // Sample notification data
  const notifications = [
    {
      id: 1,
      title: "New movie release",
      message: "Avengers: Secret Wars is now available to stream",
      time: "2 hours ago",
      read: false,
      image: "https://image.tmdb.org/t/p/w500/1E5baAaEse26fej7uHcjOgEE2t2.jpg",
    },
    {
      id: 2,
      title: "Subscription update",
      message: "Your premium subscription will renew in 3 days",
      time: "1 day ago",
      read: false,
      image: null,
    },
    {
      id: 3,
      title: "Continue watching",
      message: 'You left "Inception" at 01:24:15. Continue watching?',
      time: "3 days ago",
      read: true,
      image: "https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg",
    },
  ];

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
                <NotificationContent notifications={notifications} />
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

                  <NotificationContent notifications={notifications} />
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
function NotificationContent({ notifications }: { notifications: any[] }) {
  return (
    <div className="p-4">
      <Dialog.Title className="text-lg font-medium text-white mb-4 flex items-center justify-between">
        <span>Notifications</span>
        <span className="text-xs text-gray-400 font-normal">
          {notifications.filter((n) => !n.read).length} new
        </span>
      </Dialog.Title>
      <div className="space-y-4 max-h-[60vh] md:max-h-[400px] overflow-y-auto">
        {notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
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
                    <Bell className="w-6 h-6 text-gray-600" />
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
