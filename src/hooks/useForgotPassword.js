import { useState } from "react";
import JS2Py from "../remotepyjs";

function forgotPasswordLogic() {
  const [isMailSent, setIsMailSent] = useState(false);
  const onFinish = (values) => {
    console.log(values, "inside onFinish");
    JS2Py.PythonFunctions.SessionServer.forgotPassword(
      "",
      values.email,
      (res) => {
        if (res.isValidUser === true) {
          setIsMailSent(true);
        }
      }
    );
  };

  return { onFinish, isMailSent };
}

export default forgotPasswordLogic;
