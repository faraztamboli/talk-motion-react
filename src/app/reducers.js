import loginReducer from "./features/loginSlice";
import serverReducer from "./features/serverSlice";
import deviceReducer from "./features/deviceSlice";
import userReducer from "./features/userSlice";
import modelReducer from "./features/modelSlice";
import trainerSlice from "./features/trainerSlice";
import speechSlice from "./features/speechSlice";
import converterSlice from "./features/converterSlice";
import cartSlice from "./features/cartSlice";
import subtitleRecordingStateSlice from "./features/subtitleRecordingSlice";
import subtitleRecordingButtonSlice from "./features/subtitleRecordingButtonSlice";
import conversationSlice from "./features/conversationSlice";
import flagsReducer from "./features/flagsSlice";
import apiAuthReducer from "./features/apiAuthSlice";
import conversationV2Reducer from "../features/conversation/state/conversationV2Slice";

const rootReducer = {
  login: loginReducer,
  server: serverReducer,
  device: deviceReducer,
  user: userReducer,
  model: modelReducer,
  trainer: trainerSlice,
  speech: speechSlice,
  converter: converterSlice,
  cart: cartSlice,
  subtitleRecordingState: subtitleRecordingStateSlice,
  subtitleRecordingButton: subtitleRecordingButtonSlice,
  conversation: conversationSlice,
  flags: flagsReducer,
  apiAuth: apiAuthReducer,
  conversationV2: conversationV2Reducer,
};

export default rootReducer;
