import React, { useState } from "react";
import { Button, Form, Input, Modal, Radio } from "antd";
import { MdOutlineCreateNewFolder } from "react-icons/md";
import useMessageApi from "../../hooks/useMessageApi";
// import { useParams } from "react-router-dom";

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
          name="name"
          label="Name"
          rules={[
            {
              required: true,
              message: "Please input the name of folder!",
            },
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="description"
          label="Description"
          rules={[
            {
              required: true,
              message: "Please input the description of folder!",
            },
          ]}
        >
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
  const { saveFolder, setLoading, parentFolderId } = props;

  const iconSize = props.sm ? 20 : 24;

  function onCreate(values) {
    setLoading(true);
    saveFolder(values.name, values.description, parentFolderId, values.modifier)
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
          icon={<MdOutlineCreateNewFolder size={iconSize} className="pr-1" />}
          onClick={() => {
            setOpen(true);
          }}
        >
          New Folder
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
