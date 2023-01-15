import React, { useState, useEffect } from "react";
import { Button, Descriptions, Popconfirm, Skeleton } from "antd";
import { Link, useNavigate, useParams } from "react-router-dom";
import useModels from "../hooks/useModels";
import useMessageApi from "../hooks/useMessageApi";
import UpdateModel from "../components/ui/UpdateModel";

function UserModel(props) {
  const [modelDetails, setModelDetails] = useState();
  const [loading, setLoading] = useState(true);
  const [deleteButtonLoading, setDeleteButtonLoading] = useState(false);
  const [updateButtonLoading, setUpdateButtonLoading] = useState(false);
  const { getModel, deleteModel } = useModels();
  const { modelid } = useParams();
  const { contextHolder, showMessage } = useMessageApi();
  const navigate = useNavigate();

  const style = props.collapsedWidth === 0 ? { padding: 8 } : { padding: 24 };

  const handleDeleteModel = () => {
    setDeleteButtonLoading(true);
    deleteModel(modelid)
      .then((res) => {
        console.log(res);
        showMessage("success", "Model Deleted!");
        setDeleteButtonLoading(false);
        setTimeout(() => {
          navigate(-1);
        }, 2500);
      })
      .catch((err) => {
        console.log(err);
        showMessage("error", "Cannot delete the model");
        setDeleteButtonLoading(false);
      });
  };

  useEffect(() => {
    getModel(modelid)
      .then((res) => {
        setModelDetails(res);
        setLoading(false);
      })
      .catch((err) => {
        console.log(err);
        setLoading(false);
      });
  }, [updateButtonLoading]);

  return (
    <>
      {contextHolder}
      <div className="layout-bg mh-100vh" style={style}>
        <h2>Model Details</h2>
        {!loading &&
          modelDetails &&
          modelDetails.map((model) => {
            return (
              <div key={model.id}>
                <Descriptions
                  layout="horizontal"
                  column={1}
                  bordered
                  labelStyle={{ backgroundColor: "whitesmoke" }}
                >
                  <Descriptions.Item label="Model Name">
                    {model?.title}
                  </Descriptions.Item>
                  <Descriptions.Item label="Description">
                    {model?.description}
                  </Descriptions.Item>
                  <Descriptions.Item label="Visibility">
                    {model.is_public ? "Public" : "Private"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Owner">
                    {model?.create_user}
                  </Descriptions.Item>
                  <Descriptions.Item label="Create Date">
                    {model?.create_time}
                  </Descriptions.Item>
                  <Descriptions.Item label="Status">
                    {model.status ? model.status : "null"}
                  </Descriptions.Item>
                </Descriptions>
              </div>
            );
          })}

        {loading && <Skeleton active />}

        <Link to="files">
          <Button
            type="primary"
            className="mt-5 mr-3 converter-btns"
            shape="round"
          >
            Model Files
          </Button>
        </Link>

        <Link to="concepts">
          <Button
            type="primary"
            className="mt-5 mr-3 converter-btns"
            shape="round"
          >
            Model Concepts
          </Button>
        </Link>

        <UpdateModel
          model_id={modelid}
          from="usermodels"
          updateButtonLoading={updateButtonLoading}
          setUpdateButtonLoading={setUpdateButtonLoading}
        />

        <Popconfirm
          title="Are you sure to delete this model?"
          onConfirm={handleDeleteModel}
        >
          <Button
            type="primary"
            danger
            loading={deleteButtonLoading}
            shape="round"
            className="mt-5 converter-btns"
          >
            Delete Model
          </Button>
        </Popconfirm>
      </div>
    </>
  );
}

export default UserModel;
