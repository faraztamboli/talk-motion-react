import { Button, Popconfirm, Table } from "antd";
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

  const columns = [
    {
      title: "Sample Id",
      dataIndex: "sampleid",
      key: "sampleid",
    },
    {
      title: "Frames",
      dataIndex: "frames",
      key: "frames",
    },
    {
      title: "Min Timestamp (sec)",
      dataIndex: "mintimestamp",
      key: "mintimestamp",
    },
    {
      title: "Max Timestamp (sec)",
      dataIndex: "maxtimestamp",
      key: "maxtimestamp",
    },
    {
      title: "Number of Hands",
      dataIndex: "numberofhands",
      key: "numberofhands",
    },
    {
      title: "Max Frames Id",
      dataIndex: "maxframeid",
      key: "maxframeid",
    },
    {
      title: "Which Hand",
      dataIndex: "whichhand",
      key: "whichhand",
    },
    {
      title: "Elapsed Time (sec)",
      dataIndex: "elapsedtime",
      key: "elapsedtime",
    },
  ];

  const data =
    !loading &&
    concept?.length > 0 &&
    concept.map((conceptElem) => {
      return {
        sampleid: conceptElem?.sample_id,
        frames: conceptElem?.frame_count,
        mintimestamp: new Date(
          conceptElem?.client_js_timestamp_min
        ).getUTCSeconds(),
        maxtimestamp: new Date(
          conceptElem?.client_js_timestamp_max
        ).getUTCSeconds(),
        numberofhands: Math.round(conceptElem?.hand_count_mean),
        maxframeid: conceptElem?.frame_id_max,
        whichhand:
          Math.round(conceptElem?.which_hand_mean) == 1
            ? "Left"
            : Math.round(conceptElem?.which_hand_mean) == 2
            ? "Right"
            : Math.round(conceptElem?.which_hand_mean) == 3
            ? "Both"
            : "None",
        elapsedtime: new Date(
          conceptElem?.client_js_time_elapsed
        ).getUTCSeconds(),
      };
    });

  return (
    <>
      {contextHolder}
      <div style={style} className="layout-bg mh-100vh">
        <h2>Concept Details</h2>
        <Table
          loading={loading}
          columns={columns}
          dataSource={data}
          pagination={false}
        />

        <Popconfirm
          title="Are you sure to delete this concept?"
          onConfirm={handleDeleteConcept}
        >
          <Button
            className="mt-4 mb-6 converter-btns"
            shape="round"
            loading={buttonLoading}
            type="primary"
          >
            Delete Concept
          </Button>
        </Popconfirm>
      </div>
    </>
  );
}

export default ConceptDetails;
