import React from "react";
import {
  DesktopOutlined,
  FileOutlined,
  PieChartOutlined,
  HistoryOutlined,
  HomeOutlined,
  LineChartOutlined,
  MessageOutlined,
  ShopOutlined,
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

function getItem(label, key, icon, children, path, flag) {
  return {
    key,
    icon,
    children,
    label,
    path,
    flag,
  };
}

// Items tagged with a flag only show while that flag is on (see src/config/flags.js).
const LEGACY = "legacy_models_visible";

const items = [
  getItem(
    "Dashboard",
    "0",
    <Link to="/dashboard">
      <HomeOutlined />
    </Link>,
    null,
    "/dashboard"
  ),
  getItem(
    "Translator",
    "1",
    <Link to="/converter">
      <PieChartOutlined />
    </Link>,
    null,
    "/converter"
  ),
  getItem(
    "Conversation",
    "7",
    <Link to="/conversation">
      <MessageOutlined />
    </Link>,
    null,
    "/conversation",
    "conversation_v2"
  ),
  getItem(
    "My conversations",
    "71",
    <Link to="/conversation/history">
      <HistoryOutlined />
    </Link>,
    null,
    "/conversation/history",
    "conversation_v2"
  ),
  getItem(
    "Locations",
    "72",
    <Link to="/locations">
      <ShopOutlined />
    </Link>,
    null,
    "/locations",
    "has_locations"
  ),
  getItem(
    "Site analytics",
    "73",
    <Link to="/admin/analytics">
      <LineChartOutlined />
    </Link>,
    null,
    "/admin/analytics",
    "platform_admin"
  ),
  getItem(
    "Learning",
    "4",
    <Link to="/video-subtitles/mylibrary">
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
        <Link to="/courses">
          <MdOutlineFolderSpecial />
        </Link>,
        null,
        "/courses"
      ),
      getItem(
        "Course Tree Manager",
        "46",
        <Link to="/courses/tree-manager">
          <MdOutlineFolderSpecial />
        </Link>,
        null,
        "/courses/tree-manager"
      ),
      getItem(
        "Classrooms",
        "44",
        <Link to="/classrooms">
          <MdOutlineFolderSpecial />
        </Link>,
        null,
        "/classrooms"
      ),
      getItem(
        "Staff Rooms",
        "45",
        <Link to="/staff-rooms">
          <MdOutlineFolderSpecial />
        </Link>,
        null,
        "/staff-rooms"
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
        "/my-models",
        LEGACY
      ),
      getItem(
        "I'm Training",
        "22",
        <Link to="/models/training-models">
          <FileOutlined />
        </Link>,
        null,
        "/models/training-models",
        LEGACY
      ),
    ],
    "/models",
    LEGACY
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
        "/models",
        LEGACY
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
    <Link to="/trainer/collect">
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
        "/trainer/upload",
        LEGACY
      ),
      getItem(
        "Collect",
        "32",
        <Link to="/trainer/collect">
          <MdOutlineCollectionsBookmark />
        </Link>,
        null,
        "/trainer/collect",
        LEGACY
      ),
      getItem(
        "Train",
        "33",
        <Link to="/trainer/train">
          <MdModelTraining />
        </Link>,
        null,
        "/trainer/train",
        LEGACY
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

const STORE_KEY = "5";

function storeIcon(flags) {
  // The Store group icon used to open the model store; send it to the video library when
  // models are hidden.
  return flags[LEGACY] ? (
    <Link to="/models">
      <FileOutlined />
    </Link>
  ) : (
    <Link to="/video-subtitles/library">
      <MdOutlineVideoLibrary />
    </Link>
  );
}

function visible(item, flags) {
  return !item.flag || Boolean(flags[item.flag]);
}

function strip(item) {
  // eslint-disable-next-line no-unused-vars
  const { flag, ...rest } = item;
  return rest;
}

/**
 * Switches that come from the signed-in API account rather than feature flags: whether the
 * person works at a venue location, and whether they are a platform admin.
 */
export function accountFlags(apiUser) {
  return {
    has_locations: Boolean(apiUser?.is_platform_admin) || (apiUser?.orgs || []).some((o) => o.kind === "venue"),
    platform_admin: Boolean(apiUser?.is_platform_admin),
  };
}

/**
 * Sidebar items for the current flags. A group that loses children to flags and is left
 * with a single item is replaced by that item (e.g. Trainer -> Subtitle Designer).
 */
export function buildSidebarItems(flags = {}) {
  const out = [];
  for (const item of items) {
    if (!visible(item, flags)) continue;
    if (!item.children) {
      out.push(strip(item));
      continue;
    }
    const children = item.children.filter((child) => visible(child, flags)).map(strip);
    if (children.length === 0) continue;
    if (children.length === 1 && children.length < item.children.length) {
      out.push(children[0]);
      continue;
    }
    const group = { ...strip(item), children };
    if (item.key === STORE_KEY) group.icon = storeIcon(flags);
    out.push(group);
  }
  return out;
}

export default items;
