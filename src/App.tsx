import { lazy, Suspense } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import LiquidBackground from "./components/effects/LiquidBackground";
import { HelmetProvider } from "react-helmet-async";
import Header from "./components/Header";
import Home from "./pages/Home";
import VideoModal from "./components/common/VideoModal";
import { VideoModalProvider, useVideoModal } from "./context/VideoModalContext";
import { AuthProvider } from "./context/AuthContext";
import { Toaster, type DefaultToastOptions } from "react-hot-toast";

const Movies = lazy(() => import("./pages/Movies"));
const TVShows = lazy(() => import("./pages/TVShows"));
const MyList = lazy(() => import("./pages/MyList"));
const Search = lazy(() => import("./pages/Search"));
const New = lazy(() => import("./pages/New"));
const Info = lazy(() => import("./pages/Info"));
const Donate = lazy(() => import("./pages/Donate"));
const Blog = lazy(() => import("./pages/Blog"));
const SubtitlePage = lazy(() => import("./pages/Subtitle"));
const Contact = lazy(() =>
  import("./components/tabs/Contact").then((m) => ({ default: m.Contact }))
);
const NotFound = lazy(() =>
  import("./pages/NotFound").then((m) => ({ default: m.NotFound }))
);

const TOAST_OPTIONS: DefaultToastOptions = {
  style: {
    background: "rgba(11, 11, 15, 0.82)",
    backdropFilter: "blur(24px) saturate(150%)",
    WebkitBackdropFilter: "blur(24px) saturate(150%)",
    boxShadow:
      "inset 0 1px 0 rgba(228,232,240,0.2), 0 18px 44px -16px rgba(0,0,0,0.85)",
    color: "#fff",
    borderRadius: "999px",
    border: "1px solid rgba(226, 230, 238, 0.14)",
  },
  success: {
    iconTheme: {
      primary: "#30D158",
      secondary: "#fff",
    },
  },
  error: {
    iconTheme: {
      primary: "#EF4444",
      secondary: "#fff",
    },
  },
};

function AppContent() {
  const { isOpen, embedUrl, closeModal } = useVideoModal();
  const location = useLocation();

  return (
    <div className="relative min-h-screen">
      <LiquidBackground />
      <Header />
      <VideoModal isOpen={isOpen} onClose={closeModal} embedUrl={embedUrl} />
      <motion.main
        key={location.pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
        className="pb-32 lg:pb-0"
      >
        <Suspense
          fallback={
            <div className="min-h-[60vh] flex items-center justify-center">
              <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white/80 animate-spin" />
            </div>
          }
        >
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/movies" element={<Movies />} />
            <Route path="/tv" element={<TVShows />} />
            <Route path="/my-list" element={<MyList />} />
            <Route path="/search" element={<Search />} />
            <Route path="/new" element={<New />} />
            <Route path="/subtitle" element={<SubtitlePage />} />
            <Route path="/donate" element={<Donate />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/info/:type/:id" element={<Info />} />
            <Route path="/contact" element={<Contact />} />

            {/* Catch-all route for 404 Not Found */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </motion.main>
    </div>
  );
}

function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <VideoModalProvider>
          <AppContent />
          <Toaster position="top-center" toastOptions={TOAST_OPTIONS} />
        </VideoModalProvider>
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;
