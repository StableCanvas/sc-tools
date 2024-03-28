import { render } from "preact";

import preactLogo from "./assets/preact.svg";
import "./style.css";

import styled from "styled-components";
import { useAppStore } from "./useAppStore";
import { ImageViewer } from "./components/ImageView";
import { InfoPanel } from "./components/InfoPanel";

// 窗口大小小于960的时候，就是竖排
const AppContainer = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  height: 100%;

  @media (max-width: 960px) {
    flex-direction: column;
  }
`;

const ImageContainer = styled.div`
  display: flex;
  width: 768px;

  @media (max-width: 960px) {
    width: 100%;
    height: 512px;
  }
`;

const PngInfoContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow-x: hidden;
  overflow-y: auto;
`;

const Loading = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
`;

export function App() {
  const { loading } = useAppStore();
  return (
    <AppContainer>
      <ImageContainer>
        <ImageViewer />
      </ImageContainer>
      <PngInfoContainer>
        <InfoPanel />
      </PngInfoContainer>
      {loading && (
        <Loading>
          <img src={preactLogo} alt="loading" />
          <p>Loading...</p>
        </Loading>
      )}
    </AppContainer>
  );
}

render(<App />, document.getElementById("app"));
