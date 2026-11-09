import React from "react";
import PropTypes from "prop-types";
import { Collapse, List, Tag, Typography } from "antd";

const { Text } = Typography;

const TYPE_COLOR = { info: "blue", success: "green", error: "red" };

/**
 * Persistent, collapsible history of session events. Replaces the old
 * console.log-only feedback so every recording/upload event is visible.
 */
function StatusPanel({ events }) {
  return (
    <Collapse
      size="small"
      items={[
        {
          key: "events",
          label: `Activity log (${events.length})`,
          children: (
            <List
              size="small"
              dataSource={[...events].reverse()}
              rowKey={(e) => e.id}
              locale={{ emptyText: "No activity yet" }}
              renderItem={(event) => (
                <List.Item>
                  <Tag color={TYPE_COLOR[event.type] ?? "default"}>
                    {event.time.toLocaleTimeString()}
                  </Tag>
                  <Text type={event.type === "error" ? "danger" : undefined}>
                    {event.message}
                  </Text>
                </List.Item>
              )}
            />
          ),
        },
      ]}
    />
  );
}

StatusPanel.propTypes = {
  events: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default StatusPanel;
