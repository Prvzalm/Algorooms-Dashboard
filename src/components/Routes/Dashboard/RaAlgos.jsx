import { useNavigate } from "react-router-dom";
import RaAlgosPage from "../RaAlgos/RaAlgosPage";

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

      <RaAlgosPage algos={algos} dashboard={true} />
    </div>
  );
};

export default RaAlgos;
