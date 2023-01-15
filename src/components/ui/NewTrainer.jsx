import React, { useState } from "react";
import { Button, Form, Input, Modal } from "antd";
import { MdPersonAdd } from "react-icons/md";

const CollectionCreateForm = (props) => {
  const [form] = Form.useForm();

  return (
    <Modal
      open={props.open}
      title="Add a new Trainer"
      okText="Create"
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
          label="username"
          rules={[
            {
              required: true,
              message: "Please input the username of trainer",
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
  const { addNewTrainer } = props;

  const onCreate = (values) => {
    console.log("Received values of form: ", values);
    addNewTrainer(props.id, values.username).then((res) => console.log(res));
    setOpen(false);
  };

  return (
    <div>
      <Button
        style={{ border: "none", marginLeft: "1rem" }}
        icon={<MdPersonAdd size={23} />}
        onClick={() => {
          setOpen(true);
        }}
      />
      <CollectionCreateForm
        open={open}
        onCreate={onCreate}
        onCancel={() => {
          setOpen(false);
        }}
      />
    </div>
  );
};

export default App;
