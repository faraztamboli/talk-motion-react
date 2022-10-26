import React from 'react';
import { Button, Row, Col, Input } from 'antd';
import { FaRegPauseCircle, FaRegPlayCircle } from 'react-icons/fa';

export const TrainerControl = () => {
  const [trainingText /*setTrainingText*/] = React.useState(
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
  );
  const [collectionText, setCollectionText] = React.useState('');
  const [isRecording, setIsRecording] = React.useState(false);
  const [isTraining, setIsTraining] = React.useState(false);
  const loadings = () => {};
  const handleCollectionTextChange = () => e => {
    setCollectionText(e.target.value);
  };
  const speak = () => {
    setIsRecording(!isRecording);
  };
  const stopSpeak = () => {
    setIsRecording(!isRecording);
  };
  const train = () => {
    setIsTraining(!isTraining);
  };
  const stopTrain = () => {
    setIsTraining(!isTraining);
  };
  return (
    <div>
      <h2 className="mb-0">Controls</h2>
      <p>Collect samples and train your model</p>
      <div className="card-body mt-6">
        <Input
          placeholder="Enter Collection Text"
          value={collectionText}
          onChange={handleCollectionTextChange()}
        />
        <Row gutter={[16, 16]} className="mt-4">
          <Col span={12}>
            {isRecording ? (
              <Button
                className="flex flex-center-center w-100p"
                type="danger"
                loading={loadings[0]}
                onClick={() => stopSpeak(0)}
                icon={<FaRegPauseCircle />}
              >
                <span className="ml-2">Pause</span>
              </Button>
            ) : (
              <Button
                className="flex flex-center-center w-100p"
                type="primary"
                loading={loadings[1]}
                onClick={() => speak(1)}
                icon={<FaRegPlayCircle />}
              >
                <span className="ml-2">Collect</span>
              </Button>
            )}
          </Col>
          <Col span={12}>
            {!isTraining ? (
              <Button
                className="flex flex-center-center w-100p"
                type="primary"
                onClick={() => train()}
              >
                <span className="ml-2">Train</span>
              </Button>
            ) : (
              <Button
                className="flex flex-center-center w-100p"
                type="danger"
                onClick={() => stopTrain()}
                icon={<FaRegPauseCircle />}
              >
                <span className="ml-2">Stop</span>
              </Button>
            )}
          </Col>
        </Row>
        <div className="mt-6 trainer-status">
          <h3>Training Status</h3>
          <p>{trainingText}</p>
        </div>
      </div>
    </div>
  );
};
