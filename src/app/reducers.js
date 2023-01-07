import loginReducer from "./features/loginSlice";
import serverReducer from "./features/serverSlice";
import deviceReducer from "./features/deviceSlice";
import userReducer from "./features/userSlice";
import modelReducer from "./features/modelSlice";

const rootReducer = {
  login: loginReducer,
  server: serverReducer,
  device: deviceReducer,
  user: userReducer,
  model: modelReducer,
};

export default rootReducer;
