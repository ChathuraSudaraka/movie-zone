import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from "react";

export interface VideoSourceOption {
  key: string;
  name: string;
  url: string;
}

export interface OpenModalOptions {
  title?: string;
  sources?: VideoSourceOption[];
  activeSourceKey?: string;
}

interface VideoModalContextType {
  isOpen: boolean;
  embedUrl: string;
  title: string;
  sources: VideoSourceOption[];
  activeSourceKey: string;
  openModal: (url: string, options?: OpenModalOptions) => void;
  selectSource: (source: VideoSourceOption) => void;
  closeModal: () => void;
}

const VideoModalContext = createContext<VideoModalContextType | undefined>(
  undefined
);

export function VideoModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [embedUrl, setEmbedUrl] = useState("");
  const [title, setTitle] = useState("");
  const [sources, setSources] = useState<VideoSourceOption[]>([]);
  const [activeSourceKey, setActiveSourceKey] = useState("");

  const openModal = useCallback((url: string, options?: OpenModalOptions) => {
    setEmbedUrl(url);
    setTitle(options?.title || "");
    setSources(options?.sources || []);
    setActiveSourceKey(options?.activeSourceKey || "");
    setIsOpen(true);
  }, []);

  const selectSource = useCallback((source: VideoSourceOption) => {
    setEmbedUrl(source.url);
    setActiveSourceKey(source.key);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  const value = useMemo(
    () => ({
      isOpen,
      embedUrl,
      title,
      sources,
      activeSourceKey,
      openModal,
      selectSource,
      closeModal,
    }),
    [isOpen, embedUrl, title, sources, activeSourceKey, openModal, selectSource, closeModal]
  );

  return (
    <VideoModalContext.Provider value={value}>
      {children}
    </VideoModalContext.Provider>
  );
}

export function useVideoModal() {
  const context = useContext(VideoModalContext);
  if (context === undefined) {
    throw new Error("useVideoModal must be used within a VideoModalProvider");
  }
  return context;
}
