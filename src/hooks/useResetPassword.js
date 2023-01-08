import { useState, useEffect } from "react";
import { message } from "antd";
import JS2Py from "../remotepyjs";
import { useNavigate } from "react-router-dom";
import useLocalStorage from "./useLocalStorage";

function useResetPassword() {
  const [loading, setLoading] = useState(false);
  const [, forceUpdate] = useState({}); // To disable submit button at the beginning.
  const navigate = useNavigate();
  const [token] = useLocalStorage("token");
  const [messageApi, contextHolder] = message.useMessage();
  const success = () => {
    messageApi.open({
      type: "success",
      content: "Password changed successfully!",
    });
  };

  const failure = () => {
    messageApi.open({
      type: "error",
      content: "Cannot reset the password",
    });
  };

  const onFinish = (values) => {
    setLoading(true);
    JS2Py.PythonFunctions.SessionServer.resetPassword(
      token,
      values.resetpasswordcode,
      values.newpassword,
      values.repeatnewpassword,
      function (res) {
        console.log(res);
        if (res.status == "success") {
          success();
          setLoading(false);
          setTimeout(() => {
            navigate("/login");
          }, 2000);
        } else {
          failure();
          setLoading(false);
        }
      }
    );
  };

  useEffect(() => {
    forceUpdate({});
  }, []);

  return { onFinish, contextHolder, loading };
}

export default useResetPassword;
