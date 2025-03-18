import { Routes, Route } from "react-router-dom";
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
import { Login } from "./pages/auth/Login";
import { Register } from "./pages/auth/Register";
import { AuthProvider } from "./context/AuthContext";
import { Profile } from "./pages/Profile";
import { Contact } from "./pages/Contact";

function AppContent() {
  const { isOpen, embedUrl, closeModal } = useVideoModal();

  return (
    <div className="relative h-screen bg-[#141414]">
      <Header />
      <VideoModal isOpen={isOpen} onClose={closeModal} embedUrl={embedUrl} />
      <main className="relative">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/movies" element={<Movies />} />
          <Route path="/tv" element={<TVShows />} />
          <Route path="/my-list" element={<MyList />} />
          <Route path="/search" element={<Search />} />
          <Route path="/new" element={<New />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/info/:type/:id" element={<Info />} />
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/register" element={<Register />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <VideoModalProvider>
        <AppContent />
      </VideoModalProvider>
    </AuthProvider>
  );
}

export default App;
