import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Button, Empty, Select, Space, Tag, Typography } from "antd";
import { Link } from "react-router-dom";
import { useListModelsQuery } from "./modelsApi";
import { rpcErrorMessage } from "../../api/rpc";

const ROLE_LABEL = { owner: "Yours", trainer: "Trainer", purchaser: "Purchased" };

function useDebounced(value, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}

/**
 * Choose a model. Controlled: value is a model id (string), onChange(id, model).
 *
 * scope "usable" (Translator) disables models that aren't trained yet when the server says so;
 * "trainable" (Collect / Train) lists models you own or train. With no models it says why and
 * links to the models page instead of showing an empty dropdown.
 */
export default function ModelPicker({ scope = "usable", value, onChange, disabled, autoSelect = true, size, style, id }) {
  const [search, setSearch] = useState("");
  const debounced = useDebounced(search);
  const { data, error, isFetching, isLoading, refetch } = useListModelsQuery({
    scope,
    search: debounced,
    offset: 0,
    limit: 50,
    sort: "recent",
  });
  const rows = useMemo(() => data?.rows || [], [data]);
  const selected = rows.find((m) => m.id === String(value));

  // Pick the first usable model when nothing (or something gone) is selected.
  useEffect(() => {
    if (!autoSelect || isFetching || debounced || !rows.length) return;
    if (value && rows.some((m) => m.id === String(value))) return;
    const first = rows.find((m) => scope !== "usable" || m.trained !== false);
    if (first) onChange?.(first.id, first);
  }, [autoSelect, debounced, isFetching, onChange, rows, scope, value]);

  if (error) {
    return (
      <Space wrap>
        <Typography.Text type="danger">{rpcErrorMessage(error, "Couldn't load your models.")}</Typography.Text>
        <Button size="small" onClick={refetch}>
          Try again
        </Button>
      </Space>
    );
  }

  if (!isLoading && !rows.length && !debounced) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={
          scope === "usable"
            ? "You don't have a model to translate with yet."
            : "You don't have a model to train yet."
        }
      >
        <Link to="/models">
          <Button type="primary" size="small">
            {scope === "usable" ? "Find or create a model" : "Create a model"}
          </Button>
        </Link>
      </Empty>
    );
  }

  const options = rows.map((m) => {
    const untrained = scope === "usable" && m.trained === false;
    return {
      value: m.id,
      disabled: untrained,
      label: (
        <span className="tm-model-option">
          <span className="tm-model-option-title">{m.title}</span>
          {m.role && ROLE_LABEL[m.role] && <Tag bordered={false}>{ROLE_LABEL[m.role]}</Tag>}
          {untrained && <Tag color="default">Not trained yet</Tag>}
        </span>
      ),
      searchLabel: m.title,
    };
  });
  return (
    <Select
      id={id}
      showSearch
      value={selected ? selected.id : value ? String(value) : undefined}
      placeholder="Choose a model"
      loading={isFetching}
      disabled={disabled}
      onSearch={setSearch}
      filterOption={false}
      onChange={(v) => onChange?.(v, rows.find((m) => m.id === v))}
      options={options}
      notFoundContent={isFetching ? "Searching…" : "No models match"}
      size={size}
      style={{ minWidth: 220, ...style }}
      aria-label="Model"
      optionLabelProp="label"
    />
  );
}

ModelPicker.propTypes = {
  scope: PropTypes.oneOf(["usable", "trainable", "mine", "public"]),
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
  autoSelect: PropTypes.bool,
  size: PropTypes.string,
  style: PropTypes.object,
  id: PropTypes.string,
};
