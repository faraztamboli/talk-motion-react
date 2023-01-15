import React from "react";
import { Modal, Form, Button, Input, Upload } from "antd";
import { useState } from "react";
import { InboxOutlined, PlusOutlined } from "@ant-design/icons";
import useProfile from "../../hooks/useProfile";
import useBase64String from "../../hooks/useBase64String";
import { useSelector } from "react-redux";

const uploadButton = (
  <div>
    <PlusOutlined />
    <div
      style={{
        marginTop: 8,
      }}
    >
      Upload
    </div>
  </div>
);

function UpdateProfile(props) {
  const [form] = Form.useForm();
  const { profileImg } = useSelector((state) => state.user);

  const { userProfile } = props;

  const normFile = (e) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };

  return (
    <Modal
      open={props.open}
      title="Update your profile"
      okText="Upload"
      cancelText="Cancel"
      destroyOnClose="true"
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
        initialValues={{
          firstname: userProfile?.first,
          middlename: userProfile?.middle,
          lastname: userProfile?.last,
          email: userProfile?.email,
          street: userProfile?.street,
          city: userProfile?.city,
          country: userProfile?.country,
          zip: userProfile?.zip,
          line2: userProfile?.line2,
        }}
      >
        <Form.Item name="firstname">
          <Input placeholder="First Name" type="text" />
        </Form.Item>
        <Form.Item name="middlename">
          <Input placeholder="Middle Name" type="text" />
        </Form.Item>
        <Form.Item name="lastname">
          <Input placeholder="Last Name" type="text" />
        </Form.Item>
        <Form.Item name="email">
          <Input placeholder="Email" type="email" />
        </Form.Item>
        <Form.Item name="street">
          <Input placeholder="Street" type="text" />
        </Form.Item>
        <Form.Item name="city">
          <Input placeholder="City" type="text" />
        </Form.Item>
        <Form.Item name="country">
          <Input placeholder="Country" type="text" />
        </Form.Item>
        <Form.Item name="zip">
          <Input placeholder="Zip Code" type="text" />
        </Form.Item>
        <Form.Item name="line2">
          <Input placeholder="Line 2" type="text" />
        </Form.Item>

        <Form.Item
          name="smallimg"
          valuePropName="fileList"
          label="Profile Image (small) : "
          getValueFromEvent={normFile}
        >
          {/* <Upload.Dragger name="files" accept="image/*">
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">
              Click or drag image to this area to upload
            </p>
          </Upload.Dragger> */}
          <Upload
            name="avatar"
            listType="picture-card"
            className="avatar-uploader"
            showUploadList={false}
            action="https://www.mocky.io/v2/5cc8019d300000980a055e76"
          >
            {profileImg ? (
              <img
                src={profileImg}
                alt="avatar"
                style={{
                  width: "100%",
                }}
              />
            ) : (
              uploadButton
            )}
          </Upload>
        </Form.Item>

        <Form.Item
          name="largeimg"
          valuePropName="fileList"
          label="Profile Image (large) : "
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
}

const App = (props) => {
  const [open, setOpen] = useState(false);
  const { updateUserProfile } = useProfile();
  const { getBase64 } = useBase64String();

  const onCreate = (values) => {
    console.log(values);
    if (values.smallimg && !values.largeimg) {
      getBase64(values.smallimg[0].originFileObj)
        .then((res) =>
          updateUserProfile(
            values.first,
            values.middle,
            values.last,
            values.email,
            values.street,
            values.city,
            values.country,
            values.zip,
            values.line2,
            res,
            null
          )
        )
        .catch((err) => console.log(err));
    }

    if (!values.smallimg && values.largeimg) {
      getBase64(values.largeimg[0].originFileObj)
        .then((res) =>
          updateUserProfile(
            values.first,
            values.middle,
            values.last,
            values.email,
            values.street,
            values.city,
            values.country,
            values.zip,
            values.line2,
            null,
            res
          )
        )
        .catch((err) => console.log(err));
    }
    if (values.smallimg && values.largeimg) {
      getBase64(values.smallimg[0].originFileObj)
        .then((smimg) => {
          getBase64(values.largeimg[0].originFileObj)
            .then((lgimg) => {
              updateUserProfile(
                values.first,
                values.middle,
                values.last,
                values.email,
                values.street,
                values.city,
                values.country,
                values.zip,
                values.line2,
                smimg,
                lgimg
              );
            })
            .catch((err) => console.log(err));
        })
        .catch((err) => console.log(err));

      setOpen(false);
    }
  };

  return (
    <>
      <Button
        type="primary"
        shape="round"
        className="converter-btns mb-6"
        onClick={() => setOpen(true)}
      >
        Update Profile
      </Button>
      <UpdateProfile
        open={open}
        onCreate={onCreate}
        onCancel={() => {
          setOpen(false);
        }}
        userProfile={props.userProfile}
      />
    </>
  );
};

export default App;
