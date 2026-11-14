import { useState, useEffect } from "react";
import { Movie } from "../types/movie";
import { FaPlus } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { MovieCard } from "../components/MovieCard";
import { getList, removeFromList } from "../utils/localList";

function MyList() {
  const [myList, setMyList] = useState<Movie[]>(() => getList());
  const [isLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "My List - MovieZone";
    // Refresh from localStorage on mount
    setMyList(getList());
  }, []);

  const handleRemove = (movieId: number) => {
    removeFromList(movieId);
    setMyList(getList());
  };

  if (isLoading) {
    return (
      <div className="mt-[68px] min-h-screen px-4 py-6 md:px-6 lg:px-8">
        <div className="mb-6 h-10 w-40 rounded-full bg-white/[0.05] animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[...Array(10)].map((_, index) => (
            <div
              key={index}
              className="aspect-[2/3] w-full bg-white/[0.05] animate-pulse rounded-[20px]"
            />
          ))}
        </div>
      </div>
    );
  }

  if (myList.length === 0) {
    return (
      <div className="mt-[68px] flex flex-col items-center justify-center min-h-[calc(100vh-68px)] text-white px-4 py-12">
        <div className="liquid-glass rounded-[28px] max-w-md w-full text-center space-y-6 p-8 sm:p-10">
          <div className="mx-auto w-20 h-20 rounded-full glass-chip flex items-center justify-center">
            <FaPlus className="w-8 h-8 text-white/75" />
          </div>
          <div className="space-y-2">
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Your list is empty
            </h1>
            <p className="text-sm sm:text-base text-neutral-300 leading-relaxed">
              Add shows and movies that you want to watch later by clicking the +
              button.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="btn-primary shine px-8 py-3 text-sm sm:text-base"
          >
            <span className="shine-bar" />
            Browse Content
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-[68px] min-h-screen px-4 py-6 md:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="liquid-glass inline-flex items-center gap-3 rounded-full px-5 py-2.5">
          <h1 className="font-display text-lg sm:text-xl md:text-2xl font-bold text-white tracking-tight">
            My List
          </h1>
          <span className="glass-chip rounded-full px-2.5 py-0.5 text-xs font-semibold text-neutral-200">
            {myList.length}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {myList.map((item) => (
          <MovieCard
            key={item.id}
            movie={item}
            showRemoveButton={true}
            onListUpdate={() => handleRemove(item.id)}
          />
        ))}
      </div>
    </div>
  );
}

export default MyList;
