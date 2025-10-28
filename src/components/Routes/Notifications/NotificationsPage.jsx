import { useState } from "react";
import { noNotification, notificationGeneral } from "../../../assets";

const tabs = ["General", "Broadcast Received", "Broadcast Sent"];

const mockNotifications = {
  General: [
    {
      title: "Order Placed",
      detail: "NIFTY25500 at ₹450 Buy",
      time: "10:25AM",
      status: "Successful",
    },
    {
      title: "Order Execute",
      detail: "NIFTY25500 at ₹450 Buy",
      time: "10:28AM",
      status: "Successful",
    },
  ],
  "Broadcast Received": [
    {
      source: "Admin",
      message: "System maintenance scheduled at 11 PM tonight.",
      time: "9:00AM",
      status: "Unread",
    },
  ],
  "Broadcast Sent": [
    {
      to: "All Users",
      message: "New feature update has been deployed successfully.",
      time: "8:45AM",
      status: "Delivered",
    },
  ],
};

const NotificationsPage = () => {
  const [activeTab, setActiveTab] = useState("General");
  const notifications = mockNotifications[activeTab];

  const renderNotification = (note, index) => {
    if (activeTab === "General") {
      return (
        <div
          key={index}
          className="flex justify-between items-start bg-white dark:bg-[#1F1F24] border border-gray-100 dark:border-[#2D2F36] rounded-xl p-4"
        >
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <img src={notificationGeneral} alt="icon" />
            </div>
            <div>
              <div className="text-xs text-[#212121] dark:text-gray-300">
                {note.title}
              </div>
              <div className="text-base text-[#2E3A59] dark:text-gray-400">
                {note.detail}
              </div>
            </div>
          </div>
          <div className="text-right text-sm">
            <div className="text-xs text-gray-400">{note.time}</div>
            <div className="text-green-500 font-medium">{note.status}</div>
          </div>
        </div>
      );
    }

    if (activeTab === "Broadcast Received") {
      return (
        <div
          key={index}
          className="bg-white dark:bg-[#1F1F24] border border-gray-100 dark:border-[#2D2F36] rounded-xl p-4 flex justify-between"
        >
          <div>
            <div className="text-xs text-[#718EBF]">From</div>
            <div className="font-semibold dark:text-white">{note.source}</div>
            <div className="text-[#2E3A59] dark:text-gray-300">
              {note.message}
            </div>
          </div>
          <div className="text-right text-sm">
            <div className="text-xs text-gray-400">{note.time}</div>
            <div className="text-blue-500 font-medium">{note.status}</div>
          </div>
        </div>
      );
    }

    if (activeTab === "Broadcast Sent") {
      return (
        <div
          key={index}
          className="bg-white dark:bg-[#1F1F24] border border-gray-100 dark:border-[#2D2F36] rounded-xl p-4 flex justify-between"
        >
          <div>
            <div className="text-xs text-[#718EBF]">To</div>
            <div className="font-semibold dark:text-white">{note.to}</div>
            <div className="text-[#2E3A59] dark:text-gray-300">
              {note.message}
            </div>
          </div>
          <div className="text-right text-sm">
            <div className="text-xs text-gray-400">{note.time}</div>
            <div className="text-green-500 font-medium">{note.status}</div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="w-full md:px-6 md:py-6 text-[#2E3A59] dark:text-white">
      <h2 className="text-xl font-semibold mb-4">My Notifications</h2>

      <div className="bg-white dark:bg-[#15171C] rounded-2xl border border-[#E4EAF0] dark:border-[#2D2F36] p-4 md:p-6">
        <div className="flex space-x-6 border-b border-gray-100 dark:border-[#2D2F36] pb-3 mb-4 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab}
              className={`pb-2 text-base font-medium whitespace-nowrap ${
                activeTab === tab
                  ? "text-[#0096FF] border-b-2 border-[#0096FF]"
                  : "text-[#718EBF] dark:text-gray-400"
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
            <img
              src={noNotification}
              alt="No Notifications"
              className="w-20 h-20 mb-4 opacity-70"
            />
            <p className="text-center text-sm">No Notifications Found!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {mockNotifications[activeTab]?.length > 0 ? (
              mockNotifications[activeTab].map((note, index) =>
                renderNotification(note, index)
              )
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                <img
                  src={noNotification}
                  alt="No Notifications"
                  className="w-20 h-20 mb-4 opacity-70"
                />
                <p className="text-center text-sm">No Notifications Found!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
