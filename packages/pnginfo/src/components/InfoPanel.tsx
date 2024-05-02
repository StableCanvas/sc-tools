import styled from "styled-components";
import { useAppStore } from "../useAppStore";
import { Accordion } from "./Accordion";
import { memo } from "preact/compat";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
`;

const NoInfo = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
`;

// 以下列根据顺序排序，其余根据文本长度排序
const columnsTop = [
  "prompt",
  "negative_prompt",
  "sampler",
  "cfg_scale",
  "size_1",
  "size_2",
  "seed",
  "model_hash",
  "clip_skip",
  "version",
];

export const InfoPanel = memo(() => {
  const { pngInfo, raw_data } = useAppStore();
  const rows = Object.entries(pngInfo || {})
    .filter(([k, v]) => {
      return v !== "" && v !== null && v !== undefined && v !== 0;
    })
    .sort((a, b) => {
      const aIndex = columnsTop.indexOf(a[0]);
      const bIndex = columnsTop.indexOf(b[0]);
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }
      if (aIndex !== -1) {
        return -1;
      }
      if (bIndex !== -1) {
        return 1;
      }
      return a[0].length - b[0].length;
    })
    .map(([key, value]) => {
      return (
        <Accordion
          title={key}
          key={key}
          defaultOpen
          showCopyButton
          requestCopy={() => {
            return String(value);
          }}
        >
          {value}
        </Accordion>
      );
    });
  if (rows.length === 0) {
    return (
      <Container>
        <NoInfo>🤔No info available or parser failed.</NoInfo>
      </Container>
    );
  }
  if (raw_data) {
    // raw_data row
    const data_str = JSON.stringify(raw_data);
    rows.push(
      <Accordion
        title={"Raw Data"}
        defaultOpen
        showCopyButton
        requestCopy={() => data_str}
      >
        {data_str}
      </Accordion>
    );
  }
  return <Container>{rows}</Container>;
});
