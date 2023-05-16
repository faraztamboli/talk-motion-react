import React, { useState } from "react";
import { Button, Form, Input, Modal, Radio, Upload } from "antd";
import { MdOutlineCreateNewFolder } from "react-icons/md";
import useMessageApi from "../../hooks/useMessageApi";
import { InboxOutlined } from "@ant-design/icons";
import useBase64String from "../../hooks/useBase64String";
// import { useParams } from "react-router-dom";

const CollectionCreateForm = (props) => {
  const [form] = Form.useForm();

  const normFile = (e) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };

  return (
    <Modal
      open={props.open}
      title="Create a new Course"
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

        <Form.Item
          name="image"
          valuePropName="fileList"
          label="Image"
          getValueFromEvent={normFile}
        >
          <Upload.Dragger name="files" accept="image/*">
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">
              Click or drag image to this area to upload
            </p>
          </Upload.Dragger>
        </Form.Item>
      </Form>
    </Modal>
  );
};

const App = (props) => {
  const [open, setOpen] = useState(false);
  const { getBase64 } = useBase64String();
  const { contextHolder, showMessage } = useMessageApi();
  const { saveFolder, setLoading, folderId } = props;

  const iconSize = props.sm ? 20 : 24;

  function onCreate(values) {
    setLoading(true);

    getBase64(values.image[0].originFileObj)
      .then((res) => {
        console.log(res);
        saveFolder(
          values.name,
          values.description,
          folderId !== undefined ? folderId : null,
          res,
          values.modifier
        )
          .then((res) => {
            console.log(res);
            setLoading(false);
            showMessage("success", "Folder created");
          })
          .catch((err) => {
            console.log(err);
            setLoading(false);
            showMessage("error", "something went wrong!");
          });
      })
      .catch((err) => console.log(err));
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
          icon={<MdOutlineCreateNewFolder size={iconSize} />}
          onClick={() => {
            setOpen(true);
          }}
        >
          New Course
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
