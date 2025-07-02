import RaAlgosData from "./RaAlgosData";

const RaAlgos = ({ algos }) => {
  return (
    <div className="bg-white dark:bg-darkbg p-4 rounded-xl text-black dark:text-white">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-lg">Ra Algos</h3>
        <button className="text-blue-600 dark:text-blue-400 text-sm hover:underline">
          See All
        </button>
      </div>

      <RaAlgosData algos={algos} />
    </div>
  );
};

export default RaAlgos;
