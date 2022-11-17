import React from "react";

function PageHeader(props) {
  return (
    <section className="page-header">
      <div className="container">
        <h1>{props.title}</h1>
      </div>
    </section>
  );
}

export default PageHeader;
