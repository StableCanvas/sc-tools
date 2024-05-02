import React, { memo } from "preact/compat";
import styled from "styled-components";

const Container = styled.div`
  box-sizing: border-box;
  width: 100%;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;

  background-color: rgba(0, 0, 0, 0.4);
`;

const Title = styled.div`
  padding: 8px;
  cursor: pointer;
  font-weight: bold;
  user-select: none;
  flex: 1;

  .title-open-icon {
    width: 2rem;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    font-weight: 100;
  }
`;

const Content = styled.div`
  padding: 8px;
  word-break: break-all;
  width: 100%;
  box-sizing: border-box;
`;

const CopyButton = styled.button`
  border: none;
  padding: 4px 8px;
  width: 64px;
  text-align: center;
  background-color: rgba(0, 0, 0, 0.4);
  color: #fff;
  cursor: pointer;
  box-sizing: border-box;
`;

type AccordionProps = {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  onToggle?: (open: boolean) => void;
  showCopyButton?: boolean;
  requestCopy?: () => string;
};

export const Accordion = memo((props: AccordionProps) => {
  const {
    title,
    children,
    defaultOpen = false,
    onToggle,
    showCopyButton,
    requestCopy,
  } = props;

  const hasCopyButton = showCopyButton && requestCopy;

  const [open, setOpen] = React.useState(defaultOpen);
  const [copied, setCopied] = React.useState(false);

  const handleToggle = () => {
    setOpen(!open);
    onToggle?.(!open);
  };

  const handleCopy = () => {
    if (requestCopy) {
      navigator.clipboard.writeText(requestCopy());
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 1000);
    }
  };

  const handleContentClick = (e: React.TargetedEvent) => {
    // NOTE: 效果有点奇怪...算了
    // 点击之后就全选
    // const range = document.createRange();
    // const selection = window.getSelection();
    // range.selectNodeContents(e.target as Node);
    // selection?.removeAllRanges();
    // selection?.addRange(range);
  };

  return (
    <Container>
      <Header>
        <Title onClick={handleToggle}>
          <span className="title-open-icon">{open ? "-" : "+"}</span>
          {title}
        </Title>
        {hasCopyButton && (
          <CopyButton onClick={handleCopy}>
            {copied ? "Copied!" : "Copy"}
          </CopyButton>
        )}
      </Header>
      {open && <Content onClick={handleContentClick}>{children}</Content>}
    </Container>
  );
});
