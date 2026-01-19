import { useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { useNavigate, useLocation } from "react-router-dom";
import { useUpdateBrokerAuthCode } from "../../../hooks/brokerHooks";

// This route handles redirect from broker after user login.
// Expected query param: request_token
// It uses localStorage key 'selected-broker-client-id' set when user clicked Terminal toggle/login.

const ConnectBroker = () => {
  // const navigate = useNavigate();
  // const location = useLocation();
  // const { mutateAsync, isLoading } = useUpdateBrokerAuthCode();
  // const firedRef = useRef(false);

  // useEffect(() => {
  //   if (firedRef.current) return; // guard against double invocation
  //   const params = new URLSearchParams(location.search);
  //   const queryKey = localStorage.getItem("brokerAuthqueryString");
  //   const requestToken = params.get(queryKey);
  //   const brokerClientId = localStorage.getItem("BrokerClientId");
  //   const jwt = localStorage.getItem("Authorization");

  //   // if (!requestToken || !brokerClientId) {
  //   //   navigate("/", { replace: true });
  //   //   return;
  //   // }

  //   firedRef.current = true;
  //   (async () => {
  //     try {
  //       await mutateAsync({
  //         BrokerClientId: brokerClientId,
  //         RequestToken: requestToken,
  //         JwtToken: jwt,
  //       });
  //     } catch (err) {
  //       // hook will show toast; nothing else needed here
  //     } finally {
  //       localStorage.removeItem("BrokerClientId");
  //       localStorage.removeItem("brokerAuthqueryString");
  //       navigate("/", { replace: true });
  //     }
  //   })();
  // }, [location.search, mutateAsync, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center text-black dark:text-white">
      <div className="w-16 h-16 border-4 border-t-transparent border-blue-500 rounded-full animate-spin mb-4" />
      <h2 className="text-lg font-semibold mb-2">Connecting Broker...</h2>
      <p className="text-sm text-gray-600 dark:text-gray-300 max-w-xs">
        Please wait while we finalize your broker connection.
      </p>
      {/* {isLoading && ( */}
        <p className="text-xs mt-4 text-gray-400">
          Updating authorization code
        </p>
      {/* )} */}
    </div>
  );
};

export default ConnectBroker;
