import { useState } from "react";
import { importIcon, playIcon, simulatorCameraIcon } from "../../../assets";
import { useNavigate } from "react-router-dom";

const TopInfoBar = () => {
  const [selectedIndex, setSelectedIndex] = useState("Nifty");
  const [selectedDate, setSelectedDate] = useState("2025-06-10");
  const [hour, setHour] = useState("9");
  const [minute, setMinute] = useState("16");
  const navigate = useNavigate();

  const instruments = ["Nifty", "BankNifty", "FinNifty"];

  const priceData = {
    dayOpen: { value: 25196.0, change: "+93PT,0.4%", isUp: true },
    spot: { value: 25196.0, change: "-93PT,-0.4%", isUp: false },
    fut: 25196.0,
    synthFut: { value: 25196.0, expiry: "12 JUN" },
  };

  const timeBack = ["SOD", "-2h", "-30m", "-15m", "-5m", "-1m"];
  const timeForward = ["1m+", "5m+", "15m+", "30m+", "2h+", "EOD"];

  return (
    <div className="bg-white dark:bg-[#15171C] rounded-xl border border-gray-200 dark:border-[#2D2F36] px-4 py-3 text-sm">
      <div className="flex justify-between items-center w-full gap-2 overflow-x-auto">
        <div className="flex-shrink-0">
          <select
            value={selectedIndex}
            onChange={(e) => setSelectedIndex(e.target.value)}
            className="px-3 py-1 border rounded dark:bg-[#2A2A2E] dark:border-gray-600"
          >
            {instruments.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>

        <div className="w-full md:flex md:justify-center overflow-x-auto">
          <div className="flex items-center gap-1 w-fit">
            <button className="px-3 py-1 rounded bg-gray-100 text-gray-400 dark:bg-[#2F2F35] dark:text-gray-500 text-xs cursor-default">
              «DAY
            </button>

            {timeBack.map((btn) => (
              <button
                key={btn}
                className="px-3 py-1 rounded bg-gray-100 dark:bg-[#2F2F35] text-xs dark:text-gray-300 whitespace-nowrap"
              >
                {btn}
              </button>
            ))}

            <div className="px-3 py-1 rounded bg-gray-100 dark:bg-[#2A2A2E] text-xs whitespace-nowrap">
              {new Date(selectedDate).toDateString()}
            </div>

            <select
              value={hour}
              onChange={(e) => setHour(e.target.value)}
              className="border px-2 py-1 rounded text-sm dark:bg-[#2A2A2E] dark:border-gray-600"
            >
              {Array.from({ length: 24 }).map((_, i) => (
                <option key={i}>{i}</option>
              ))}
            </select>

            <select
              value={minute}
              onChange={(e) => setMinute(e.target.value)}
              className="border px-2 py-1 rounded text-sm dark:bg-[#2A2A2E] dark:border-gray-600"
            >
              {["00", "01", "05", "15", "30", "45", "59"].map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>

            {timeForward.map((btn) => (
              <button
                key={btn}
                className="px-3 py-1 rounded bg-gray-100 dark:bg-[#2F2F35] text-xs dark:text-gray-300 whitespace-nowrap"
              >
                {btn}
              </button>
            ))}

            <button className="px-3 py-1 rounded bg-gray-100 text-gray-400 dark:bg-[#2F2F35] dark:text-gray-500 text-xs cursor-default">
              DAY»
            </button>
          </div>
        </div>

        <div className="flex-shrink-0">
          <button>
            <img src={playIcon} alt="Camera" />
          </button>
        </div>
        <div className="flex-shrink-0 ml-2">
          <button>
            <img src={simulatorCameraIcon} alt="Camera" />
          </button>
        </div>
      </div>

      <div className="border-t my-3 border-gray-200 dark:border-[#2D2F36]" />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={() => navigate("/backtesting/simulator/addfuture")}
          className="text-[#0096FF] text-sm font-medium"
        >
          +Add Futures
        </button>

        <div className="flex-1 flex justify-evenly flex-wrap gap-2 text-[#2E3A59] dark:text-gray-300">
          <div>
            <span className="text-opacity-50 text-[#212121]">Day Open: </span>
            <span className="font-medium">{priceData.dayOpen.value}</span>{" "}
            <span
              className={
                priceData.dayOpen.isUp ? "text-green-500" : "text-red-500"
              }
            >
              ({priceData.dayOpen.change})
            </span>
          </div>

          <div>
            <span className="text-opacity-50 text-[#212121]">Spot: </span>
            <span className="font-medium">{priceData.spot.value} </span>{" "}
            <span
              className={`font-medium ${
                priceData.spot.isUp ? "text-green-500" : "text-red-500"
              }`}
            >
              ({priceData.spot.change})
            </span>
          </div>

          <div>
            <span className="text-opacity-50 text-[#212121]">Fut:</span>{" "}
            <span className="font-medium">{priceData.fut}</span>
          </div>

          <div>
            <span className="text-opacity-50 text-[#212121]">Synth Fut: </span>
            <span className="font-medium">{priceData.synthFut.value}</span>{" "}
            <span className="text-opacity-50 text-[#212121]">
              ({priceData.synthFut.expiry})
            </span>
          </div>
        </div>

        <button className="flex items-center px-3 py-1 rounded text-sm whitespace-nowrap">
          <span className="mr-1">
            <img src={importIcon} alt="" />
          </span>{" "}
          Import Strategy
        </button>
      </div>
    </div>
  );
};

export default TopInfoBar;
