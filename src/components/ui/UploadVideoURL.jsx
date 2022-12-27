import React from "react";
import { Modal, Form, Button, Input, message } from "antd";
import { useState } from "react";
import useUploadGestureVideo from "../../hooks/useUploadGestureVideo";

function UploadVideoURL(props) {
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
        <Form.Item name="word">
          <Input placeholder="word" type="text" />
        </Form.Item>
        <Form.Item name="videoURL">
          <Input placeholder="Video URL" />
        </Form.Item>
      </Form>
    </Modal>
  );
}

const App = () => {
  const [open, setOpen] = useState(false);
  const { uploadGestureVideoURL } = useUploadGestureVideo();
  const [messageApi, contextHolder] = message.useMessage();
  const onCreate = (values) => {
    uploadGestureVideoURL(values.word, values.videoURL);
    messageApi.open({
      type: "success",
      content: "Video uploaded!",
    });
    setOpen(false);
  };

  return (
    <>
      {contextHolder}
      <Button
        type="primary"
        shape="round"
        className="converter-btns"
        onClick={() => setOpen(true)}
      >
        Upload
      </Button>
      <UploadVideoURL
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
