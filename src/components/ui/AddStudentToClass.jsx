import React, { useState } from "react";
import { Form, Input, Modal } from "antd";
import useMessageApi from "../../hooks/useMessageApi";

const CollectionCreateForm = (props) => {
  const [form] = Form.useForm();

  return (
    <Modal
      open={props.open}
      title="Add student to classroom"
      destroyOnClose
      okText="Add"
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
              message: "Please input the username of student!",
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
  const { addStudentToClass, classroomId, setLoading } = props;

  function onCreate(values) {
    console.log(values);
    setLoading(true);

    addStudentToClass(classroomId, values.username)
      .then((res) => {
        console.log(res);
        setLoading(false);
        showMessage("success", "Teacher added to classroom!");
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
          Add Student
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
