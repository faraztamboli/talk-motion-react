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
    "Signed Videos",
    "4",
    <Link to="/video-subtitles">
      <MdOutlineSubtitles />
    </Link>,
    [
      getItem(
        "My Videos",
        "41",
        <Link to="/video-subtitles/mylibrary">
          <MdOutlineVideoLibrary />
        </Link>,
        null,
        "/video-subtitles/mylibrary"
      ),
      getItem(
        "My Courses",
        "43",
        <Link to="/video-subtitles/folder-manager">
          <MdOutlineFolderSpecial />
        </Link>,
        null,
        "/video-subtitles/folder-manager"
      ),
      getItem(
        "Classrooms",
        "44",
        <Link to="/video-subtitles/classrooms">
          <MdOutlineFolderSpecial />
        </Link>,
        null,
        "/video-subtititles/classrooms"
      ),
      getItem(
        "Staff Classrooms",
        "45",
        <Link to="/video-subtitles/staff-classrooms">
          <MdOutlineFolderSpecial />
        </Link>,
        null,
        "/video-subtitles/staff-classrooms"
      ),
    ],
    "/video-subtitles"
  ),
  getItem(
    "Models",
    "2",
    <Link to="/models">
      <FileOutlined />
    </Link>,
    [
      getItem(
        "My Models",
        "21",
        <Link to="/my-models">
          <MdOutlineCollectionsBookmark />
        </Link>,
        null,
        "/my-models"
      ),
      getItem(
        "I'm Training",
        "22",
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
    "Store",
    "5",
    <Link to="/models">
      <FileOutlined />
    </Link>,
    [
      getItem(
        "Models",
        "61",
        <Link to="/models">
          <FileOutlined />
        </Link>,
        null,
        "/models"
      ),
      getItem(
        "Videos",
        "62",
        <Link to="/video-subtitles/library">
          <MdOutlineVideoLibrary />
        </Link>,
        null,
        "/video-subtitles/library"
      ),
      getItem(
        "Classrooms",
        "63",
        <Link to="/store/classrooms">
          <MdOutlineCollectionsBookmark />
        </Link>,
        null,
        "/store/classrooms"
      ),
      getItem(
        "Courses",
        "64",
        <Link to="/video-subtitles/folder-manager">
          <MdOutlineFolderSpecial />
        </Link>,
        null,
        "/video-subtitles/folder-manager"
      ),
    ],
    "/video-subtitles"
  ),
  getItem(
    "Trainer",
    "3",
    <Link to="/trainer">
      <DesktopOutlined />
    </Link>,
    [
      getItem(
        "Upload",
        "31",
        <Link to="/trainer/upload">
          <MdFileUpload />
        </Link>,
        null,
        "/trainer/upload"
      ),
      getItem(
        "Collect",
        "32",
        <Link to="/trainer/collect">
          <MdOutlineCollectionsBookmark />
        </Link>,
        null,
        "/trainer/collect"
      ),
      getItem(
        "Train",
        "33",
        <Link to="/trainer/train">
          <MdModelTraining />
        </Link>,
        null,
        "/trainer/train"
      ),
      getItem(
        "Subtitle Designer",
        "42",
        <Link to="/video-subtitles/designer">
          <MdOutlineDesignServices />
        </Link>,
        null,
        "/video-subtitles/designer"
      ),
    ],
    "/trainer"
  ),
];

export default items;
