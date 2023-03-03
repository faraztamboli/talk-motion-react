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
  MdOutlineDesignServices,
  MdOutlineFolderSpecial,
  MdOutlineSubtitles,
  MdOutlineVideoLibrary,
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
  getItem(
    "Video Subtitles",
    "4",
    <Link to="/video-subtitles">
      <MdOutlineSubtitles />
    </Link>,
    [
      getItem(
        "Subtitles Library",
        "41",
        <Link to="/video-subtitles/library">
          <MdOutlineVideoLibrary />
        </Link>,
        null,
        "/video-subtitles/library"
      ),
      getItem(
        "Subtitles Designer",
        "42",
        <Link to="/video-subtitles/designer">
          <MdOutlineDesignServices />
        </Link>,
        null,
        "/video-subtitles/designer"
      ),
      getItem(
        "Folder Manager",
        "43",
        <Link to="/video-subtitles/folder-manager">
          <MdOutlineFolderSpecial />
        </Link>,
        null,
        "/video-subtitles/folder-manager"
      ),
    ],
    "/video-subtitles"
  ),
];

export default items;
