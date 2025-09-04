import { Octopus } from "./index";

const octopusInstance = new Octopus({
  host: import.meta.env.VITE_WEBSOCKET_HOST,
  path: import.meta.env.VITE_WEBSOCKET_PATH,
  loginId: import.meta.env.VITE_WEBSOCKET_LOGIN_ID,
  token: import.meta.env.VITE_WEBSOCKET_TOKEN,
});

export default octopusInstance;
