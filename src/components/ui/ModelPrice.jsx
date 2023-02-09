import React, { useState, useEffect } from "react";
import { Modal, Form, Input, Tabs, Select, Button, Space } from "antd";
import { MinusCircleOutlined } from "@ant-design/icons";
import { PlusOutlined } from "@ant-design/icons/lib/icons";
import usePayment from "../../hooks/usePayment";
import useModels from "../../hooks/useModels";

function ModelPrice(props) {
  const [supportedCurrencies, setSupportedCurrencies] = useState([]);
  const { getSupportedCurrencies } = usePayment();
  const [form] = Form.useForm();
  const { Option } = Select;

  useEffect(() => {
    getSupportedCurrencies()
      .then((res) => setSupportedCurrencies(res))
      .catch((err) => console.log(err));
  }, []);

  return (
    <Modal
      open={props.open}
      title="Set Model Price"
      okText="Update"
      cancelText="Cancel"
      destroyOnClose
      onCancel={props.onCancel}
      onOk={() => {
        form
          .validateFields()
          .then((values) => {
            props.onCreate(values);
          })
          .catch((info) => {
            console.log("Validate Failed:", info);
          });
      }}
    >
      <Tabs
        defaultActiveKey="2"
        centered
        type="card"
        destroyInactiveTabPane
        items={new Array(2).fill(null).map((_, i) => {
          const id = String(i + 1);
          return {
            label: <span>{id == 1 ? "One Time" : "Recurring"}</span>,
            key: id,
            children:
              id == 1 ? (
                <>
                  <Form
                    form={form}
                    name="form_in_modal"
                    labelWrap
                    labelCol={{ span: 6 }}
                    wrapperCol={{ span: 18 }}
                    initialValues={{
                      status: "onetime",
                      currency:
                        supportedCurrencies.length > 0
                          ? supportedCurrencies[0]
                          : null,
                    }}
                  >
                    <Form.Item
                      name="unitprice"
                      label="Unit Price"
                      rules={[
                        {
                          required: true,
                          message: "Please enter the unit price!",
                        },
                      ]}
                    >
                      <Input type="number" />
                    </Form.Item>
                    <Form.Item name="currency" label="Currency">
                      <Select>
                        {supportedCurrencies?.length > 0 &&
                          supportedCurrencies.map((currency, index) => {
                            return (
                              <Option key={index} value={currency}>
                                {currency}
                              </Option>
                            );
                          })}
                      </Select>
                    </Form.Item>
                  </Form>
                </>
              ) : (
                <Tabs
                  destroyInactiveTabPane
                  items={new Array(2).fill(null).map((_, i) => {
                    const id = String(i + 1);
                    return {
                      label: <span>{id == 1 ? "Fixed" : "Metered"}</span>,
                      key: id,
                      children:
                        id == 1 ? (
                          <>
                            <Form
                              form={form}
                              name="form_in_modal"
                              labelWrap
                              labelCol={{ span: 6 }}
                              wrapperCol={{ span: 18 }}
                              initialValues={{
                                currency:
                                  supportedCurrencies.length > 0
                                    ? supportedCurrencies[0]
                                    : null,
                                interval: "month",
                                usagetype: "licensed",
                              }}
                            >
                              <Form.Item
                                name="unitprice"
                                label="Unit Price"
                                rules={[
                                  {
                                    required: true,
                                    message: "Please enter the unit price!",
                                  },
                                ]}
                              >
                                <Input type="number" />
                              </Form.Item>
                              <Form.Item name="currency" label="Currency">
                                <Select>
                                  {supportedCurrencies?.length > 0 &&
                                    supportedCurrencies.map(
                                      (currency, index) => {
                                        return (
                                          <Option key={index} value={currency}>
                                            {currency}
                                          </Option>
                                        );
                                      }
                                    )}
                                </Select>
                              </Form.Item>
                              <Form.Item name="interval" label="Interval">
                                <Select>
                                  <Option value="day">day</Option>
                                  <Option value="week">week</Option>
                                  <Option value="month">month</Option>
                                  <Option value="year">year</Option>
                                </Select>
                              </Form.Item>

                              <Form.Item
                                name="intervalcount"
                                label="Interval Count"
                                rules={[
                                  {
                                    required: true,
                                    message: "Please enter the interval count!",
                                  },
                                ]}
                              >
                                <Input type="number" />
                              </Form.Item>

                              <Form.Item name="usagetype" label="Usage Type">
                                <Select>
                                  <Option value="licensed">licensed</Option>
                                  <Option value="metered">metered</Option>
                                </Select>
                              </Form.Item>
                            </Form>
                          </>
                        ) : (
                          <>
                            <Form
                              form={form}
                              name="form_in_modal"
                              style={{
                                maxWidth: 600,
                              }}
                              initialValues={{ currency: "usd" }}
                              autoComplete="off"
                            >
                              <Form.Item name="currency" className="flex">
                                <Select>
                                  {supportedCurrencies?.length > 0 &&
                                    supportedCurrencies.map(
                                      (currency, index) => {
                                        return (
                                          <Option key={index} value={currency}>
                                            {currency}
                                          </Option>
                                        );
                                      }
                                    )}
                                </Select>
                              </Form.Item>
                              <Form.List name="metered">
                                {(fields, { add, remove }) => (
                                  <>
                                    {fields.map(
                                      ({ key, name, ...restField }) => (
                                        <Space
                                          key={key}
                                          style={{
                                            display: "flex",
                                            marginBottom: 8,
                                          }}
                                          align="baseline"
                                        >
                                          <Form.Item
                                            {...restField}
                                            name={[name, "unit_amount"]}
                                            rules={[
                                              {
                                                required: true,
                                                message: "Missing tiers",
                                              },
                                            ]}
                                          >
                                            <Input
                                              placeholder="Unit Amount"
                                              type="number"
                                            />
                                          </Form.Item>
                                          <Form.Item
                                            {...restField}
                                            name={[name, "up_to"]}
                                            rules={[
                                              {
                                                required: true,
                                                message: "Missing upto date",
                                              },
                                            ]}
                                          >
                                            <Input placeholder="Up to" />
                                          </Form.Item>
                                          <MinusCircleOutlined
                                            onClick={() => remove(name)}
                                          />
                                        </Space>
                                      )
                                    )}
                                    <Form.Item>
                                      <Button
                                        type="dashed"
                                        onClick={() => add()}
                                        block
                                        icon={<PlusOutlined />}
                                      >
                                        Add field
                                      </Button>
                                    </Form.Item>
                                  </>
                                )}
                              </Form.List>
                            </Form>
                          </>
                        ),
                    };
                  })}
                />
              ),
          };
        })}
      />
    </Modal>
  );
}

