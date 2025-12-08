import TopInfoBar from "./TopInfoBar";
import OptionChainTable from "./OptionChainTable";
import StrategySelector from "./StrategySelector";
import ComingSoonOverlay from "../../common/ComingSoonOverlay";

const SimulatorPage = () => {
  return (
    <div className="relative">
      <ComingSoonOverlay />
      <TopInfoBar />
      <div className="flex md:flex-row flex-col gap-4">
        <OptionChainTable />
        <StrategySelector />
      </div>
    </div>
  );
};

export default SimulatorPage;
