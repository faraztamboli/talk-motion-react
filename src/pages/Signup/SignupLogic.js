import { useState, useEffect } from "react";
import JS2Py from "../../remotepyjs";
import { useNavigate } from "react-router-dom";
import { getCountryCode } from "../../data/countries";

function SignupLogic() {
  const [, forceUpdate] = useState({}); // To disable submit button at the beginning.
  const navigate = useNavigate();
  // const disptach = useDispatch();

  const onFinish = (values) => {
    JS2Py.PythonFunctions.SessionServer.registerLoginShort(
      "",
      values.username,
      values.password,
      values.email,
      (res) => {
        console.log(res);
      }
    );

    navigate("/login");
  };

  useEffect(() => {
    forceUpdate({});
  }, []);

  return { onFinish };
}

export default SignupLogic;
