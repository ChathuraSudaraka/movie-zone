import { Routes, Route, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import LiquidBackground from "./components/effects/LiquidBackground";
import { HelmetProvider } from "react-helmet-async";
import Header from "./components/Header";
import Home from "./pages/Home";
import Movies from "./pages/Movies";
import TVShows from "./pages/TVShows";
import MyList from "./pages/MyList";
import Search from "./pages/Search";
import New from "./pages/New";
import Info from "./pages/Info";
import VideoModal from "./components/common/VideoModal";
import { VideoModalProvider, useVideoModal } from "./context/VideoModalContext";
import { AuthProvider } from "./context/AuthContext";
import { Contact } from "./components/tabs/Contact";
import { NotFound } from "./pages/NotFound";
import { Toaster } from "react-hot-toast";
import Donate from "./pages/Donate";
import Blog from "./pages/Blog";
import SubtitlePage from "./pages/Subtitle";

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
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.32, 0.72, 0, 1] }}
        className="pb-32 lg:pb-0"
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
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: "rgba(11, 11, 15, 0.82)",
                backdropFilter: "blur(24px) saturate(150%)",
                WebkitBackdropFilter: "blur(24px) saturate(150%)",
                boxShadow: "inset 0 1px 0 rgba(228,232,240,0.2), 0 18px 44px -16px rgba(0,0,0,0.85)",
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
            }}
          />
        </VideoModalProvider>
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;