function App(props) {
  const [open, setOpen] = useState(false);
  const { setModelPrice } = useModels();
  const { model_id } = props;
  const onCreate = (values) => {
    console.log(values);

    // For OneTime
    if (values.usagetype === undefined && values.metered === undefined) {
      console.log(values);
      setModelPrice(model_id, values.unitprice, null, values.currency, null)
        .then((res) => console.log(res))
        .catch((err) => console.log(err));
    }

    // For Recurring (Fixed)
    if (
      values.interval !== undefined &&
      values.intervalcount !== undefined &&
      values.metered === undefined
    ) {
      console.log(values);
      setModelPrice(model_id, values.unitprice, null, values.currency, {
        interval: values.interval,
        usage_type: values.usage_type,
        interval_count: values.interval_count,
      })
        .then((res) => console.log(res))
        .catch((err) => console.log(err));
    }

    if (values.metered !== undefined) {
      console.log("metered", values);
      let tiers_arr = [];
      values.metered.length > 0 &&
        values.metered.map((elem, index) => {
          tiers_arr = [...tiers_arr, elem];
        });
      let lastInd = tiers_arr.length;
      tiers_arr[lastInd - 1].up_to = "inf";

      console.log(tiers_arr);
      values.metered.map((value, index) => {
        setModelPrice(model_id, null, tiers_arr, values.currency, null)
          .then((res) => console.log(res))
          .catch((err) => console.log(err));
      });
    }
    // setOpen(false);
  };

  return (
    <>
      <div onClick={() => setOpen(true)}>Set Price</div>

      <ModelPrice
        open={open}
        onCreate={onCreate}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}

export default App;