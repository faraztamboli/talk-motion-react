import React, { useState } from "react";
import { Form, Input, Modal } from "antd";
import useMessageApi from "../../hooks/useMessageApi";

const CollectionCreateForm = (props) => {
  const [form] = Form.useForm();

  return (
    <Modal
      open={props.open}
      title="Remove student from classroom"
      destroyOnClose
      okText="Remove"
      cancelText="Cancel"
      onCancel={props.onCancel}
      onOk={() => {
        form
          .validateFields()
          .then((values) => {
            form.resetFields();
            props.onCreate(values);
          })
          .catch((info) => {
            console.log("Validate Failed:", info);
          });
      }}
    >
      <Form
        form={form}
        layout="vertical"
        name="form_in_modal"
        initialValues={{ modifier: "public" }}
      >
        <Form.Item
          name="username"
          label="Username"
          rules={[
            {
              required: true,
              message: "Please input the name of student!",
            },
          ]}
        >
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  );
};

const App = (props) => {
  const [open, setOpen] = useState(false);
  const { contextHolder, showMessage } = useMessageApi();
  const { removeStudentFromClass, classroomId, setLoading } = props;

  function onCreate(values) {
    console.log(values);
    setLoading(true);

    removeStudentFromClass(classroomId, values.username)
      .then((res) => {
        console.log(res);
        setLoading(false);
        showMessage("success", "Student removed from classroom!");
      })
      .catch((err) => {
        console.log(err);
        setLoading(false);
        showMessage("error", "something went wrong!");
      });

    setOpen(false);
  }

  return (
    <>
      {contextHolder}
      <div>
        <div
          style={{ width: "100%" }}
          onClick={() => {
            setOpen(true);
          }}
        >
          Remove Student
        </div>
        <CollectionCreateForm
          open={open}
          onCreate={onCreate}
          onCancel={() => {
            setOpen(false);
          }}
        />
      </div>
    </>
  );
};

export default App;
