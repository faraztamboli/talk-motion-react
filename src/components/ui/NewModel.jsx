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
      aria-labelledby="new-model-title"
      aria-describedby="new-model-description"
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
          <Input
            id="new-model-title"
            aria-label="Model title"
            aria-required="true"
          />
        </Form.Item>
        <Form.Item name="description" label="Description">
          <Input.TextArea
            id="new-model-description"
            aria-label="Model description"
            rows={4}
          />
        </Form.Item>
        <Form.Item
          name="modifier"
          label="Visibility"
          className="collection-create-form_last-form-item"
        >
          <Radio.Group aria-label="Model visibility setting">
            <Radio value={true} aria-label="Public model">
              Public
            </Radio>
            <Radio value={false} aria-label="Private model">
              Private
            </Radio>
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
          size="middle"
          icon={<MdOutlineNewLabel size={iconSize} aria-hidden="true" />}
          onClick={() => {
            setOpen(true);
          }}
          aria-label="Create new model"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setOpen(true);
            }
          }}
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
