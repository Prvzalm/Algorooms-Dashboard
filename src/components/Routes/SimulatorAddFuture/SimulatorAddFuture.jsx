import OptionChainTable from "../Simulator/OptionChainTable";
import TopInfoBar from "../Simulator/TopInfoBar";
import PayoffChart from "./PayoffChart";

const SimulatorAddFuture = () => {
  return (
    <>
      <TopInfoBar />
      <div className="flex md:flex-row flex-col gap-4">
        <OptionChainTable />
        <PayoffChart />
      </div>
    </>
  );
};

export default SimulatorAddFuture;
