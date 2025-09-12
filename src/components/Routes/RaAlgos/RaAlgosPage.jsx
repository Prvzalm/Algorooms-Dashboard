import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { man } from "../../../assets";
import RaAlgosData from "../Dashboard/RaAlgosData";

// Single author mock (as per screenshot showing one profile and strategy cards)
const author = {
  name: "Abinas Mishra",
  avatar: man,
  sebiId: "INH00001990",
};

const RaAlgosPage = ({ dashboard = false }) => {
  const [side, setSide] = useState("Trend Following Market");
  const navigate = useNavigate();

  // Strategies mock – produce 6 items for dashboard, else 3, all as objects
  const strategies = Array.from({ length: dashboard ? 3 : 6 }).map(() => ({
    name: "Sensex Weekly Expiry",
    saves: 11,
    description:
      "Lorem ipsum dolor sit amet consectetur. Tellus varius pellentesque eget amet pretium aliquet quam commodo egestas.",
    margin: "₹3,00,000",
  }));

  // Reusable toggle
  const toggle = (
    <div className="flex bg-[#F5F8FA] dark:bg-[#1E2027] rounded-md p-1 border border-[#E4EAF0] dark:border-[#2D2F36]">
      {["Trend Following Market", "Sideway Market Strategy"].map((s) => (
        <button
          key={s}
          onClick={() => setSide(s)}
          className={`px-5 py-1.5 text-xs md:text-sm rounded-md font-medium transition-colors ${
            side === s
              ? "bg-[#0096FF] text-white"
              : "text-[#2E3A59] dark:text-gray-200"
          }`}
        >
          {s}
        </button>
      ))}
    </div>
  );

  return (
    <div className="w-full px-4 md:px-8 py-6 rounded-2xl border border-[#E4EAF0] dark:border-[#2D2F36] bg-white dark:bg-[#15171C]">
      {/* Header */}
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          {!dashboard && (
            <button
              onClick={() => navigate(-1)}
              className="w-8 h-8 flex items-center justify-center rounded-md border border-[#E4EAF0] dark:border-[#2D2F36] text-[#2E3A59] dark:text-white hover:bg-[#F5F8FA] dark:hover:bg-[#1E2027]"
            >
              <span className="text-lg">‹</span>
            </button>
          )}
          <div className="flex items-center gap-3">
            <img
              src={author.avatar}
              alt={author.name}
              className="w-14 h-14 rounded-2xl object-cover"
            />
            <div>
              <h2 className="text-lg md:text-xl font-semibold text-[#2E3A59] dark:text-white leading-snug">
                {author.name}
              </h2>
              <p className="text-xs md:text-sm text-[#718EBF] dark:text-gray-400 mt-0.5">
                SEBI {author.sebiId}
              </p>
            </div>
          </div>

          {/* Side toggle (desktop / always when not dashboard) */}
          <div className={`ml-auto ${dashboard ? "hidden sm:block" : ""}`}>
            {toggle}
          </div>
        </div>
        {/* Mobile toggle shown below header only when dashboard */}
        {dashboard && <div className="sm:hidden">{toggle}</div>}
      </div>

      {/* Strategy Cards Grid (reuse common component) */}
      <div className="mt-8">
        <RaAlgosData variant="page" author={author} strategies={strategies} />
      </div>
    </div>
  );
};

export default RaAlgosPage;
