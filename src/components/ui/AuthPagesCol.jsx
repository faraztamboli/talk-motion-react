import React from "react";
import { Col, Button } from "antd";
import { Link, useParams } from "react-router-dom";

function AuthPagesCol() {
  return (
    <Col span={12} xs={24} md={12} className="mh-100vh auth-pages-bg">
      <div className="text-center mh-100vh p-8 flex flex-center-center">
        <div className="block">
          <h1 className="mb-0 text-white auth-pages-first-col-heading">
            Talk Motion
          </h1>
          <p className="text-white auth-pages-first-col-para">
            An AI-based Sign Language Translator
          </p>
            <a href="https://talk-motion.com/guide" rel="noopener noreferrer">
              <Button
                type="primary"
                size="large"
                shape="round"
                className="mt-4"
                style={{ color: "#08165f" }}
              >
                Read More
              </Button>
            </a>
        </div>
      </div>
    </Col>
  );
}

export default AuthPagesCol;
