import React from "react";
import { useSelector } from "react-redux";
import JS2Py from "../remotepyjs";
import useLocalStorage from "./useLocalStorage";

function useModels() {
  const [publicModels, setPublicModels] = React.useState([]);
  const [userModels, setUserModels] = React.useState([]);
  const [userCount, setUserCount] = React.useState(0);
  const [publicCount, setPublicCount] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [publicLoading, setPublicLoading] = React.useState(true);
  const [userLoading, setUserLoading] = React.useState(true);
  const [token] = useLocalStorage("token");

  const currentPage = useSelector((state) => state.model.currentModelPage);
  const pageSize = useSelector((state) => state.model.modelPaginationSize);

  React.useEffect(() => {
    getUserModels(0, 10);
    getPublicModels(0, 10);
  }, []);

  React.useEffect(() => {
    getPublicModels((currentPage - 1) * pageSize, pageSize);
    getUserModels((currentPage - 1) * pageSize, pageSize);
  }, [loading]);

  function getPublicModels(offset, end) {
    setPublicLoading(true);
    try {
      JS2Py.PythonFunctions.TalkMotionServer.getPublicModels(
        offset,
        end,
        function (res) {
          setPublicCount(res[1][`count(*)`]);
          res = res[0];
          if (res.constructor == Array) {
            setPublicModels(() => res);
            setPublicLoading(false);
          }
        }
      );
    } catch (err) {
      console.log(err);
    }
  }

  function getUserModels(offset, end) {
    setUserLoading(true);
    try {
      JS2Py.PythonFunctions.TalkMotionServer.getUsersModels(
        token,
        offset,
        end,
        function (res) {
          setUserCount(res[1][`count(*)`]);
          res = res[0];
          if (res.constructor == Array) {
            setUserModels(() => res);
            setUserLoading(false);
          }
        }
      );
    } catch (err) {
      console.log(err);
    }
  }

  function createNewModel(title, description, is_public) {
    setLoading(true);
    try {
      JS2Py.PythonFunctions.TalkMotionServer.createModel(
        token,
        title,
        description,
        is_public,
        function (res) {
          console.log(res);
          setLoading(false);
        }
      );
    } catch (err) {
      setLoading(false);
      console.log(err);
    }
  }

  function addNewTrainer(modelid, username) {
    try {
      JS2Py.PythonFunctions.TalkMotionServer.addTrainerToModel(
        modelid,
        username,
        function (res) {
          console.log(res);
        }
      );
    } catch (err) {
      console.log(err);
    }
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

  return {
    publicCount,
    publicModels,
    getPublicModels,
    userCount,
    userModels,
    getUserModels,
    loading,
    userLoading,
    publicLoading,
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
  };
}

export default useModels;
