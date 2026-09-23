import { Alert, Button, Checkbox, Form } from "antd";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Input from "../components/Input";
import PageMeta from "../components/PageMeta";
import { useAuth } from "../hooks/useAuth";
import { isAuthSession } from "../lib/auth-session";
import { useLoginMutation } from "../redux/features/auth/authApi";

type LoginValues = {
  identifier: string;
  password: string;
  rememberMe?: boolean;
};

const cardClass =
  "w-full max-w-[400px] rounded-2xl border border-card-border bg-surface px-10 py-10 shadow-card sm:px-12 sm:py-11 [&_.ant-form-item-label>label]:text-[0.9rem] [&_.ant-form-item-label>label]:font-semibold [&_.ant-form-item-label>label]:text-text-strong";

export default function Login() {
  const navigate = useNavigate();
  const { applySession } = useAuth();
  const [login, { isLoading }] = useLoginMutation();
  const [form] = Form.useForm<LoginValues>();
  const [message, setMessage] = useState("");

  async function onFinish(values: LoginValues) {
    setMessage("");

    try {
      const data = await login({
        identifier: values.identifier.trim(),
        password: values.password,
        rememberMe: Boolean(values.rememberMe),
      }).unwrap();

      if (isAuthSession(data)) {
        applySession(data);
        toast.success("Signed in successfully");
        navigate("/dashboard", { replace: true });
        return;
      }

      setMessage("Could not sign in.");
    } catch (error) {
      const err = error as {
        data?: { error?: string; message?: string };
        status?: string | number;
      };
      const text =
        err?.data?.error ||
        err?.data?.message ||
        (err?.status === "FETCH_ERROR"
          ? "Server is not reachable. Start campusly-crm-api."
          : "Could not sign in.");
      setMessage(text);
    }
  }

  return (
    <>
      <PageMeta
        title="Sign In"
        description="Sign in to EduConsult CRM to manage leads, applications, students, and team operations."
      />
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        initialValues={{ rememberMe: false }}
        onFinish={onFinish}
        className={cardClass}
      >
        <div className="mb-6 text-center">
          <h1 className="m-0 mb-1.5 text-[1.55rem] leading-tight font-bold tracking-tight text-text-strong">
            Welcome back
          </h1>
          <p className="m-0 text-[0.92rem] text-text-muted">
            Sign in to continue to your dashboard
          </p>
        </div>

        <Form.Item
          name="identifier"
          label="Email or Username"
          rules={[{ required: true, message: "Enter email or username" }]}
        >
          <Input autoComplete="username" placeholder="Email or username" />
        </Form.Item>

        <Form.Item
          name="password"
          label="Password"
          rules={[{ required: true, message: "Enter password" }]}
        >
          <Input.Password
            autoComplete="current-password"
            placeholder="Enter password"
          />
        </Form.Item>

        <div className="mb-5 flex items-center justify-between gap-3">
          <Form.Item
            name="rememberMe"
            valuePropName="checked"
            className="mb-0!"
          >
            <Checkbox className="text-text-muted">Remember me</Checkbox>
          </Form.Item>
          <Link
            to="/forgot-password"
            className="text-[0.85rem] font-semibold text-primary! no-underline hover:text-primary-hover! hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        {message ? (
          <Alert type="error" showIcon message={message} className="mb-4" />
        ) : null}

        <Form.Item className="mb-0!">
          <Button
            type="primary"
            htmlType="submit"
            block
            size="large"
            loading={isLoading}
          >
            Sign In
          </Button>
        </Form.Item>
      </Form>
    </>
  );
}
