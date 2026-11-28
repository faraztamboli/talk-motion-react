import React from "react";
import { Badge } from "antd";
import {
  BookOutlined,
  CompassOutlined,
  HistoryOutlined,
  HomeOutlined,
  LineChartOutlined,
  MessageOutlined,
  PlayCircleOutlined,
  ShopOutlined,
  TeamOutlined,
  TranslationOutlined,
  VideoCameraAddOutlined,
  ExperimentOutlined,
  UsergroupAddOutlined,
} from "@ant-design/icons";

/**
 * The sidebar is a short, flat list in plain words, grouped by what a person wants to do.
 * No nested menus: every destination is one click away.
 *
 * An item's `key` is its URL, so the menu can navigate by key and highlight the current page
 * (see `selectedSidebarKey`). Items tagged with a `flag` only show while that flag is on
 * (see src/config/flags.js).
 */
const LEGACY = "legacy_models_visible";

const item = (label, key, icon, flag) => ({ label, key, icon, flag });
const group = (label, key, children, flag) => ({ type: "group", label, key, children, flag });

const items = [
  item("Home", "/dashboard", <HomeOutlined />),

  group("Talk", "g-talk", [
    item("Talk with someone", "/conversation", <MessageOutlined />, "conversation_v2"),
    item("Past conversations", "/conversation/history", <HistoryOutlined />, "conversation_v2"),
    item("Translate", "/converter", <TranslationOutlined />),
  ]),

  group("Videos", "g-videos", [
    item("My videos", "/video-subtitles/mylibrary", <PlayCircleOutlined />),
    item("Make a video", "/video-subtitles/designer", <VideoCameraAddOutlined />),
  ]),

  group("Teach and learn", "g-teach", [
    item("My classrooms", "/classrooms", <TeamOutlined />),
    item("My courses", "/courses", <BookOutlined />),
    item("Join a classroom", "/classrooms/find", <UsergroupAddOutlined />),
  ]),

  group(
    "Sign models",
    "g-models",
    [
      item("My sign models", "/models", <ExperimentOutlined />, LEGACY),
      item("Models I can train", "/models?show=trainable", <ExperimentOutlined />, LEGACY),
    ],
    LEGACY
  ),

  group("Explore", "g-find", [
    item("Find videos", "/video-subtitles/library", <CompassOutlined />),
    item("Find sign models", "/store/models", <CompassOutlined />, LEGACY),
  ]),

  group("Your places", "g-places", [
    item("Locations", "/locations", <ShopOutlined />, "has_locations"),
    item("Site analytics", "/admin/analytics", <LineChartOutlined />, "platform_admin"),
  ]),
];

function visible(entry, flags) {
  return !entry.flag || Boolean(flags[entry.flag]);
}

function strip(entry) {
  // eslint-disable-next-line no-unused-vars
  const { flag, ...rest } = entry;
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

/** Sidebar items for the current flags. A section with nothing left to show disappears. */
export function buildSidebarItems(flags = {}) {
  const out = [];
  for (const entry of items) {
    if (!visible(entry, flags)) continue;
    if (!entry.children) {
      out.push(strip(entry));
      continue;
    }
    const children = entry.children.filter((child) => visible(child, flags)).map(strip);
    if (children.length === 0) continue;
    out.push({ ...strip(entry), children });
  }
  return out;
}

/**
 * The icon-only (collapsed) sidebar can't show section names, which get cut off, so sections
 * become thin dividers. Labels stay for the hover tooltips.
 */
export function collapsedSidebarItems(built) {
  const out = [];
  built.forEach((entry) => {
    if (!entry.children) {
      out.push(entry);
      return;
    }
    out.push({ type: "divider", key: `${entry.key}-divider` });
    out.push(...entry.children);
  });
  return out;
}

/**
 * Puts a count next to items that have something waiting, e.g. `{ "/classrooms": 3 }` for three
 * people asking to join. A zero count leaves the item as it was. The count is part of the
 * label, so screen readers and the collapsed tooltip say it too; collapsed, the icon gets a dot.
 */
export function withCounts(built, counts = {}) {
  const mark = (entry) => {
    const count = Number(counts[entry.key] || 0);
    if (count <= 0) return entry;
    return {
      ...entry,
      className: "tm-sidebar-alert",
      label: (
        <span className="tm-sidebar-count">
          <span>{entry.label}</span>
          <span aria-hidden="true">
            <Badge count={count} overflowCount={99} title={`${count} waiting`} />
          </span>
          <span className="tm-visually-hidden">{`, ${count} waiting`}</span>
        </span>
      ),
    };
  };
  return built.map((entry) => (entry.children ? { ...entry, children: entry.children.map(mark) } : mark(entry)));
}

/** Every navigable key in a built menu, in order. */
export function sidebarKeys(built) {
  return built.flatMap((entry) => (entry.children ? entry.children.map((c) => c.key) : [entry.key]));
}

/**
 * The menu key that matches the current URL: an exact match (including the query string) wins,
 * otherwise the longest path that the URL sits under.
 */
// Pages that belong to a menu item without sitting under its URL.
const ALIASES = [[/^\/classroom\//, "/classrooms"]];

export function selectedSidebarKey(built, pathname, search = "") {
  const keys = sidebarKeys(built);
  for (const [pattern, key] of ALIASES) {
    if (pattern.test(pathname) && keys.includes(key)) return key;
  }
  const full = pathname + search;
  if (keys.includes(full)) return full;
  let best = null;
  for (const key of keys) {
    const path = key.split("?")[0];
    // /models?show=trainable only matches on its query; plain /models is the fallback.
    if (key.includes("?")) continue;
    const under = pathname === path || pathname.startsWith(path + "/");
    if (under && (!best || path.length > best.split("?")[0].length)) best = key;
  }
  if (pathname === "/") return "/dashboard";
  return best;
}

export default items;
