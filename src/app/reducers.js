import loginReducer from "./features/loginSlice";
import serverReducer from "./features/serverSlice";
import userReducer from "./features/userSlice";
import conversationSlice from "./features/conversationSlice";
import flagsReducer from "./features/flagsSlice";
import apiAuthReducer from "./features/apiAuthSlice";
import conversationV2Reducer from "../features/conversation/state/conversationV2Slice";

const rootReducer = {
  login: loginReducer,
  server: serverReducer,
  user: userReducer,
  conversation: conversationSlice,
  flags: flagsReducer,
  apiAuth: apiAuthReducer,
  conversationV2: conversationV2Reducer,
};

export default rootReducer;
