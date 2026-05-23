import { Routes, Route } from "react-router-dom";
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

  return (
    <div className="relative h-screen bg-[#141414]">
      <Header />
      <VideoModal isOpen={isOpen} onClose={closeModal} embedUrl={embedUrl} />
      <main>
        <Routes>
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
      </main>
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
                background: "#1f1f1f",
                color: "#fff",
                borderRadius: "8px",
                border: "1px solid rgba(255, 255, 255, 0.1)",
              },
              success: {
                iconTheme: {
                  primary: "#10B981",
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
