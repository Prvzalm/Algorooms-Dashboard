import { useProfileQuery } from "../../../hooks/profileHooks";

const HeaderCard = ({ totalPnl, topGainer, topLoser, accountImg }) => {
  const { data: profileData, isLoading, isError } = useProfileQuery();
  if (isLoading) <div>Loading...</div>;
  if (isError) <div>Error...</div>;
  return (
    <div className="flex flex-col">
      <div className="bg-gradient-to-r from-[#4C49ED] to-[#0096FF] text-white p-6 rounded-t-3xl h-full flex flex-col justify-between">
        <div>
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
        </div>
      </div>
      <div className="flex justify-between items-center text-lg text-left text-white font-semibold p-5 bg-gradient-to-r rounded-b-3xl from-blue-500 to-blue-400">
        {profileData.Name}
        <img className="w-10 h-10" src={accountImg} alt="" />
      </div>
    </div>
  );
};

export default HeaderCard;
