import React, { useState, useEffect } from "react";
import { Form, Input, Modal, Radio, Upload } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import useMessageApi from "../../hooks/useMessageApi";
import useClassrooms from "../../hooks/useClassrooms";
import useBase64String from "../../hooks/useBase64String";

const CollectionCreateForm = (props) => {
  const { normFile } = useClassrooms();
  const [form] = Form.useForm();

  React.useEffect(() => {
    if (props.open && props.initialValues) {
      form.setFieldsValue(props.initialValues);
    } else if (props.open) {
      form.resetFields();
    }
  }, [props.open, props.initialValues, form]);

  return (
    <Modal
      open={props.open}
      title="Update Classroom"
      destroyOnClose
      okText="Update"
      cancelText="Cancel"
      onCancel={props.onCancel}
      onOk={() => {
        form
          .validateFields()
          .then((values) => {
            props.onCreate(values);
          })
          .catch((info) => {
            console.log("Validate Failed:", info);
          });
      }}
      aria-labelledby="update-classroom-title"
      aria-describedby="update-classroom-description"
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
          <Input />
        </Form.Item>
        <Form.Item name="description" label="Description">
          <Input type="textarea" />
        </Form.Item>

        <Form.Item
          name="dragger"
          valuePropName="fileList"
          getValueFromEvent={normFile}
          noStyle
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

        <Form.Item name="notes" label="Notes">
          <Input />
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
  const { getBase64 } = useBase64String();
  const { contextHolder, showMessage } = useMessageApi();
  const { updateClassroom, setLoading, classroom } = props;

  function onCreate(values) {
    console.log(values);
    setLoading(true);
    
    // Handle image upload if provided
    const imagePromise = values.dragger && values.dragger.length > 0
      ? getBase64(values.dragger[0].originFileObj)
      : Promise.resolve(classroom?.image || null);

    imagePromise
      .then((imageBase64) => {
        console.log(imageBase64);
        updateClassroom(
          classroom?.id,
          values.name,
          values.description,
          imageBase64,
          values.modifier,
          values.notes || ""
        )
          .then((res) => {
            console.log(res);
            setLoading(false);
            showMessage("success", "Classroom updated successfully!");
            setOpen(false);
            if (props.onUpdate) props.onUpdate();
          })
          .catch((err) => {
            console.log(err);
            setLoading(false);
            showMessage("error", "Cannot update classroom!");
          });
      })
      .catch((err) => {
        console.log(err);
        setLoading(false);
        showMessage("error", "Error processing image");
      });
  }

  return (
    <>
      {contextHolder}
      <div>
        <div
          style={{ width: "100%", cursor: "pointer" }}
          onClick={() => {
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setOpen(true);
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="Update classroom"
        >
          Update Classroom
        </div>
        <CollectionCreateForm
          open={open}
          onCreate={onCreate}
          onCancel={() => {
            setOpen(false);
          }}
          initialValues={classroom ? {
            name: classroom.name,
            description: classroom.description,
            modifier: classroom.is_public,
            notes: classroom.notes || "",
          } : {}}
        />
      </div>
    </>
  );
};

export default App;
