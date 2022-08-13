import loginReducer from './features/loginSlice';
import serverReducer from './features/serverSlice';

const rootReducer = {
  login: loginReducer,
  server: serverReducer,
};

export default rootReducer;
