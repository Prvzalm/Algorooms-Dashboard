import { emptyHeaderCard } from "../../../assets";
import { useProfileQuery } from "../../../hooks/profileHooks";

const HeaderCard = ({ totalPnl, topGainer, topLoser, accountImg, brokers }) => {
  const { data: profileData, isLoading, isError } = useProfileQuery();
  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error...</div>;
  return (
    <div className="flex flex-col h-full">
      <div className="bg-gradient-to-r from-[#4C49ED] to-[#0096FF] text-white p-6 rounded-t-3xl h-full flex flex-col justify-between">
        {brokers.length !== 0 ? (
          <>
            <div className="text-sm mb-1">Total P&L</div>
            <div className="text-3xl font-bold mb-2">₹{totalPnl}</div>
            <div className="flex text-sm justify-between">
              <div className="flex flex-col">
                <span className="text-gray-300">Top Gainer Strategy</span>{" "}
                <strong>{topGainer}</strong>
              </div>
              <div className="flex flex-col">
                <span className="text-gray-300">Top Loss Strategy</span>{" "}
                <strong>{topLoser}</strong>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col sm:flex-row items-center sm:gap-8 gap-4">
            <img
              src={emptyHeaderCard}
              alt="Empty state"
              className="w-24 sm:w-32 md:w-40"
            />
            <div className="flex flex-col space-y-2 text-center sm:text-left">
              <h1 className="text-xl md:text-2xl font-semibold">
                Connect to your broker
              </h1>
              <p className="text-sm md:text-base text-gray-200 dark:text-gray-300">
                Deploy, Manage & Track Your Strategies, All From One Broker
                Account.
              </p>
              <div>
                <button className="bg-white text-[#0096FF] px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 dark:hover:bg-gray-200 transition">
                  + Add Broker
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center text-lg text-left text-white font-semibold p-5 bg-gradient-to-r rounded-b-3xl from-blue-500 to-blue-400">
        {profileData.Name}
        {brokers.length !== 0 && (
          <div className="flex -space-x-3">
            {brokers?.slice(0, 2).map((broker, index) => (
              <img
                key={index}
                src={broker.logo}
                alt={broker.name}
                className="w-8 h-8 rounded-full border-2 border-white"
                style={{ zIndex: 10 - index }}
              />
            ))}

            {brokers?.length > 2 && (
              <div className="w-8 h-8 rounded-full bg-white text-xs flex items-center justify-center font-semibold text-black border-2 border-white">
                +{brokers.length - 2}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HeaderCard;
