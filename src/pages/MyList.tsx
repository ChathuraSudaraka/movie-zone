import { useState, useEffect } from "react";
import { Movie } from "../types/movie";
import { FaPlus } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@mui/material";
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
      <div className="mt-[68px] min-h-screen bg-[#141414]">
        <div className="px-4 py-6 md:px-6 lg:px-8">
          <div className="mb-6">
            <Skeleton
              variant="rectangular"
              width={160}
              height={32}
              sx={{ bgcolor: "#1f1f1f", borderRadius: 1 }}
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[...Array(10)].map((_, index) => (
              <div
                key={index}
                className="aspect-[2/3] w-full relative rounded-sm overflow-hidden"
              >
                <Skeleton
                  variant="rectangular"
                  width="100%"
                  height="100%"
                  sx={{ bgcolor: "#1f1f1f" }}
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
      <div className="px-3 py-4 sm:px-4 sm:py-6 md:px-6 lg:px-8">
        <h1
          className="mb-4 sm:mb-6 text-lg sm:text-xl md:text-2xl lg:text-3xl 
                    font-semibold text-white"
        >
          My List
        </h1>
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
    </div>
  );
}

export default MyList;
