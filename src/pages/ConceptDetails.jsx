import React, { useState, useEffect } from "react";
import { Button, Popconfirm, Table } from "antd";
import { useParams } from "react-router-dom";
import useModels from "../hooks/useModels";
import useMessageApi from "../hooks/useMessageApi";

function ConceptDetails(props) {
  const [concept, setConcept] = useState();
  const [selectedRows, setSelectedRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const { getConceptDetails, deleteModelConceptSample } = useModels();
  const { contextHolder, showMessage } = useMessageApi();

  const { modelid, concepttitle } = useParams();

  const style = props.collapsedWidth === 0 ? { padding: 8 } : { padding: 24 };

  useEffect(() => {
    getConceptDetails(modelid, concepttitle)
      .then((res) => {
        res = JSON.parse(res);
        setConcept(res);
        setLoading(false);
      })
      .catch((err) => {
        console.log(err);
        setLoading(false);
      });
  }, []);

  function handleSampleDeletion() {
    for (let sample of selectedRows) {
      console.log(sample);
      deleteModelConceptSample(modelid, concepttitle, sample)
        .then((res) => {
          console.log(res);
          showMessage("success", "Sample Deleted!");
        })
        .catch((err) => {
          console.log(err);
          showMessage("error", "unable to delete sample");
        });
    }
  }

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
    {
      title: "z-score",
      dataIndex: "zScore",
      key: "zScore",
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
        zScore: (
          (Math.abs(conceptElem?.frame_count_zscore) +
            Math.abs(conceptElem?.which_hand_zscore) +
            Math.abs(conceptElem?.client_js_time_elapsed_zscore)) /
          3
        ).toFixed(2),
      };
    });

  const onSelectChange = (newRows) => {
    setSelectedRows(newRows);
  };

  const rowClassName = (record) => {
    if (record.zScore > 2 && record.zScore < 3) {
      return "bg-orange";
    } else if (record.zScore > 3) {
      return "bg-red";
    }
  };

  const rowSelection = {
    selectedRowKeys: selectedRows,
    onChange: onSelectChange,
  };

  return (
    <>
      {contextHolder}
      <div style={style} className="layout-bg mh-100vh">
        <div className="flex flex-between-center">
          <h2>Concept Details</h2>
          {selectedRows.length > 0 && (
            <Popconfirm
              title="Are you sure to delete the selected concepts?"
              onConfirm={handleSampleDeletion}
            >
              <Button type="primary">
                Delete {selectedRows.length} Concepts
              </Button>
            </Popconfirm>
          )}
        </div>
        <Table
          rowSelection={rowSelection}
          rowClassName={rowClassName}
          rowKey={(record) => record.sampleid}
          loading={loading}
          columns={columns}
          dataSource={data}
          pagination={false}
        />
      </div>
    </>
  );
}

export default ConceptDetails;
