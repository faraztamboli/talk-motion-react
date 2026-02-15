import React, { useState } from "react";
import { Button, Modal, Space } from "antd";
import { UserAddOutlined } from "@ant-design/icons";
import useMessageApi from "../../hooks/useMessageApi";
import useClassrooms from "../../hooks/useClassrooms";

const RequestClassroomAccess = ({ classroomId, role = "student", buttonProps = {}, onSuccess }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { contextHolder, showMessage } = useMessageApi();
  const { 
    requestClassroomAccessAsStudent, 
    requestClassroomAccessAsTeacher 
  } = useClassrooms();

  const handleRequest = () => {
    setLoading(true);
    const requestFunction = role === "student" 
      ? requestClassroomAccessAsStudent 
      : requestClassroomAccessAsTeacher;

    requestFunction(classroomId)
      .then((res) => {
        console.log(res);
        setLoading(false);
        setOpen(false);
        showMessage(
          "success", 
          `Request sent successfully! You will be notified when ${role === "student" ? "a teacher" : "the owner"} approves your request.`
        );
        if (onSuccess) {
          onSuccess();
        } else if (buttonProps?.onSuccess) {
          buttonProps.onSuccess();
        }
      })
      .catch((err) => {
        console.log(err);
        setLoading(false);
        showMessage("error", "Unable to send request. Please try again.");
      });
  };

  return (
    <>
      {contextHolder}
      <Button
        type="primary"
        icon={<UserAddOutlined aria-hidden="true" />}
        onClick={() => setOpen(true)}
        aria-label={`Request access as ${role}`}
        {...buttonProps}
      >
        {buttonProps.children || `Request Access as ${role === "student" ? "Student" : "Teacher"}`}
      </Button>
      <Modal
        open={open}
        title={`Request Access as ${role === "student" ? "Student" : "Teacher"}`}
        onOk={handleRequest}
        onCancel={() => setOpen(false)}
        confirmLoading={loading}
        okText="Send Request"
        cancelText="Cancel"
        aria-labelledby="request-access-title"
        aria-describedby="request-access-description"
      >
        <div id="request-access-description">
          <p>
            You are requesting to join this classroom as a{" "}
            <strong>{role === "student" ? "student" : "teacher"}</strong>.
          </p>
          <p>
            {role === "student"
              ? "A teacher or administrator will review your request and notify you once approved."
              : "The classroom owner will review your request and notify you once approved."}
          </p>
        </div>
      </Modal>
    </>
  );
};

export default RequestClassroomAccess;

