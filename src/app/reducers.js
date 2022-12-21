import loginReducer from "./features/loginSlice";
import serverReducer from "./features/serverSlice";
import deviceReducer from "./features/deviceSlice";
import userReducer from "./features/userSlice";

const rootReducer = {
  login: loginReducer,
  server: serverReducer,
  device: deviceReducer,
  user: userReducer,
};

export default rootReducer;
