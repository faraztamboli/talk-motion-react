import React from "react";
import { Link } from "react-router-dom";
import { useFlag } from "../../hooks/useFlag";

/**
 * Link that respects `legacy_models_visible`. For model content while v1 models are hidden,
 * it renders the same children as plain text, so lists keep their layout but don't lead to
 * a hidden page.
 */
export default function ModelLink({ isModel = true, to, children, ...rest }) {
  const modelsVisible = useFlag("legacy_models_visible");
  if (isModel && !modelsVisible) {
    return (
      <span {...rest} data-hidden-link="model">
        {children}
      </span>
    );
  }
  return (
    <Link to={to} {...rest}>
      {children}
    </Link>
  );
}
