import styled from "styled-components";
import { useAppStore } from "../useAppStore";
import { memo } from "preact/compat";

const Dropzone = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 2px dashed #ccc;
  border-radius: 8px;
  cursor: pointer;
  user-select: none;
  transition: border-color 0.3s;

  width: 100%;
  height: calc(100% - 2rem);
  box-sizing: border-box;

  margin: 1rem;
  padding: 1rem;

  &:hover {
    border-color: #333;
  }
`;

const ImageContainer = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;

  background-color: #333;

  img {
    max-width: 100%;
    max-height: 100%;
  }
`;

const ClearButton = styled.button`
  border: none;
  background-color: rgba(0, 0, 0, 0.4);
  color: #fff;
  height: 64px;
  width: 64px;
  cursor: pointer;

  position: absolute;
  top: 0;
  left: 0;
`;

export const ImageViewer = memo(() => {
  const { image, updateFile } = useAppStore();

  const uploadImage = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        updateFile(file);
      }
    };
    input.click();
  };

  if (image) {
    return (
      <ImageContainer>
        <ClearButton
          onClick={() => updateFile(null)}
          title={"clear image and info"}
        >
          Clear
        </ClearButton>
        <img src={image} alt="image" />
      </ImageContainer>
    );
  }
  return (
    <Dropzone onClick={uploadImage}>
      <p>📥 Drop your image here</p>
    </Dropzone>
  );
});
