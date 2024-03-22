import * as React from "react";
import * as ReactDOM from "react-dom";
import htm from "htm";
import styled from "styled-components";

import ReactLazyLoadImage from "react-lazy-load-image-component";

import { evaluate } from "@stable-canvas/sdk";

const { LazyLoadImage } = ReactLazyLoadImage;

const { useEffect, useState, useRef, useCallback, useMemo, useReducer } = React;

const html = htm.bind(React.createElement);

class Store {
  state = {};
  listeners = new Set();

  setState(partial) {
    this.state = {
      ...this.state,
      ...(typeof partial === "function" ? partial(this.state) : partial),
    };
    this.listeners.forEach((listener) => listener(this.state));
  }

  getState() {
    return this.state;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

function create(setup) {
  const store = new Store();
  const set = store.setState.bind(store);
  const get = store.getState.bind(store);

  store.setState(setup(set, get));

  const useStore = (selector = (x) => ({ ...x })) => {
    const [state, update] = useState(() => selector(store.getState()));

    useEffect(() => {
      const unsubscribe = store.subscribe(() => {
        const newState = selector(store.getState());
        const isChanged =
          Object.keys(newState).some((key) => newState[key] !== state[key]) ||
          Object.keys(state).some((key) => state[key] !== newState[key]);
        if (!isChanged) return;

        update(newState);
      });
      return () => unsubscribe();
    }, []);

    return state;
  };

  useStore.set = set;
  useStore.get = get;
  useStore._store = store;

  return useStore;
}

// sdc-api
const api = {
  all_presets: () =>
    evaluate(async (sdc_sdk) => {
      const presets_ext = await sdc_sdk.extensions.presets().instance();
      const all_presets = await presets_ext.list_presets();
      return all_presets;
    }),
  draw: (prompt, preset_id, width, height) =>
    evaluate(
      async (sdc_sdk, prompt, preset_id, width, height) => {
        const presets_ext = await sdc_sdk.extensions.presets().instance();
        const client_ext = await sdc_sdk.extensions.client().instance();

        const request_payload = await presets_ext.get_request_payload(
          preset_id,
          {
            prompt,
            width,
            height,
          }
        );
        const clients = await client_ext.getAllClients();

        const client = clients[0];

        if (!client) {
          throw new Error("no client");
        }

        return client.instance.request(request_payload);
      },
      prompt,
      preset_id,
      width,
      height
    ),
};

const useAppStore = create((set, get) => ({
  // states
  width: 640,
  height: 960,
  presets: [],
  text: "",
  presetId: "",
  current_response: null,
  loading: false,
  // 存所有的历史请求结果
  response_history: [],
  history_length: 50,
  // 无限自动生成
  free_auto_generate: false,
  // 如果输入框有变化，自动触发生成
  input_auto_generate: false,
  // methods
  recordResponse: (response) =>
    set((state) => ({
      response_history: [
        ...state.response_history,
        {
          ...response,
          id: Math.random().toString(36).substr(2),
        },
      ].slice(-state.history_length),
    })),
  setCurrentResponse: (response) => set({ current_response: response }),
  setPresets: (presets) => set({ presets }),
  setText: (text) => set({ text }),
  setPresetId: (presetId) => set({ presetId }),
  setImage: (image) => set({ image }),
  setLoading: (loading) => set({ loading }),
  // actions

  draw: async () => {
    const {
      text,
      presetId,
      recordResponse,
      height,
      width,
      free_auto_generate,
      draw,
      loading,
    } = get();

    if (loading) return;
    if (!text.trim()) return;

    set({ loading: true });
    try {
      const result = await api.draw(text, presetId, width, height);
      result.images = result.images.map((image) => {
        if (!image.startsWith("data:")) {
          image = "data:image/png;base64," + image;
        }
        return image;
      });
      recordResponse(result);
      set({ current_response: result });

      if (free_auto_generate) {
        setTimeout(draw, 500);
      }
    } catch (error) {
      console.error(error);
    } finally {
      set({ loading: false });
    }
  },
}));

useAppStore._store.subscribe((state) => {
  if (state.free_auto_generate && !state.loading) {
    state.draw();
  }
});

api.all_presets().then((presets) => {
  useAppStore.set((state) => ({
    ...state,
    presets: presets.map((x) => ({ ...x, id: x._preset_id })),
  }));
  console.log("presets loaded", presets);
});

const PresetContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
`;

const PresetItem = styled.div`
  padding: 4px;
  margin: 2px;
  border: 1px solid #ccc;
  cursor: pointer;
  user-select: none;

  &:hover {
    box-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
  }
  &:active {
    box-shadow: 0 0 5px rgba(0, 0, 0, 0.2);
  }
  &.--active {
    background: #888;
    color: #fff;
  }
`;

// 显示所有preset，提供选择
const PresetPanel = () => {
  const { presetId, setPresetId, presets } = useAppStore(
    ({ presetId, setPresetId, presets }) => ({ presetId, setPresetId, presets })
  );

  return html`
    <${PresetContainer}>
      ${presets.length === 0 && html`<div>No presets</div>`}
      ${presets.map((preset) => {
        return html`<${PresetItem} className=${
          presetId === preset.id ? "--active" : ""
        } onClick=${() => setPresetId(preset.id)} key=${preset.id}>${
          preset.name
        }</${PresetItem}>`;
      })}
    <//>
  `;
};

const ImageInfo = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  padding: 10px;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  font-size: 12px;
  display: none;
`;

const ImageViewerContainer = styled.div`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 512px;
  width: 100%;

  margin-bottom: 16px;

  &:hover {
    ${ImageInfo} {
      display: block;
    }
  }

  img {
    max-width: 100%;
    max-height: 100%;
    min-height: 50%;
  }
`;

const ImageViewer = () => {
  const { current_response } = useAppStore((state) => ({
    current_response: state.current_response,
  }));
  // 显示图片
  const image = current_response?.images?.[0] || "";
  const info_data = current_response?.info
    ? JSON.parse(current_response.info)
    : {};
  const info_text = info_data?.infotexts?.[0] || "";
  return html`
    <${ImageViewerContainer}>
      <img src=${image} alt="" />
        <${ImageInfo}>${info_text}</${ImageInfo}>
      <//>
      `;
};

const HistoryImageContainer = styled.div`
  height: 120px;
  margin-right: 5px;
  cursor: pointer;

  display: inline-block;

  &:hover {
    box-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
  }
  &:active {
    box-shadow: 0 0 5px rgba(0, 0, 0, 0.2);
  }

  img {
    object-fit: cover;
  }
`;

const HistoryItem = ({ response }) => {
  const { setCurrentResponse } = useAppStore((state) => ({
    setCurrentResponse: state.setCurrentResponse,
  }));
  const { images } = response;
  return html`
    <${HistoryImageContainer}
      onClick=${() => {
        console.log(response);
        setCurrentResponse(response);
      }}
    >
      <${LazyLoadImage} src=${images[0]} height=${120} alt="" />
    <//>
  `;
};

const HistoryPanelContainer = styled.div`
  display: flex;
  overflow: auto;
  align-items: center;
`;

const HistoryPanel = () => {
  const { response_history } = useAppStore();

  return html`
    <${HistoryPanelContainer}>
      ${response_history.length === 0 && html`<div>No history</div>`}
      ${response_history.map((response) => {
        return html`
          <${HistoryItem} response=${response} key=${response.id} />
        `;
      })}
    <//>
  `;
};

const ConfigurePanelContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  background: #f0f0f0;

  label {
    margin-right: 8px;
  }
`;

const ConfigurePanel = () => {
  const {
    free_auto_generate,
    input_auto_generate,
    history_length,
    width,
    height,
  } = useAppStore(
    ({
      free_auto_generate,
      input_auto_generate,
      history_length,
      width,
      height,
    }) => ({
      free_auto_generate,
      input_auto_generate,
      history_length,
      width,
      height,
    })
  );

  const { set } = useAppStore;

  // size 最小64 步长64 最大2048
  return html` <${ConfigurePanelContainer}>
    <fieldset>
      <legend>size</legend>

      current size: ${width}x${height}
      <br />
      <label>
        width
        <input
          type="range"
          defaultValue=${width}
          min="64"
          max="2048"
          step="64"
          onChange=${(e) => set({ width: e.target.value })}
        />
      </label>
      <label>
        height
        <input
          type="range"
          defaultValue=${height}
          min="64"
          max="2048"
          step="64"
          onChange=${(e) => set({ height: e.target.value })}
        />
        <br />
      </label>
    </fieldset>

    <fieldset>
      <legend>auto generate</legend>
      <label>
        <input
          type="checkbox"
          defaultChecked=${free_auto_generate}
          onChange=${(e) => set({ free_auto_generate: e.target.checked })}
        />
        free auto generate
      </label>
      <label>
        <input
          type="checkbox"
          defaultChecked=${input_auto_generate}
          onChange=${(e) => set({ input_auto_generate: e.target.checked })}
        />
        input auto generate
      </label>
    </fieldset>

    <fieldset>
      <legend>history</legend>
      <label>
        clear history
        <button onClick=${() => set({ response_history: [] })}>clear</button>
      </label>
      <label>
        history length
        <input
          type="number"
          defaultValue=${history_length}
          onChange=${(e) => set({ history_length: e.target.value })}
        />
      </label>
    </fieldset>
  <//>`;
};

const SettingPanelContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 180px;
  width: 100%;
  background: #f0f0f0;

