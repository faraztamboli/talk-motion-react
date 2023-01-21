import React, { useState } from "react";
import { Button, Form, Input, Modal, Radio } from "antd";
import { MdOutlineNewLabel } from "react-icons/md";
import useMessageApi from "../../hooks/useMessageApi";

const CollectionCreateForm = (props) => {
  const [form] = Form.useForm();
  return (
    <Modal
      open={props.open}
      title="Create a new Model"
      destroyOnClose
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
            <Radio autoFocus checked value={true}>
              Public
            </Radio>
            <Radio value={false}>Private</Radio>
          </Radio.Group>
        </Form.Item>
      </Form>
    </Modal>
  );
};

const App = (props) => {
  const [open, setOpen] = useState(false);
  const { contextHolder, showMessage } = useMessageApi();
  const { createNewModel, setLoading } = props;

  const btnStyle = props.sm ? "medium" : "large";
  const iconSize = props.sm ? 20 : 24;

  function onCreate(values) {
    setLoading(true);
    createNewModel(values.title, values.description, values.modifier)
      .then((res) => {
        console.log(res);
        setLoading(false);
        showMessage("success", "Model created");
      })
      .catch((err) => {
        console.log(err);
        setLoading(false);
        showMessage("error", "Cannot create model");
      });
    setOpen(false);
  }

  return (
    <>
      {contextHolder}
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
    </>
  );
};

export default App;
