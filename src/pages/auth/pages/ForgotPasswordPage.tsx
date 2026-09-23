import { Alert, Button, Form } from "antd";
import { useState } from "react";
import { Link } from "react-router-dom";
import Input from "../../../components/Input";
import PageMeta from "../../../components/PageMeta";
import { useForgotPasswordMutation } from "../../../redux/features/auth/authApi";

type ForgotValues = {
  identifier: string;
};

const cardClass =
  "w-full max-w-[400px] rounded-2xl border border-card-border bg-surface p-6 shadow-card";

const formClass =
  "[&_.ant-form-item-label>label]:text-[0.9rem] [&_.ant-form-item-label>label]:font-semibold [&_.ant-form-item-label>label]:text-text-strong";

export default function ForgotPasswordPage() {
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();
  const [form] = Form.useForm<ForgotValues>();
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [resetPath, setResetPath] = useState("");

  async function onFinish(values: ForgotValues) {
    setMessage("");
    setIsError(false);
    setResetPath("");

    try {
      const data = await forgotPassword({
        identifier: values.identifier.trim(),
      }).unwrap();
      setMessage(
        data?.message ||
          "If an account exists, password reset instructions have been sent.",
      );
      setResetPath(data?.devResetPath || "");
    } catch (error) {
      const err = error as {
        data?: { error?: string };
        status?: string | number;
      };
      setIsError(true);
      setMessage(
        err?.data?.error ||
          (err?.status === "FETCH_ERROR"
            ? "Server is not reachable. Start campusly-crm-api."
            : "Could not send reset instructions."),
      );
    }
  }

  return (
    <>
      <PageMeta
        title="Forgot Password"
        description="Request a secure password reset link for your EduConsult CRM account."
      />
      <div className={cardClass}>
        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          onFinish={onFinish}
          className={formClass}
        >
          <div className="mb-6 text-center">
            <h1 className="m-0 mb-1.5 text-[1.55rem] leading-tight font-bold tracking-tight text-text-strong">
              Forgot password
            </h1>
            <p className="m-0 text-[0.92rem] text-text-muted">
              Enter your email or username. A reset link will be created for an
              active account.
            </p>
          </div>

          <Form.Item
            name="identifier"
            label="Email or Username"
            rules={[{ required: true, message: "Enter email or username" }]}
          >
            <Input placeholder="Email or username" />
          </Form.Item>

          {message ? (
            <Alert
              type={isError ? "error" : "success"}
              showIcon
              message={message}
              className="mb-4"
            />
          ) : null}
          {resetPath ? (
            <p className="mb-4 text-[0.85rem] text-text-muted">
              Dev reset: <Link to={resetPath}>{resetPath}</Link>
            </p>
          ) : null}

          <Form.Item className="mb-0!">
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              loading={isLoading}
            >
              Send reset link
            </Button>
          </Form.Item>

          <p className="mt-5 mb-0 text-center">
            <Link
              to="/login"
              className="text-[0.85rem] font-semibold text-primary! no-underline hover:text-primary-hover! hover:underline"
            >
              Back to sign in
            </Link>
          </p>
        </Form>
      </div>
    </>
  );
}
