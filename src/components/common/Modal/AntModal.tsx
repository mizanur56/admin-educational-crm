import { ConfigProvider, Modal, type ModalProps } from "antd";
import type { CSSProperties, ReactNode } from "react";
import "./AntModal.css";

type ModalStyles = {
  root?: CSSProperties;
  header?: CSSProperties;
  body?: CSSProperties;
  footer?: CSSProperties;
  container?: CSSProperties;
  title?: CSSProperties;
  wrapper?: CSSProperties;
  mask?: CSSProperties;
  close?: CSSProperties;
};

export type AntModalProps = Omit<
  ModalProps,
  "open" | "onCancel" | "title" | "children"
> & {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  titleExtra?: ReactNode;
  children?: ReactNode;
  width?: number | string;
  destroyOnClose?: boolean;
};

function cx(...parts: Array<string | false | undefined | null>) {
  return parts.filter(Boolean).join(" ");
}

function resolveStyles(styles: ModalProps["styles"]): ModalStyles | undefined {
  if (!styles || typeof styles === "function") {
    return undefined;
  }
  return styles as ModalStyles;
}

export default function AntModal({
  open,
  onClose,
  title,
  titleExtra,
  children,
  width = 560,
  footer = null,
  centered = true,
  className,
  rootClassName,
  destroyOnClose = true,
  destroyOnHidden,
  afterClose,
  styles,
  ...rest
}: AntModalProps) {
  const userStyles = resolveStyles(styles);

  const resolvedTitle =
    title || titleExtra ? (
      <div className="campusly-ant-modal__title-row">
        {title ? (
          <span className="campusly-ant-modal__title">{title}</span>
        ) : (
          <span />
        )}
        {titleExtra ? (
          <span className="campusly-ant-modal__title-extra">{titleExtra}</span>
        ) : null}
      </div>
    ) : null;

  return (
    <ConfigProvider
      theme={{
        token: {
          motionDurationMid: "0.28s",
          motionDurationSlow: "0.32s",
          motionEaseInOut: "cubic-bezier(0.22, 1, 0.36, 1)",
          motionEaseOut: "cubic-bezier(0.22, 1, 0.36, 1)",
        },
      }}
    >
      <Modal
        open={open}
        onCancel={onClose}
        title={resolvedTitle}
        footer={footer}
        width={width}
        centered={centered}
        destroyOnHidden={destroyOnHidden ?? destroyOnClose}
        afterClose={afterClose}
        mask={{ closable: true }}
        keyboard
        className={cx("campusly-ant-modal", className)}
        rootClassName={cx("campusly-ant-modal-root", rootClassName)}
        styles={{
          ...userStyles,
          mask: {
            backdropFilter: "blur(2px)",
            ...userStyles?.mask,
          },
          container: {
            borderRadius: 18,
            padding: 0,
            overflow: "hidden",
            boxShadow: "0 12px 32px rgb(18 32 51 / 0.12)",
            ...userStyles?.container,
          },
          header: {
            margin: 0,
            padding: "18px 20px 0",
            borderBottom: "none",
            ...userStyles?.header,
          },
          body: {
            padding: "20px",
            ...userStyles?.body,
          },
          footer: userStyles?.footer,
        }}
        {...rest}
      >
        {children}
      </Modal>
    </ConfigProvider>
  );
}
