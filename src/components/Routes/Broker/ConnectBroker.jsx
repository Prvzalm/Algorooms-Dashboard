import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useUpdateBrokerAuthCode } from "../../../hooks/brokerHooks";

const ConnectBroker = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { mutateAsync, isLoading } = useUpdateBrokerAuthCode();

  useEffect(() => {
    console.log({
      path: location.pathname,
      search: location.search,
      queryKey: localStorage.getItem("brokerAuthqueryString"),
    });

    if (!location.pathname.includes("connect-broker")) return;

    const params = new URLSearchParams(location.search);
    const queryKey = localStorage.getItem("brokerAuthqueryString");

    if (!queryKey) return;

    const requestToken = params.get(queryKey);
    console.log(requestToken, "request_Token")
    const brokerClientId = localStorage.getItem("BrokerClientId");
    const jwt = localStorage.getItem("Authorization");

    if (!requestToken || !brokerClientId || !jwt) return;

    (async () => {
      try {
        await mutateAsync({
          BrokerClientId: brokerClientId,
          RequestToken: requestToken,
          JwtToken: jwt,
        });
        navigate("/", { replace: true });
      } finally {
        localStorage.removeItem("BrokerClientId");
        localStorage.removeItem("brokerAuthqueryString");
      }
    })();
  }, [location, location.pathname, location.search, mutateAsync, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center text-black dark:text-white">
      <div className="w-16 h-16 border-4 border-t-transparent border-blue-500 rounded-full animate-spin mb-4" />
      <h2 className="text-lg font-semibold mb-2">Connecting Broker...</h2>
      <p className="text-sm text-gray-600 dark:text-gray-300 max-w-xs">
        Please wait while we finalize your broker connection.
      </p>
      {isLoading && (
        <p className="text-xs mt-4 text-gray-400">
          Updating authorization code
        </p>
      )}
    </div>
  );
};

export default ConnectBroker;
