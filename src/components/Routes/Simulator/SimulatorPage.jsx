import TopInfoBar from "./TopInfoBar";
import OptionChainTable from "./OptionChainTable";
import StrategySelector from "./StrategySelector";

const SimulatorPage = () => {
  return (
    <>
      <TopInfoBar />
      <div className="flex md:flex-row flex-col gap-4">
        <OptionChainTable />
        <StrategySelector />
      </div>
    </>
  );
};

export default SimulatorPage;
