import { useEffect, useState } from "react";
import { Movie } from "../types/movie";
import { FaPlay, FaPlus, FaCheck } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@mui/material";

const FALLBACK_IMAGE =
  "https://via.placeholder.com/400x600/1e1e1e/ffffff?text=No+Image+Available";

function MovieCard({ item, onRemove }: { item: Movie; onRemove: (e: React.MouseEvent, id: number) => void }) {
  const [isHovered, setIsHovered] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const navigate = useNavigate();

  const handleClick = () => {
    window.scrollTo(0, 0);
    navigate(`/info/${item.media_type}/${item.id}`);
  };

  const imageUrl = imgError || !item.poster_path
    ? FALLBACK_IMAGE
    : `https://image.tmdb.org/t/p/w500${item.poster_path}`;

  return (
    <div
      className="relative min-w-[160px] md:h-[420px] md:min-w-[280px] cursor-pointer 
                 transition-all duration-300 ease-in-out group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      style={{ willChange: "transform" }}
    >
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-900 animate-pulse rounded-sm" />
      )}

      <img
        src={imageUrl}
        alt={item.title}
        loading="lazy"
        decoding="async"
        onError={() => setImgError(true)}
        onLoad={() => setIsLoaded(true)}
        className={`rounded-sm object-cover md:rounded w-full h-full
                   transition-all duration-300 ${isHovered ? "scale-105 brightness-75" : ""}
                   ${isLoaded ? "opacity-100" : "opacity-0"}`}
      />

      <div
        className={`absolute inset-0 flex flex-col justify-end p-4 
                   transition-opacity duration-300 ${isHovered ? "opacity-100" : "opacity-0"}`}
      >
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <button
              className="flex items-center justify-center w-10 h-10 rounded-full 
                       bg-white/90 hover:bg-white transition group-hover:scale-110"
              onClick={(e) => {
                e.stopPropagation();
                handleClick();
              }}
            >
              <FaPlay className="h-5 w-5 text-black pl-0.5" />
            </button>
            <button
              onClick={(e) => onRemove(e, item.id)}
              className="flex items-center justify-center w-10 h-10 rounded-full 
                      bg-[#2a2a2a]/60 hover:bg-[#2a2a2a] transition group-hover:scale-110"
              title="Remove from My List"
            >
              <FaCheck className="text-white text-sm" />
            </button>
          </div>
          <h3 className="text-white font-semibold drop-shadow-lg line-clamp-1">
            {item.title}
          </h3>
        </div>
      </div>
    </div>
  );
}

function MyList() {
  const [myList, setMyList] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "My List - MovieZone";
    // Load saved movies from localStorage
    const savedList = localStorage.getItem("netflix-mylist");
    if (savedList) {
      setMyList(JSON.parse(savedList));
    }
    // Simulate loading delay (optional - remove if not needed)
    setTimeout(() => setIsLoading(false), 1000);
  }, []);

  const removeFromList = (e: React.MouseEvent, movieId: number) => {
    e.stopPropagation(); // Prevent triggering the parent div's onClick
    const updatedList = myList.filter((item) => item.id !== movieId);
    setMyList(updatedList);
    localStorage.setItem("netflix-mylist", JSON.stringify(updatedList));
  };

  if (isLoading) {
    return (
      <div className="mt-[68px] min-h-screen bg-[#141414]">
        <div className="px-2 py-6 md:px-3 lg:px-4">
          <div className="h-8 w-40 bg-gray-700 rounded mb-6 animate-pulse"></div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[...Array(10)].map((_, index) => (
              <div key={index} className="relative min-w-[160px] md:h-[420px] md:min-w-[280px]">
                <Skeleton
                  variant="rectangular"
                  width="100%"
                  height="100%"
                  sx={{ bgcolor: "#2b2b2b" }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (myList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#141414] text-white px-4">
        <div className="max-w-md w-full text-center space-y-6 py-16">
          <div className="mx-auto w-24 h-24 rounded-full bg-[#2f2f2f] flex items-center justify-center mb-8">
            <FaPlus className="w-12 h-12 text-[#686868]" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold">Your list is empty</h1>
          <p className="text-lg text-[#686868]">
            Add shows and movies that you want to watch later by clicking the +
            button.
          </p>
          <button
            onClick={() => navigate("/")}
            className="bg-white text-black px-8 py-3 rounded-md font-medium hover:bg-[#e6e6e6] transition duration-300"
          >
            Browse Content
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-[68px] min-h-screen bg-[#141414]">
      <div className="px-2 py-6 md:px-3 lg:px-4">
        <h1 className="mb-6 text-xl font-semibold text-white md:text-2xl lg:text-3xl">
          My List
        </h1>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {myList.map((item) => (
            <MovieCard
              key={item.id}
              item={item}
              onRemove={removeFromList}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default MyList;
