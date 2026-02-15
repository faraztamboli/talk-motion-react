import React, { useState, useEffect } from "react";
import { Button, Form, Input, Modal, Radio } from "antd";
import useModels from "../../hooks/useModels";
import useMessageApi from "../../hooks/useMessageApi";

const CollectionCreateForm = (props) => {
  const [modelDetails, setModelDetails] = useState();
  const { getModel } = useModels();
  const [form] = Form.useForm();

  const { modelid } = props;

  useEffect(() => {
    console.log("inside useEffect");
    getModel(modelid)
      .then((res) => {
        res = res[0];
        console.log(res);
        setModelDetails(res);
      })
      .catch((err) => console.log(err));
  }, []);

  return (
    <Modal
      open={props.open}
      title="Update Model"
      okText="Update"
      cancelText="Cancel"
      destroyOnClose
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
      aria-labelledby="update-model-title"
      aria-describedby="update-model-description"
    >
      <Form
        form={form}
        layout="vertical"
        name="form_in_modal"
        initialValues={{
          title: modelDetails?.title,
          description: modelDetails?.description,
          modifier: modelDetails?.is_public,
        }}
      >
        <Form.Item
          name="title"
          label="Title"
          rules={[
            {
              required: true,
              message: "Please input the title of collection!",
            },
          ]}
        >
          <Input
            id="update-model-title"
            aria-label="Model title"
            aria-required="true"
          />
        </Form.Item>
        <Form.Item name="description" label="Description">
          <Input.TextArea
            id="update-model-description"
            aria-label="Model description"
            rows={4}
          />
        </Form.Item>
        <Form.Item
          name="modifier"
          label="Visibility"
          className="collection-create-form_last-form-item"
        >
          <Radio.Group
            aria-label="Model visibility setting"
          >
            <Radio value={true} aria-label="Public model">
              Public
            </Radio>
            <Radio value={false} aria-label="Private model">
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
  const { updateModel } = useModels();
  const { contextHolder, showMessage } = useMessageApi();
  const { model_id } = props;

  const onCreate = (values) => {
    props.setUpdateButtonLoading && props.setUpdateButtonLoading(true);
    updateModel(model_id, values.title, values.description, values.modifier)
      // eslint-disable-next-line
      .then((res) => {
        showMessage("success", "Model updated successfully!");
        props.showMessage &&
          props.showMessage("success", "Model updated successfully!");
        setTimeout(() => {
          props.setLoading && props.setLoading(!props.loading);
        }, 2000);
        props.setUpdateButtonLoading && props.setUpdateButtonLoading(false);
      })
      .catch((err) => {
        console.log(err);
        showMessage("error", "error while updating model");
        props.setLoading && props.setLoading(false);
        props.setUpdateButtonLoading && props.setUpdateButtonLoading(false);
      });

    setOpen(false);
  };

  return (
    <>
      {contextHolder}
      {props.from === "modelscard" && (
        <>
          <button
            type="button"
            style={{
              width: "100%",
              background: "none",
              border: "none",
              padding: 0,
              textAlign: "left",
              cursor: "pointer",
              color: "inherit",
              fontSize: "inherit",
              fontFamily: "inherit",
            }}
            onClick={() => {
              setOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setOpen(true);
              }
            }}
            aria-label="Edit model"
          >
            Edit
          </button>
          <CollectionCreateForm
            open={open}
            onCreate={onCreate}
            onCancel={() => {
              setOpen(false);
            }}
            modelid={model_id}
          />
        </>
      )}

      {props.from !== "modelscard" && (
        <>
          <Button
            type="primary"
            shape="round"
            className="converter-btns mt-5 mr-3"
            loading={props.updateButtonLoading}
            onClick={() => setOpen(true)}
          >
            Update Model
          </Button>

          <CollectionCreateForm
            open={open}
            onCreate={onCreate}
            onCancel={() => setOpen(false)}
            modelid={model_id}
          />
        </>
      )}
    </>
  );
};

export default App;
