import React, { useState, useEffect } from "react";
import { Col, Empty, Row, Skeleton } from "antd";
import { useParams } from "react-router-dom";
import ConceptCard from "../components/ui/ConceptCard";
import useModels from "../hooks/useModels";
import useMessageApi from "../hooks/useMessageApi";

function ModelConcepts(props) {
  const [modelConcepts, setModelConcepts] = useState();
  const [loading, setLoading] = useState(true);
  const { getModelConcepts, deleteModelConcept } = useModels();
  const { contextHolder, showMessage } = useMessageApi();
  const { modelid } = useParams();

  const style = props.collapsedWidth === 0 ? { padding: 8 } : { padding: 24 };
  const emptyImgStyle = { filter: "saturate(12)" };

  useEffect(() => {
    getModelConcepts(modelid)
      .then((res) => {
        console.log(res);
        setModelConcepts(res);
        setLoading(false);
      })
      .catch((err) => {
        console.log(err);
        setLoading(false);
      });
  }, []);

  const handleDeleteConcept = (concepttitle) => {
    deleteModelConcept(modelid, concepttitle)
      .then((res) => {
        console.log(res);
        showMessage("success", "Concept Deleted!");
      })
      .catch((err) => {
        console.log(err);
        showMessage("error", "Cannot Delete the Concept");
      });
  };

  return (
    <>
      {contextHolder}
      <div className="layout-bg mh-100vh" style={style}>
        <h2>Model Concepts</h2>

        <Row gutter={[16, 16]}>
          {!loading &&
            modelConcepts?.length > 0 &&
            modelConcepts?.map((concept, index) => {
              return (
                <Col key={index} span={8} xs={24} md={8}>
                  <ConceptCard
                    concept={concept?.concept}
                    sample_count={concept?.sample_count}
                    which_hand={Math.round(concept?.which_hand_mean)}
                    sample_recording_time={concept?.sample_recording_time}
                    concept_quality={
                      (Math.abs(concept?.frame_count_zscore_count) +
                        Math.abs(concept?.which_hand_zscore_count) +
                        Math.abs(
                          concept?.client_js_time_elapsed_zscore_count
                        )) /
                      3
                    }
                    handleDeleteConcept={handleDeleteConcept}
                  />
                </Col>
              );
            })}
        </Row>
        {!modelConcepts?.length > 0 && !loading && (
          <div className="w-100p mh-100vh">
            <Empty
              style={{ fontWeight: 500 }}
              imageStyle={emptyImgStyle}
              description={<span>No Data</span>}
            />
          </div>
        )}

        {loading && <Skeleton active />}
      </div>
    </>
  );
}

export default ModelConcepts;
