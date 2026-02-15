import React from "react";
import { Modal, Form, Button, Input, Upload } from "antd";
import { useState } from "react";
import { InboxOutlined, PlusOutlined } from "@ant-design/icons";
import useProfile from "../../hooks/useProfile";
import useBase64String from "../../hooks/useBase64String";
import { useSelector } from "react-redux";

const uploadButton = (
  <div>
    <PlusOutlined aria-hidden="true" />
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
      okText="Update"
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
      aria-labelledby="update-profile-title"
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
        <Form.Item name="firstname" label="First Name">
          <Input
            id="update-profile-firstname"
            placeholder="First Name"
            type="text"
            aria-label="First name"
          />
        </Form.Item>
        <Form.Item name="middlename" label="Middle Name">
          <Input
            id="update-profile-middlename"
            placeholder="Middle Name"
            type="text"
            aria-label="Middle name"
          />
        </Form.Item>
        <Form.Item name="lastname" label="Last Name">
          <Input
            id="update-profile-lastname"
            placeholder="Last Name"
            type="text"
            aria-label="Last name"
          />
        </Form.Item>
        <Form.Item
          name="email"
          label="Email"
          rules={[
            {
              type: "email",
              message: "Please enter a valid email address",
            },
          ]}
        >
          <Input
            id="update-profile-email"
            placeholder="Email"
            type="email"
            aria-label="Email address"
          />
        </Form.Item>
        <Form.Item name="street" label="Street">
          <Input
            id="update-profile-street"
            placeholder="Street"
            type="text"
            aria-label="Street address"
          />
        </Form.Item>
        <Form.Item name="city" label="City">
          <Input
            id="update-profile-city"
            placeholder="City"
            type="text"
            aria-label="City"
          />
        </Form.Item>
        <Form.Item name="country" label="Country">
          <Input
            id="update-profile-country"
            placeholder="Country"
            type="text"
            aria-label="Country"
          />
        </Form.Item>
        <Form.Item name="zip" label="Zip Code">
          <Input
            id="update-profile-zip"
            placeholder="Zip Code"
            type="text"
            aria-label="Zip code"
          />
        </Form.Item>
        <Form.Item name="line2" label="Address Line 2">
          <Input
            id="update-profile-line2"
            placeholder="Line 2"
            type="text"
            aria-label="Address line 2"
          />
        </Form.Item>

        <Form.Item
          name="smallimg"
          valuePropName="fileList"
          label="Profile Image (small) : "
          getValueFromEvent={normFile}
        >
          <Upload
            name="avatar"
            accept="image/*"
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
              <InboxOutlined aria-hidden="true" />
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

  const { profileImg } = useSelector((state) => state.user);

  const onCreate = (values) => {
    console.log(values);
    if (!values.smallimg && !values.largeimg) {
      if (profileImg) {
        console.log(profileImg);
        updateUserProfile(
          values.firstname,
          values.middlename,
          values.lastname,
          values.email,
          values.street,
          values.city,
          values.country,
          values.zip,
          values.line2,
          profileImg,
          null
        )
          .then((res) => {
            console.log(res);
          })
          .catch((err) => {
            console.log(err);
          });
      }
    }
    if (values.smallimg && !values.largeimg) {
      getBase64(values.smallimg[0].originFileObj)
        .then((res) =>
          updateUserProfile(
            values.firstname,
            values.middlename,
            values.lastname,
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
            values.firstname,
            values.middlename,
            values.lastname,
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
                values.firstname,
                values.middlename,
                values.lastname,
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
        aria-label="Open update profile form"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setOpen(true);
          }
        }}
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
