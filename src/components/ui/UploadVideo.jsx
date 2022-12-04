import React, { useState } from "react";
import { InboxOutlined } from "@ant-design/icons";
import { Button, Form, Input, Modal, Upload } from "antd";
import useUploadGestureVideo from "../../hooks/useUploadGestureVideo";

const CollectionCreateForm = (props) => {
  const { normFile } = useUploadGestureVideo();
  const [form] = Form.useForm();

  return (
    <Modal
      open={props.open}
      title="Upload a new video for a word"
      okText="Upload"
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
          name="word"
          label="word"
          rules={[
            {
              required: true,
              message: "Please input the title of collection!",
            },
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="dragger"
          valuePropName="fileList"
          getValueFromEvent={normFile}
          noStyle
        >
          <Upload.Dragger name="files" accept="video/*">
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">
              Click or drag video to this area to upload
            </p>
          </Upload.Dragger>
        </Form.Item>
      </Form>
    </Modal>
  );
};

const App = () => {
  const [open, setOpen] = useState(false);
  const { uploadVideo } = useUploadGestureVideo();

  const onCreate = (values) => {
    // console.log("Received values of form: ", values);
    uploadVideo(values.word, values.dragger[0].name, values.dragger[0]);
    setOpen(false);
  };

  return (
    <div>
      <Button
        className="converter-btns"
        type="primary"
        shape="round"
        onClick={() => setOpen(true)}
      >
        Upload Video
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
