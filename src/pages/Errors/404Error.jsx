import React from "react";
import { Button, Result } from "antd";
import { Link } from "react-router-dom";
const App = () => (
  <div className="mh-100vh flex flex-center-center">
    <Result
      status="404"
      title="404"
      subTitle="Sorry, the page you visited does not exist."
      extra={
        <Link to="/">
          <Button type="primary" className="converter-btns">
            Back Home
          </Button>
        </Link>
      }
    />
  </div>
);
export default App;
