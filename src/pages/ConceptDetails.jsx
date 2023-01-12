import { Button, Descriptions, Skeleton } from "antd";
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useMessageApi from "../hooks/useMessageApi";
import useModels from "../hooks/useModels";

function ConceptDetails(props) {
  const [concept, setConcept] = useState();
  const [loading, setLoading] = useState(true);
  const [buttonLoading, setButtonLoading] = useState(false);
  const { getConceptDetails, deleteModelConcept } = useModels();
  const { showMessage, contextHolder } = useMessageApi();

  const { modelid, concepttitle } = useParams();
  const navigate = useNavigate();

  const style = props.collapsedWidth === 0 ? { padding: 8 } : { padding: 24 };

  const handleDeleteConcept = () => {
    setButtonLoading(true);
    deleteModelConcept(modelid, concepttitle)
      .then((res) => {
        console.log(res);
        setButtonLoading(false);
        showMessage("success", "Concept Deleted!");
        setTimeout(() => {
          navigate(-1);
        }, 2000);
      })
      .catch((err) => {
        console.log(err);
        setButtonLoading(false);
        showMessage("error", "Cannot Delete the Concept");
      });
  };

  useEffect(() => {
    getConceptDetails(modelid, concepttitle)
      .then((res) => {
        res = JSON.parse(res);
        console.log(res);
        setConcept(res);
        setLoading(false);
      })
      .catch((err) => {
        console.log(err);
        setLoading(false);
      });
  }, []);

  return (
    <>
      {contextHolder}
      <div style={style} className="layout-bg mh-100vh">
        <h2>Concept Details</h2>
        {!loading &&
          concept?.length > 0 &&
          concept.map((conceptElem) => {
            return (
              <div key={conceptElem?.sample_id} className="mt-4">
                <Descriptions
                  layout="horizontal"
                  column={1}
                  bordered
                  labelStyle={{ backgroundColor: "whitesmoke" }}
                >
                  <Descriptions.Item label="Concept">
                    {concepttitle}
                  </Descriptions.Item>
                  <Descriptions.Item label="Sample Id">
                    {conceptElem?.sample_id}
                  </Descriptions.Item>
                  <Descriptions.Item label="Frames">
                    {conceptElem?.frame_count}
                  </Descriptions.Item>
                  <Descriptions.Item label="Min Timestamp">
                    {conceptElem?.client_js_timestamp_min}
                  </Descriptions.Item>
                  <Descriptions.Item label="Max Timestamp">
                    {conceptElem?.client_js_timestamp_max}
                  </Descriptions.Item>
                  <Descriptions.Item label="Hands">
                    {conceptElem?.hand_count_mean}
                  </Descriptions.Item>
                  <Descriptions.Item label="Max Frame">
                    {conceptElem?.frame_id_max}
                  </Descriptions.Item>
                  <Descriptions.Item label="Which Hand">
                    {conceptElem?.which_hand_mean}
                  </Descriptions.Item>
                </Descriptions>
                <Button
                  className="mt-4 mb-6 converter-btns"
                  shape="round"
                  loading={buttonLoading}
                  type="primary"
                  onClick={handleDeleteConcept}
                >
                  Delete Concept
                </Button>
              </div>
            );
          })}

        {loading && <Skeleton active />}
      </div>
    </>
  );
}

export default ConceptDetails;
