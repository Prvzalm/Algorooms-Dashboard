import {
  FaTelegram,
  FaYoutube,
  FaInstagram,
  FaWhatsapp,
  FaPhone,
} from "react-icons/fa";
import PrimaryButton from "../../common/PrimaryButton";

const JoinAndSupport = () => {
  const socialLinks = [
    {
      name: "Telegram Channel",
      icon: FaTelegram,
      link: "https://t.me/+j5LrPUOb6BE1M2Zl",
      bgColor: "bg-blue-500",
    },
    {
      name: "Youtube Channel",
      icon: FaYoutube,
      link: "https://www.youtube.com/@AlgoRooms",
      bgColor: "bg-red-500",
    },
    {
      name: "Instagram",
      icon: FaInstagram,
      link: "https://www.instagram.com/algorooms_official/",
      bgColor: "bg-pink-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
      {/* Join Us Section */}
      <div className="flex flex-col lg:col-span-1">
        <h2 className="text-xl md:text-2xl font-semibold text-[#343C6A] dark:text-white mb-4">
          Join Us
        </h2>
        <div className="bg-white dark:bg-[#131419] rounded-xl p-6 space-y-3 flex-1">
          {socialLinks.map((social, index) => (
            <div
              key={index}
              className="flex items-center justify-between rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 ${social.bgColor} rounded-lg flex items-center justify-center`}
                >
                  <social.icon className="text-white text-xl" />
                </div>
                <span className="text-sm font-medium text-[#2E3A59] dark:text-white">
                  {social.name}
                </span>
              </div>
              <PrimaryButton
                as="a"
                href={social.link}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-2 text-sm"
              >
                Join
              </PrimaryButton>
            </div>
          ))}
        </div>
      </div>

      {/* Support Section */}
      <div className="flex flex-col lg:col-span-2">
        <h2 className="text-xl md:text-2xl font-semibold text-[#343C6A] dark:text-white mb-4">
          Support
        </h2>
        <div className="bg-[radial-gradient(circle,_#1B44FE_0%,_#5375FE_100%)] rounded-xl p-6 text-white relative overflow-hidden flex-1">
          {/* Background Image */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
            style={{
              backgroundImage: `url('data:image/svg+xml,%3Csvg width="800" height="600" viewBox="0 0 800 600" fill="none" xmlns="http://www.w3.org/2000/svg"%3E%3Cpath d="M400 50L450 150L550 150L475 225L500 325L400 250L300 325L325 225L250 150L350 150L400 50Z" fill="white" opacity="0.1"/%3E%3Ccircle cx="600" cy="100" r="80" fill="white" opacity="0.05"/%3E%3Ccircle cx="150" cy="400" r="60" fill="white" opacity="0.05"/%3E%3Cpath d="M700 400C700 450 650 500 600 500C550 500 500 450 500 400" stroke="white" stroke-width="3" opacity="0.1"/%3E%3Cpath d="M100 200L150 250L100 300" stroke="white" stroke-width="2" opacity="0.1"/%3E%3Crect x="650" y="450" width="100" height="100" rx="10" fill="white" opacity="0.05"/%3E%3Cpath d="M200 100C200 100 250 80 300 100C350 120 400 100 400 100" stroke="white" stroke-width="2" opacity="0.1"/%3E%3C/svg%3E')`,
            }}
          />

          <div className="relative z-10">
            <h2 className="text-xl font-semibold mb-2">
              Need Help? We're Here for You!
            </h2>
            <p className="text-sm text-blue-100 mb-6">
              Have questions or facing issues? Our support team is ready to
              assist you with any queries or concerns.
            </p>

            <div className="flex flex-wrap gap-3">
              <a
                href="https://wa.me/+917042132888"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-2.5 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
              >
                <FaWhatsapp className="text-lg" />
                <span className="text-sm">WhatsApp</span>
              </a>
              <a
                href="tel:+917042132888"
                className="flex items-center gap-2 px-5 py-2.5 bg-white/10 backdrop-blur-sm border border-white/30 text-white rounded-lg font-medium hover:bg-white/20 transition-colors"
              >
                <FaPhone className="text-sm" />
                <span className="text-sm">Call Us</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinAndSupport;
