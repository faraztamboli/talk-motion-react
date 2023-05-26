import React, { useState } from "react";
import { Modal, Form, Input, Button, Tabs, List, Typography } from "antd";
import { AndroidOutlined, AppleOutlined } from "@ant-design/icons";
import useMessageApi from "../../hooks/useMessageApi";
import useSubtitleVideos from "../../hooks/useSubtitleVideos";
import useModels from "../../hooks/useModels";
import useFolders from "../../hooks/useFolders";

function ModelPrice(props) {
  const [videoRecordings, setVideoRecordings] = useState([]);
  const [name, setName] = useState(null);
  const [modals, setModals] = useState([]);
  const { getMyVideoRecordings } = useSubtitleVideos();
  const { getUserModels } = useModels();
  const [form] = Form.useForm();

  const { Search } = Input;

  function handleOnOk(value) {
    form
      .validateFields()
      .then(({ values }) => {
        form.resetFields();
        props.onCreate({ values, value });
      })
      .catch((info) => {
        console.log("Validate Failed:", info);
      });
  }

  function handleRecordingSearch(value) {
    getMyVideoRecordings(value, 0, 99999)
      .then((res) => {
        console.log(res[0]);
        setVideoRecordings(res[0]);
      })
      .catch((err) => console.log(err));
  }

  function handleModalsSearch(value) {
    getUserModels(value, 0, 9999)
      .then((res) => {
        console.log(res);
        setModals(res[0]);
      })
      .catch((err) => console.log(err));
  }

  function handleRecordingSelection(id) {
    handleOnOk({ id, isRecording: true, name });
    console.log("Inside recording selection");
  }

  function handleModalsSelection(id) {
    handleOnOk({ id, isRecording: false, name });
  }

  function handleNameChange(e) {
    setName(e.target.value);
  }

  return (
    <Modal
      open={props.open}
      title="Add a video recording or a model"
      destroyOnClose
      okText="Add"
      cancelText="Cancel"
      onCancel={props.onCancel}
      onOk={handleOnOk}
    >
      <Tabs
        defaultActiveKey="2"
        items={[AppleOutlined, AndroidOutlined].map((Icon, i) => {
          const id = String(i + 1);
          return {
            label: (
              <span>
                <Icon />
                {id == 1 ? "Recording" : "Model"}
              </span>
            ),
            key: id,
            children:
              id == 1 ? (
                <Form form={form} layout="vertical" name="userForm">
                  <Form.Item
                    name="name"
                    label="Name"
                    // rules={[
                    //   {
                    //     required: true,
                    //     message: "Please enter the name!",
                    //   },
                    // ]}
                  >
                    <Input value={name} onChange={handleNameChange} />
                  </Form.Item>
                  <Form.Item name="recordingSearch">
                    <Search
                      placeholder="input search text"
                      enterButton="Search"
                      size="large"
                      onSearch={handleRecordingSearch}
                    />
                  </Form.Item>
                  <List
                    bordered
                    dataSource={videoRecordings}
                    renderItem={(item) => (
                      <List.Item
                        className="cursor-pointer"
                        onClick={() => handleRecordingSelection(item.id)}
                      >
                        <Typography.Text mark>[VIDEO]</Typography.Text>
                        {item.original_video_title}
                      </List.Item>
                    )}
                  />
                </Form>
              ) : (
                <Form form={form} layout="vertical" name="userForm">
                  <Form.Item
                    name="name"
                    label="Name"
                    rules={[
                      {
                        required: true,
                        message: "Please enter the name!",
                      },
                    ]}
                  >
                    <Input />
                  </Form.Item>
                  <Form.Item name="recordingSearch">
                    <Search
                      placeholder="input search text"
                      enterButton="Search"
                      size="large"
                      onSearch={handleModalsSearch}
                    />
                  </Form.Item>
                  <List
                    bordered
                    dataSource={modals}
                    renderItem={(item) => (
                      <List.Item
                        className="cursor-pointer"
                        onClick={() => handleModalsSelection(item.id)}
                      >
                        <Typography.Text mark>[MODAL]</Typography.Text>
                        {item.title}
                      </List.Item>
                    )}
                  />
                </Form>
              ),
          };
        })}
      />
    </Modal>
  );
}

function App(props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { saveFolderContent } = useFolders();
  const { contextHolder, showMessage } = useMessageApi();

  const { folderId } = props;

  const onCreate = (values) => {
    setLoading(true);
    console.log(values);
    if (values.value.isRecording) {
      saveFolderContent(
        folderId,
        values.value.id,
        "recording",
        values.value.name
      )
        .then((res) => {
          console.log(res);
          setLoading(false);
          showMessage("success", "Content saved successfully!");
        })
        .catch((err) => {
          console.log(err);
          setLoading(false);
          showMessage("error", "something went wrong!");
        });
    } else {
      saveFolderContent(folderId, values.value.id, "model", values.value.name)
        .then((res) => {
          console.log(res);
          setLoading(false);
          showMessage("success", "Content saved successfully!");
        })
        .catch((err) => {
          console.log(err);
          setLoading(false);
          showMessage("error", "something went wrong!");
        });
    }
    setOpen(false);
  };

  return (
    <>
      {contextHolder}
      <Button
        type="primary"
        className="converter-btns mr-3"
        onClick={() => setOpen(true)}
      >
        Add Content
      </Button>

      <ModelPrice
        loading={loading}
        open={open}
        onCreate={onCreate}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}

export default App;
