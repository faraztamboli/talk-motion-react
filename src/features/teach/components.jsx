/**
 * Building blocks shared by the classroom and course pages: plain words, large targets, one
 * obvious next step.
 */
import React, { useEffect, useState } from "react";
import { Alert, Avatar, Button, Input, List, Skeleton, Tag, Typography } from "antd";
import { CheckOutlined, UserOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { rpcErrorMessage } from "../../api/rpc";
import { teachServerReady, useFindPeopleQuery } from "./teachApi";
import "./teach.css";

export function useDebounced(value, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}

export function TeachPage({ children, narrow = false }) {
  return <div className={`tm-teach ${narrow ? "tm-teach--narrow" : ""}`}>{children}</div>;
}

/** Title, one sentence of help, and the page's main buttons. */
export function PageHeader({ title, help, actions, above }) {
  return (
    <header className="tm-teach-header">
      <div className="tm-teach-header__text">
        {above}
        <Typography.Title level={1} className="tm-teach-title">
          {title}
        </Typography.Title>
        {help && <Typography.Paragraph className="tm-teach-help">{help}</Typography.Paragraph>}
      </div>
      {actions && <div className="tm-teach-header__actions">{actions}</div>}
    </header>
  );
}

export function SectionTitle({ children, extra }) {
  return (
    <div className="tm-teach-section">
      <Typography.Title level={2} className="tm-teach-section__title">
        {children}
      </Typography.Title>
      {extra}
    </div>
  );
}

/** A large choice card used like a radio button. */
export function BigChoice({ selected, onSelect, icon, title, help, name, value }) {
  return (
    <label className={`tm-choice ${selected ? "is-selected" : ""}`}>
      <input
        type="radio"
        name={name}
        value={value}
        checked={selected}
        onChange={() => onSelect(value)}
        className="tm-visually-hidden"
      />
      {icon && (
        <span className="tm-choice__icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <span className="tm-choice__text">
        <span className="tm-choice__title">{title}</span>
        {help && <span className="tm-choice__help">{help}</span>}
      </span>
      <span className="tm-choice__check" aria-hidden="true">
        {selected && <CheckOutlined />}
      </span>
    </label>
  );
}

/** A large button-card that starts a task (used in empty states). */
export function ActionCard({ icon, title, help, onClick, primary }) {
  return (
    <button type="button" className={`tm-action ${primary ? "is-primary" : ""}`} onClick={onClick}>
      <span className="tm-action__icon" aria-hidden="true">
        {icon}
      </span>
      <span className="tm-action__title">{title}</span>
      {help && <span className="tm-action__help">{help}</span>}
    </button>
  );
}

export const ROLE_TEXT = {
  owner: "You run this",
  teacher: "You teach",
  student: "You're learning",
};
const ROLE_COLOR = { owner: "blue", teacher: "geekblue", student: "green" };

export function RoleTag({ role }) {
  const { t } = useTranslation();
  if (!role) return null;
  return (
    <Tag color={ROLE_COLOR[role]} bordered={false} className="tm-role">
      {t(`teach.role.${role}`, ROLE_TEXT[role])}
    </Tag>
  );
}

export function PersonAvatar({ person, size = 40 }) {
  return (
    <Avatar size={size} src={person.image || undefined} icon={!person.image && <UserOutlined />} alt="">
      {!person.image && person.name ? person.name.slice(0, 1).toUpperCase() : null}
    </Avatar>
  );
}

/** Shown when the server doesn't have this area's functions yet. */
export function ServerUpdateNotice() {
  const { t } = useTranslation();
  if (teachServerReady()) return null;
  return (
    <Alert
      type="info"
      showIcon
      className="tm-teach-block"
      message={t("teach.serverUpdate.title", "This part of TalkMotion is being updated")}
      description={t(
        "teach.serverUpdate.body",
        "Classrooms and courses will be ready here shortly. If this message stays, please refresh the page in a few minutes."
      )}
    />
  );
}

/** Friendly error with a Try again button. */
export function LoadError({ error, onRetry, fallback }) {
  const { t } = useTranslation();
  return (
    <Alert
      type="error"
      showIcon
      className="tm-teach-block"
      message={rpcErrorMessage(error, fallback || t("teach.loadFailed", "We couldn't load this."))}
      action={
        onRetry && (
          <Button size="small" onClick={onRetry}>
            {t("teach.tryAgain", "Try again")}
          </Button>
        )
      }
    />
  );
}

/**
 * Search for people by name, username or e-mail, and act on each result. `renderAction(person)`
 * returns the button(s) for a result; `doneIds` marks people already handled.
 */
export function PeopleSearch({ renderAction, doneIds = [], autoFocus = true, placeholder }) {
  const { t } = useTranslation();
  const [text, setText] = useState("");
  const search = useDebounced(text.trim(), 300);
  const tooShort = search.length < 2;
  const { data, isFetching, error } = useFindPeopleQuery(search, { skip: tooShort });
  const people = (data || []).filter((p) => !p.isMe);

  return (
    <div className="tm-people-search">
      <Input
        size="large"
        allowClear
        autoFocus={autoFocus}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder || t("teach.people.placeholder", "Type a name, username or email")}
        aria-label={t("teach.people.label", "Find a person")}
      />
      <div className="tm-people-search__results" aria-live="polite">
        {tooShort ? (
          <Typography.Text type="secondary">
            {t("teach.people.hint", "Type at least 2 letters. To find someone by email, type their whole email address.")}
          </Typography.Text>
        ) : error ? (
          <Alert type="error" showIcon message={rpcErrorMessage(error)} />
        ) : isFetching && !data ? (
          <Skeleton active paragraph={{ rows: 2 }} title={false} />
        ) : people.length === 0 ? (
          <Typography.Text type="secondary">
            {t("teach.people.none", "No one found. Check the spelling, or ask them for their username.")}
          </Typography.Text>
        ) : (
          <List
            dataSource={people}
            rowKey="userId"
            renderItem={(person) => (
              <List.Item
                actions={[
                  doneIds.includes(person.userId) ? (
                    <Tag key="done" color="success" icon={<CheckOutlined />}>
                      {t("teach.people.added", "Added")}
                    </Tag>
                  ) : (
                    <React.Fragment key="act">{renderAction(person)}</React.Fragment>
                  ),
                ]}
              >
                <List.Item.Meta
                  avatar={<PersonAvatar person={person} />}
                  title={person.name}
                  description={person.username ? `@${person.username}` : null}
                />
              </List.Item>
            )}
          />
        )}
      </div>
    </div>
  );
}
