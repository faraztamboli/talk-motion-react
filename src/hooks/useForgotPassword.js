import { message } from "antd";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import JS2Py from "../remotepyjs";

function forgotPasswordLogic() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const success = () => {
    messageApi.open({
      type: "success",
      content: "Link sent to your email",
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
    JS2Py.PythonFunctions.SessionServer.forgotPassword(
      "",
      values.email,
      (res) => {
        if (res.isValidUser === true) {
          success();
          setLoading(false);
          setTimeout(() => {
            navigate("/resetpassword");
          }, [2000]);
        } else {
          failure();
          setLoading(false);
        }
      }
    );
  };

  return { onFinish, contextHolder, loading };
}

export default forgotPasswordLogic;
