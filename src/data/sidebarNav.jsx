import React from "react";
import {
  DesktopOutlined,
  FileOutlined,
  PieChartOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import {
  MdFileUpload,
  MdModelTraining,
  MdOutlineCollectionsBookmark,
} from "react-icons/md";

function getItem(label, key, icon, children, path) {
  return {
    key,
    icon,
    children,
    label,
    path,
  };
}

const items = [
  getItem(
    "Converter",
    "1",
    <Link to="/converter">
      <PieChartOutlined />
    </Link>,
    null,
    "/converter"
  ),
  getItem(
    "Trainer",
    "2",
    <Link to="/trainer">
      <DesktopOutlined />
    </Link>,
    [
      getItem(
        "Upload",
        "23",
        <Link to="/trainer/upload">
          <MdFileUpload />
        </Link>,
        null,
        "/trainer/upload"
      ),
      getItem(
        "Collect",
        "21",
        <Link to="/trainer/collect">
          <MdOutlineCollectionsBookmark />
        </Link>,
        null,
        "/trainer/collect"
      ),
      getItem(
        "Train",
        "22",
        <Link to="/trainer/train">
          <MdModelTraining />
        </Link>,
        null,
        "/trainer/train"
      ),
    ],
    "/trainer"
  ),
  getItem(
    "Models",
    "3",
    <Link to="/models">
      <FileOutlined />
    </Link>,
    [
      getItem(
        "Store",
        "31",
        <Link to="/models">
          <FileOutlined />
        </Link>,
        null,
        "/models"
      ),
      getItem(
        "My Models",
        "32",
        <Link to="/my-models">
          <MdOutlineCollectionsBookmark />
        </Link>,
        null,
        "/my-models"
      ),
      getItem(
        "I'm Training",
        "33",
        <Link to="/models/training-models">
          <FileOutlined />
        </Link>,
        null,
        "/models/training-models"
      ),
    ],
    "/models"
  ),
];

export default items;
