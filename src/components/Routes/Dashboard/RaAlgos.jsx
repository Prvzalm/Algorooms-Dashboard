import { useNavigate } from "react-router-dom";
import RaAlgosData from "./RaAlgosData";

const RaAlgos = ({ algos }) => {
  const navigate = useNavigate();
  return (
    <div className="bg-white dark:bg-darkbg rounded-xl text-black dark:text-white">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-lg">Ra Algos</h3>
        <button
          onClick={() => navigate("/raalgo")}
          className="text-blue-600 dark:text-blue-400 text-sm hover:underline"
        >
          See All
        </button>
      </div>

      <RaAlgosData algos={algos} />
    </div>
  );
};

export default RaAlgos;
