import { bindReact } from "@quik-fe/stand";
import React from "preact/compat";

import { PNGInfo } from "@stable-canvas/sd-webui-a1111-pnginfo";

const parsePngInfo = async (image: any) => {
  const pngInfo = new PNGInfo(image);
  return {
    params: await pngInfo.getParams(),
    raw_data: await pngInfo.raw_data,
  };
};

type ParamsType = Awaited<ReturnType<PNGInfo["getParams"]>>;

const create = bindReact(React);

type AppStatus = {
  image: null | string;
  pngInfo: null | ParamsType;
  error: null | Error;
  loading: boolean;
  file: null | File;
  raw_data: null | any;
  updateFile: (file: File | null) => void;
};

const isSameFile = (file1: File | null, file2: File | null) => {
  return file1?.name === file2?.name && file1?.size === file2?.size;
};

export const useAppStore = create<AppStatus>((set, get) => ({
  image: null,
  file: null,
  raw_data: null,

  updateFile: async (file) => {
    if (isSameFile(file, get().file)) return;
    if (file === null) {
      set({ image: null, file: null, pngInfo: null, error: null });
      return;
    }

    const { loading } = get();

    if (loading) return;
    set({ file, image: null, pngInfo: null, error: null, loading: true });

    try {
      const image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const image = e.target?.result;
          if (typeof image !== "string") {
            reject(new Error("file reader error"));
            return;
          }
          resolve(image);
        };
        reader.readAsDataURL(file);
      });
      const { params: pngInfo, raw_data } = await parsePngInfo(image);
      set({ pngInfo, image, raw_data, error: null });
    } catch (error) {
      set({ error, pngInfo: null, raw_data: null, image: null, file: null });
    } finally {
      set({ loading: false });
    }
  },
  pngInfo: null,
  error: null,
  loading: false,
}));

// 绑定 drop 事件
window.addEventListener("drop", (e) => {
  e.preventDefault();
  e.stopPropagation();
  const file = e.dataTransfer?.files[0];
  if (!file) return;
  const { updateFile } = useAppStore.get();
  updateFile(file);
});
const preventDefault = (e: DragEvent) => {
  e.preventDefault();
  e.stopPropagation();
};
window.addEventListener("dragenter", preventDefault);
window.addEventListener("dragover", preventDefault);
window.addEventListener("dragleave", preventDefault);
