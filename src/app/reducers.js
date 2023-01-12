import loginReducer from "./features/loginSlice";
import serverReducer from "./features/serverSlice";
import deviceReducer from "./features/deviceSlice";
import userReducer from "./features/userSlice";
import modelReducer from "./features/modelSlice";
import trainerSlice from "./features/trainerSlice";

const rootReducer = {
  login: loginReducer,
  server: serverReducer,
  device: deviceReducer,
  user: userReducer,
  model: modelReducer,
  trainer: trainerSlice,
};

export default rootReducer;
