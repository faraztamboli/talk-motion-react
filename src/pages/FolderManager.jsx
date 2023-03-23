import React, { useState, useEffect } from "react";
import { Col, Row, Skeleton, Tree } from "antd";
import NewFolder from "../components/ui/NewFolder";
import useFolders from "../hooks/useFolders";
import { useParams } from "react-router-dom";
import FolderContent from "../components/ui/FolderContent";

const updateTreeData = (list, key, children) =>
  list.map((node) => {
    if (node.key === key) {
      return {
        ...node,
        children,
      };
    }
    if (node.children) {
      return {
        ...node,
        children: updateTreeData(node.children, key, children),
      };
    }
    return node;
  });

const App = () => {
  const [loading, setLoading] = useState(true);
  const [treeData, setTreeData] = useState([]);
  const [folderContent, setFolderContent] = useState([]);
  const { saveFolder, getChildFolders, getFolderContent } = useFolders();

  const { folderId } = useParams();

  useEffect(() => {
    getChildFolders(null)
      .then((res) => {
        console.log(res);
        setLoading(false);
        setTreeData([]);
        res.length > 0 &&
          res.map((folder) => {
            setTreeData((prevData) => [
              ...prevData,
              { key: folder.id, title: folder.name },
            ]);
          });
      })
      .catch((err) => {
        console.log(err);
        setLoading(false);
      });
  }, []);

  const handleFolderSelection = (key) => {
    console.log(key);
    getFolderContent(key)
      .then((res) => {
        console.log(res);
        setFolderContent(res);
      })
      .catch((err) => console.log(err));
  };

  // const fetchChildFolders = async (parentId) => {
  //   const fetchChildFoldersPromise = () => {
  //     return new Promise((resolve, reject) => {
  //       let foldersArr = [];
  //       getChildFolders(parentId ? parentId : null).then((res) => {
  //         res.length > 0
  //           ? res.map((folder, index) => {
  //               foldersArr = [
  //                 ...foldersArr,
  //                 {
  //                   key: parentId ? `${index}-${index}` : index,
  //                   id: folder.id,
  //                   title: folder.name,
  //                 },
  //               ];
  //               if (index === res.length - 1) resolve(foldersArr);
  //             })
  //           : resolve([]);
  //       });
  //     });
  //   };
  //   const a = async () => {
  //     const childFolders = await fetchChildFoldersPromise();
  //     console.log(childFolders);
  //     return childFolders;
  //   };
  //   console.log(a());
  //   return await a();
  // };

  // const onLoadData = ({ key, children }) =>
  //   new Promise((resolve) => {
  //     if (children) {
  //       resolve();
  //       return;
  //     }
  //     setTimeout(() => {
  //       // let childrens = [];
  //       getChildFolders(4)
  //         .then((res) => console.log(res))
  //         .catch((err) => console.log(err));
  //       setTreeData((origin) =>
  //         updateTreeData(origin, key, [
  //           {
  //             title: "Child Node",
  //             key: `${key}-0`,
  //           },
  //           {
  //             title: "Child Node",
  //             key: `${key}-1`,
  //           },
  //         ])
  //       );
  //       resolve();
  //     }, 1000);
  //   });

  const onLoadData = (treeNode) => {
    const { key, children } = treeNode;

    return new Promise((resolve) => {
      if (children && children.length > 0) {
        resolve();
        return;
      }
      getChildFolders(key)
        .then((res) => {
          const childNodes = res.map((child) => ({
            title: child.name,
            key: child.id,
            isLeaf: res.length > 0 ? false : true,
          }));
          setTreeData((origin) => updateTreeData(origin, key, childNodes));
          resolve();
        })
        .catch((err) => console.log(err));
    });
  };

  return (
    <div className="layout-bg mh-100vh p-5">
      <div className="flex flex-between-center">
        <h2>Folder Manager</h2>
        <NewFolder
          saveFolder={saveFolder}
          setLoading={setLoading}
          parentFolderId={folderId ? folderId : null}
        />
      </div>
      {!loading ? (
        <Row>
          <Col span={4}>
            <Tree
              loadData={onLoadData}
              treeData={treeData}
              onSelect={(selectedKeys) => {
                console.log("selected", treeData[selectedKeys[0]]?.key);
                handleFolderSelection(treeData[selectedKeys[0]]?.key);
              }}
            />
          </Col>
          <Col span={20}>
            <div className="bg-gray w-100p h-100p flex flex-center-center">
              <FolderContent content={folderContent ? folderContent : []} />
            </div>
          </Col>
        </Row>
      ) : (
        <Skeleton />
      )}
    </div>
  );
};
export default App;
