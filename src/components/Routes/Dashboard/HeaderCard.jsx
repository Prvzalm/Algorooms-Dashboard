import { useNavigate } from "react-router-dom";
import { emptyHeaderCard } from "../../../assets";
import { useProfileQuery } from "../../../hooks/profileHooks";
import { getPnlTextClass } from "../../../services/utils/formatters";

const HeaderCard = ({ totalPnl, topGainer, topLoser, accountImg, brokers }) => {
  const { data: profileData, isLoading, isError } = useProfileQuery();
  const navigate = useNavigate();
  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error...</div>;
  const totalPnlValue = Number(totalPnl) || 0;
  const totalPnlClass = getPnlTextClass(totalPnlValue, {
    positive: "text-green-200",
    negative: "text-red-300",
    neutral: "text-white/80",
  });
  const hasTradeHighlights =
    totalPnlValue !== 0 && (Boolean(topGainer) || Boolean(topLoser));
  return (
    <div className="flex flex-col">
      <div className="bg-gradient-to-r from-[#4C49ED] to-[#0096FF] text-white p-6 rounded-t-3xl flex flex-col justify-between">
        {brokers.length !== 0 ? (
          <>
            <div className="text-sm mb-1">Total P&L</div>
            <div className={`text-3xl font-bold mb-2 ${totalPnlClass}`}>
              ₹
              {totalPnlValue.toLocaleString(undefined, {
                maximumFractionDigits: 2,
              })}
            </div>
            {hasTradeHighlights ? (
              <div className="flex text-sm justify-between gap-4">
                <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
                  <span className="text-gray-300 text-xs mb-0.5">
                    Top Gainer Strategy
                  </span>
                  <strong className="truncate block" title={topGainer || "-"}>
                    {topGainer || "-"}
                  </strong>
                </div>
                <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
                  <span className="text-gray-300 text-xs mb-0.5">
                    Top Loss Strategy
                  </span>
                  <strong className="truncate block" title={topLoser || "-"}>
                    {topLoser || "-"}
                  </strong>
                </div>
              </div>
            ) : (
              <div className="text-sm text-white/80">No trades found yet.</div>
            )}
          </>
        ) : (
          <div className="flex flex-col sm:flex-row items-center sm:gap-8 gap-4">
            {/* <img
              src={emptyHeaderCard}
              alt="Empty state"
              className="w-24 sm:w-32 md:w-40"
            /> */}
            <div className="flex flex-col space-y-2 text-center sm:text-left">
              <h1 className="text-xl md:text-2xl font-semibold">
                Connect to your broker
              </h1>
              <p className="text-sm md:text-base text-gray-200 dark:text-gray-300">
                Deploy, Manage & Track Your Strategies, All From One Broker
                Account.
              </p>
              <div>
                <button
                  className="bg-white text-[#0096FF] px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 dark:hover:bg-gray-200 transition"
                  type="button"
                  onClick={() => navigate("/add-broker")}
                >
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
