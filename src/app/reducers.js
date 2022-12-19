import loginReducer from "./features/loginSlice";
import serverReducer from "./features/serverSlice";
import deviceReducer from "./features/deviceSlice";

const rootReducer = {
  login: loginReducer,
  server: serverReducer,
  device: deviceReducer,
};

export default rootReducer;
