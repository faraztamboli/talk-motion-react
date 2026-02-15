import React, { useState } from "react";
import { Button, Form, Input, Modal, Radio, Upload } from "antd";
import { MdOutlineNewLabel } from "react-icons/md";
import { InboxOutlined } from "@ant-design/icons";
import useMessageApi from "../../hooks/useMessageApi";
import useClassrooms from "../../hooks/useClassrooms";
import useBase64String from "../../hooks/useBase64String";

const CollectionCreateForm = (props) => {
  const { normFile } = useClassrooms();
  const [form] = Form.useForm();

  return (
    <Modal
      open={props.open}
      title="Create a new Classroom"
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
      aria-labelledby="new-classroom-title"
      aria-describedby="new-classroom-description"
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
              message: "Please input the name of classroom!",
            },
          ]}
        >
          <Input
            id="new-classroom-name"
            aria-label="Classroom name"
            aria-required="true"
          />
        </Form.Item>
        <Form.Item name="description" label="Description">
          <Input.TextArea
            id="new-classroom-description"
            aria-label="Classroom description"
            rows={4}
          />
        </Form.Item>

        <Form.Item
          name="dragger"
          valuePropName="fileList"
          getValueFromEvent={normFile}
          label="Classroom Image"
        >
          <Upload.Dragger
            name="files"
            accept="image/*"
            aria-label="Upload classroom image"
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined aria-hidden="true" />
            </p>
            <p className="ant-upload-text">
              Click or drag image to this area to upload
            </p>
          </Upload.Dragger>
        </Form.Item>

        <Form.Item
          name="modifier"
          label="Visibility"
          className="collection-create-form_last-form-item"
        >
          <Radio.Group aria-label="Classroom visibility setting">
            <Radio value={true} aria-label="Public classroom">
              Public
            </Radio>
            <Radio value={false} aria-label="Private classroom">
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
  const { getBase64 } = useBase64String();
  const { contextHolder, showMessage } = useMessageApi();
  const { createClassroom, setLoading } = props;

  const iconSize = props.sm ? 20 : 24;

  function onCreate(values) {
    console.log(values);
    setLoading(true);
    getBase64(values.dragger[0].originFileObj)
      .then((res) => {
        console.log(res);
        createClassroom(values.name, values.description, res, values.modifier)
          .then((res) => {
            console.log(res);
            setLoading(false);
            showMessage("success", "Classroom created!");
          })
          .catch((err) => {
            console.log(err);
            setLoading(false);
            showMessage("error", "Cannot create classroom!");
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
          icon={<MdOutlineNewLabel size={iconSize} aria-hidden="true" />}
          onClick={() => {
            setOpen(true);
          }}
          aria-label="Create new classroom"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setOpen(true);
            }
          }}
        >
          Create Classroom
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
