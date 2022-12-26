import React, { useState } from "react";
import { Modal, Form, Button, Input, Tooltip } from "antd";
import { MdOutlineDone } from "react-icons/md";
import Webcam from "react-webcam";
import useUploadGestureVideo from "../../hooks/useUploadGestureVideo";
import useMediaStream from "../../hooks/useMediaStream";

function RecordVideo(props) {
  const {
    webcamRef,
    capturing,
    recordedChunks,
    base64data,
    handleStartCaptureClick,
    handleStopCaptureClick,
    handleDownload,
  } = useMediaStream();
  props.setBase64String(base64data);
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

        <Form.Item name="videoRecording" valuePropName="videoRecording">
          <>
            <Webcam
              audio={false}
              mirrored={true}
              height={350}
              width="100%"
              ref={webcamRef}
            />
            {capturing ? (
              <Button type="primary" onClick={handleStopCaptureClick}>
                Stop
              </Button>
            ) : (
              <Button type="primary" onClick={handleStartCaptureClick}>
                Start
              </Button>
            )}

            {recordedChunks.length > 0 && (
              <Tooltip title="useVideo" placement="bottom" showArrow={false}>
                <Button
                  className="ml-6"
                  type="primary"
                  shape="circle"
                  onClick={handleDownload}
                  icon={<MdOutlineDone />}
                />
              </Tooltip>
            )}
          </>
        </Form.Item>
      </Form>
    </Modal>
  );
}

const App = () => {
  const [base64String, setBase64String] = useState();
  const [open, setOpen] = useState(false);
  const { uploadVideo } = useUploadGestureVideo();
  const onCreate = (values) => {
    uploadVideo(values.word, `${values.word}.mp4`, base64String);
    console.log(values, base64String);
  };

  return (
    <>
      <Button
        type="primary"
        shape="round"
        className="converter-btns"
        onClick={() => setOpen(true)}
      >
        Upload
      </Button>
      <RecordVideo
        open={open}
        onCreate={onCreate}
        onCancel={() => {
          setOpen(false);
        }}
        setBase64String={setBase64String}
      />
    </>
  );
};

export default App;
