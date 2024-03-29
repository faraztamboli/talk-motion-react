import React from "react";
import JS2Py from "../remotepyjs";
import useLocalStorage from "./useLocalStorage";
import usePayment from "./usePayment";
import { useDispatch } from "react-redux";

function useModels() {
  const dispatch = useDispatch();
  const [token] = useLocalStorage("token");
  const { getCart } = usePayment();

  React.useEffect(() => {
    getUserModels("", 0, 10);
    getPublicModels("", 0, 10);
  }, []);

  function getPublicModels(search_text, offset, end) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.getPublicModels(
          token,
          search_text,
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

  function getUserModels(search_text, offset, end) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.getUsersModels(
          token,
          search_text,
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
          token,
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

  function getModelConcepts(modelid) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.getModelConcepts(
          token,
          modelid,
          function (res) {
            if (res.constructor == Array) {
              resolve(res);
            } else {
              reject(res);
            }
          }
        );
      } catch (err) {
        console.log(err);
        reject(err);
      }
    });
  }

  function getModelVideos(modelid, search_text, offset, end) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.getModelVideos(
          token,
          modelid,
          search_text,
          false,
          offset,
          end,
          function (res) {
            if (res.constructor == Array) {
              resolve(res);
            } else {
              reject(res);
            }
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
          token,
          modelid,
          concept,
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

  function deleteModelConcept(modelid, concept) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.deleteModelConcepts(
          token,
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

  function getModelsUserCanTrain(searchText, offset, end) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.getModelsUserCanTrain(
          token,
          searchText,
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

  function getModelsUserCanUse(searchText, offset, end) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.getModelsUserCanUse(
          token,
          searchText,
          offset,
          end,
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

  function deleteModelConceptSample(modelid, concept, sampleids) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.deleteModelConceptSample(
          token,
          modelid,
          concept,
          sampleids,
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

  function setModelPrice(
    modelid,
    unitamount,
    tiers,
    currency,
    recurring
  ) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.setModelPrice(
          token,
          modelid,
          unitamount,
          tiers,
          currency,
          recurring,
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

  function setProductPrice(
    product_id,
    unitamount,
    tiers,
    currency,
    recurring
  ) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.setProductPrice(
          token,
          product_id,
          unitamount,
          tiers,
          currency,
          recurring,
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

  function addOrRemoveCartProduct(product_id, quantity) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.addOrRemoveCartProduct(
          token,
          Number(product_id),
          Number(quantity),
          function (res) {
            resolve(res);
            setTimeout(() => {
              getCart()
                .then((res) => {
                  console.log(res);
                })
                .catch((err) => console.log(err));
            }, 100);
          }
        );
      } catch (err) {
        console.log(err);
        reject(err);
      }
    });
  }

  function getProductForFree(product_id) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.getProductForFree(
          token,
          Number(product_id),
          function (res) {
            resolve(res);
            setTimeout(() => {
              getCart()
                .then((res) => console.log(res))
                .catch((err) => console.log(err));
            }, 100);
          }
        );
      } catch (err) {
        console.log(err);
        reject(err);
      }
    });
  }

  function setCartProductQuantity(product_id, quantity) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.setCartProductQuantity(
          token,
          product_id,
          quantity,
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

  function getUsersModelsByUserName(
    username,
    search_text,
    offset,
    end
  ) {
    return new Promise((resolve, reject) => {
      try {
        JS2Py.PythonFunctions.TalkMotionServer.getUsersModelsByUserName(
          token,
          username,
          search_text,
          offset,
          end,
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
    getModelVideos,
    getConceptDetails,
    deleteModelConcept,
    getModelsUserCanTrain,
    getModelsUserCanUse,
    deleteModelConceptSample,
    setModelPrice,
    setProductPrice,
    addOrRemoveCartProduct,
    getProductForFree,
    setCartProductQuantity,
    getUsersModelsByUserName,
    getProductForFree,
  };
}

export default useModels;
