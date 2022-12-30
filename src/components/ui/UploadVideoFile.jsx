import React, { useState } from "react";
import { Modal, Form, Button, Input, Upload } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import useUploadGestureVideo from "../../hooks/useUploadGestureVideo";

function UploadVideoFile(props) {
  const [form] = Form.useForm();
  const { normFile } = useUploadGestureVideo();

  return (
    <Modal
      open={props.open}
      title="Upload a new video for a word"
      okText="Upload"
      destroyOnClose="true"
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
        <Form.Item name="word">
          <Input placeholder="word" type="text" />
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
}

const App = () => {
  const [open, setOpen] = useState(false);
  const { uploadVideo, contextHolder, loading } = useUploadGestureVideo();

  const onCreate = (values) => {
    let reader = new FileReader();
    reader.readAsDataURL(values.dragger[0].originFileObj);
    reader.onload = function () {
      console.log(reader.result);
      uploadVideo(values.word, values.dragger[0].name, reader.result);
    };
    reader.onerror = function () {
      console.log(reader.error);
    };

    setOpen(false);
  };

  return (
    <>
      {contextHolder}
      <Button
        type="primary"
        shape="round"
        loading={loading}
        className="converter-btns"
        onClick={() => setOpen(true)}
      >
        Upload
      </Button>
      <UploadVideoFile
        open={open}
        onCreate={onCreate}
        onCancel={() => {
          setOpen(false);
        }}
      />
    </>
  );
};

export default App;
