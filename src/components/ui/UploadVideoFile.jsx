import React, { useState } from "react";
import { Modal, Form, Button, Input, Upload } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import useUploadGestureVideo from "../../hooks/useUploadGestureVideo";
import useBase64String from "../../hooks/useBase64String";
import { useSelector } from "react-redux";

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

const App = (props) => {
  const [open, setOpen] = useState(false);
  const { uploadVideo, contextHolder, loading } = useUploadGestureVideo();
  const { getBase64 } = useBase64String();
  const { modelId } = useSelector((state) => state.model);

  const { showMessage } = props;

  const onCreate = (values) => {
    getBase64(values.dragger[0].originFileObj)
      .then((res) => uploadVideo(values.word, values.dragger[0].name, res))
      .catch((err) => console.log(err));

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
        onClick={() =>
          modelId ? setOpen(true) : showMessage("info", "please select a model")
        }
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
