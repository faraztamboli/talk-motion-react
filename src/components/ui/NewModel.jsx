import React, { useState } from "react";
import { Button, Form, Input, Modal, Radio } from "antd";
import { MdOutlineNewLabel } from "react-icons/md";

const CollectionCreateForm = (props) => {
  const [form] = Form.useForm();
  return (
    <Modal
      open={props.open}
      title="Create a new Model"
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
          name="title"
          label="Title"
          rules={[
            {
              required: true,
              message: "Please input the title of collection!",
            },
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item name="description" label="Description">
          <Input type="textarea" />
        </Form.Item>
        <Form.Item
          name="modifier"
          className="collection-create-form_last-form-item"
        >
          <Radio.Group>
            <Radio checked value="public">
              Public
            </Radio>
            <Radio value="private">Private</Radio>
          </Radio.Group>
        </Form.Item>
      </Form>
    </Modal>
  );
};

const App = (props) => {
  const [open, setOpen] = useState(false);
  const { createNewModel } = props;

  const btnStyle = props.sm ? "medium" : "large";
  const iconSize = props.sm ? 20 : 24;

  function onCreate(values) {
    createNewModel(values.title, values.description);
    setOpen(false);
  }

  return (
    <div>
      <Button
        className="flex flex-center-center converter-btns"
        type="primary"
        size={btnStyle}
        shape="round"
        icon={<MdOutlineNewLabel size={iconSize} />}
        onClick={() => {
          setOpen(true);
        }}
        style={{ padding: ".5rem 2rem" }}
      >
        Create Model
      </Button>
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
