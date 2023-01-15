import React from "react";
import JS2Py from "../remotepyjs";
import useLocalStorage from "./useLocalStorage";

function useModels() {
  const [token] = useLocalStorage("token");

  React.useEffect(() => {
    getUserModels(0, 10);
    getPublicModels(0, 10);
  }, []);

  function getPublicModels(offset, end) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.getPublicModels(
          offset,
          end,
          function (res) {
            if (res.constructor == Array) {
              resolve(res);
            }
          }
        );
      } catch (err) {
        console.log(err);
        reject(err);
      }
    });
  }

  function getUserModels(offset, end) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.getUsersModels(
          token,
          offset,
          end,
          function (res) {
            if (res.constructor == Array) {
              resolve(res);
            }
          }
        );
      } catch (err) {
        console.log(err);
        reject(err);
      }
    });
  }

  function createNewModel(title, description, is_public) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.createModel(
          token,
          title,
          description,
          is_public,
          function (res) {
            console.log(res);
            resolve(res);
          }
        );
      } catch (err) {
        reject(err);
        console.log(err);
      }
    });
  }

  function addNewTrainer(modelid, username) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.addTrainerToModel(
          modelid,
          username,
          function (res) {
            console.log(res);
            resolve(res);
          }
        );
      } catch (err) {
        console.log(err);
        reject(err);
      }
    });
  }

  function deleteModel(modelid) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.deleteModel(
          token,
          modelid,
          function (res) {
            console.log(res);
            resolve(res);
          }
        );
      } catch (err) {
        console.log(err);
        reject(err);
      }
    });
  }

  function updateModel(modelid, title, description, is_public) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.updateModel(
          modelid,
          title,
          description,
          is_public,
          function (res) {
            console.log(res);
            resolve(res);
          }
        );
      } catch (err) {
        console.log(err);
        reject(err);
      }
    });
  }

  function cloneModel(modelid) {
    try {
      JS2Py.PythonFunctions.TalkMotionServer.cloneModel(
        token,
        modelid,
        function (res) {
          console.log(res);
        }
      );
    } catch (err) {
      console.log(err);
    }
  }

  function purchaseModel(modelid) {
    try {
      JS2Py.PythonFunctions.TalkMotionServer.purchaseModel(
        token,
        modelid,
        function (res) {
          console.log(res);
        }
      );
    } catch (err) {
      console.log(err);
    }
  }

  function getModel(modelid) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.getModel(
          token,
          modelid,
          function (res) {
            resolve(res);
          }
        );
      } catch (err) {
        console.log(err);
        reject(err);
      }
    });
  }

  function getModelFiles(modelid) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.getModelFiles(
          modelid,
          function (res) {
            resolve(res);
          }
        );
      } catch (err) {
        console.log(err);
        reject(err);
      }
    });
  }

  function getModelConcepts(modelid) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.getModelConcepts(
          modelid,
          function (res) {
            resolve(res);
          }
        );
      } catch (err) {
        console.log(err);
        reject(err);
      }
    });
  }

  function getConceptDetails(modelid, concept) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.getConceptDetails(
          modelid,
          concept,
          function (res) {
            console.log(res);
            resolve(res);
          }
        );
      } catch (err) {
        console.log(err);
        reject(err);
      }
    });
  }

  function deleteModelConcept(modelid, concept) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.deleteModelConcepts(
          modelid,
          concept,
          function (res) {
            console.log(res);
            resolve(res);
          }
        );
      } catch (err) {
        console.log(err);
        reject(err);
      }
    });
  }

  function getModelsUserCanTrain() {
    let offset = 0;
    let end = 9999999;
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.getModelsUserCanTrain(
          token,
          offset,
          end,
          function (res) {
            console.log(res);
            resolve(res);
          }
        );
      } catch (err) {
        console.log(err);
        reject(err);
      }
    });
  }

  function getModelsUserCanUse() {
    let offset = 0;
    let end = 9999999;
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.getModelsUserCanUse(
          token,
          offset,
          end,
          function (res) {
            console.log(res);
            resolve(res);
          }
        );
      } catch (err) {
        console.log(err);
        reject(err);
      }
    });
  }

  return {
    getPublicModels,
    getUserModels,
    createNewModel,
    addNewTrainer,
    deleteModel,
    updateModel,
    cloneModel,
    purchaseModel,
    getModel,
    getModelFiles,
    getModelConcepts,
    getConceptDetails,
    deleteModelConcept,
    getModelsUserCanTrain,
    getModelsUserCanUse,
  };
}

export default useModels;