  position: absolute;
  top: calc(100% + 10px);
  left: 0;

  color: #000;
  padding: 0.5rem;
  box-sizing: border-box;

  border-radius: 8px;

  .panel-body {
    flex: 1;
    overflow: auto;
    margin-top: 4px;
  }
`;

const SettingPanel = () => {
  // panel: presets, configure, history
  const [panel, setPanel] = useState("presets");
  const map = {
    presets: html`<${PresetPanel} />`,
    configure: html`<${ConfigurePanel} />`,
    history: html`<${HistoryPanel} />`,
  };
  return html`
    <${SettingPanelContainer}>
      <div>
        <button onClick=${() => setPanel("presets")}>Presets</button>
        <button onClick=${() => setPanel("configure")}>Configure</button>
        <button onClick=${() => setPanel("history")}>History</button>
      </div>
      <div className=${"panel-body"}>${map[panel]}</div>
    <//>
  `;
};

const InputAreaContainer = styled.div`
  display: flex;
  position: relative;

  margin-bottom: 200px;

  min-width: 300px;
  width: 100%;
  max-width: 600px;

  input,
  textarea {
    flex: 1;
    outline: none;
  }
`;

function debounce(func, timeout = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(this, args);
    }, timeout);
  };
}

const debounceDraw = debounce(() => useAppStore.get().draw(), 1000);

const InputArea = () => {
  const { text, loading, setText, draw, input_auto_generate } = useAppStore(
    ({ text, loading, setText, draw, input_auto_generate }) => ({
      text,
      loading,
      setText,
      draw,
      input_auto_generate,
    })
  );
  const [showSettingPanel, setShowSettingPanel] = useState(false);
  return html`
    <${InputAreaContainer}>
      <textarea
        style=${{ resize: "none", height: "3rem" }}
        type="text"
        value=${text}
        onInput=${(e) => {
          setText(e.target.value);
          if (input_auto_generate) {
            debounceDraw();
          }
        }}
        placeholder="Type prompt..."
      />
      <button
        onClick=${() => setShowSettingPanel(!showSettingPanel)}
        title="settings"
      >
        ⚙
      </button>
      <button onClick=${draw} disabled=${loading} title="generate">✨</button>

      ${showSettingPanel && html`<${SettingPanel} />`}
    <//>
  `;
};

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
`;

const App = () => {
  return html`
    <${AppContainer}>
      <${ImageViewer} />
      <${InputArea} />
    <//>
  `;
};

ReactDOM.createRoot(document.getElementById("app")).render(html`<${App} />`);
