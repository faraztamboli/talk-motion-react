import { useState, useEffect } from "react";
import JS2Py from "../remotepyjs";
import { useNavigate } from "react-router-dom";
import { message } from "antd";

function SignupLogic() {
  const [loading, setLoading] = useState(false);
  const [, forceUpdate] = useState({}); // To disable submit button at the beginning.
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();

  const success = () => {
    messageApi.open({
      type: "success",
      content: "Account created successfully!",
    });
  };

  const failure = () => {
    messageApi.open({
      type: "error",
      content: "Cannot create your account",
    });
  };

  const onFinish = (values) => {
    setLoading(true);
    try {
      JS2Py.PythonFunctions.SessionServer.registerLoginShort(
        "",
        values.username,
        values.password,
        values.email,
        (res) => {
          setLoading(false);
          console.log(res);
          success();
          setTimeout(() => {
            navigate("/login");
          }, [2000]);
        }
      );
    } catch (err) {
      setLoading(false);
      console.log(err);
      failure();
    }
  };

  useEffect(() => {
    forceUpdate({});
  }, []);

  return { onFinish, contextHolder, loading };
}

export default SignupLogic;
