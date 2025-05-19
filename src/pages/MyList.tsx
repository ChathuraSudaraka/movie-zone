import { useEffect, useState } from "react";
import { Movie } from "../types/movie";
import { FaPlus } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@mui/material";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../config/supabase";
import { MovieCard } from "../components/MovieCard";

function MyList() {
  const [myList, setMyList] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchMyList = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("user_lists")
        .select("movie_id, title, poster_path, media_type, added_at")
        .eq("user_id", user?.id)
        .order("added_at", { ascending: false });

      if (error) throw error;

      const formattedList = data.map(
        (item) =>
          ({
            id: item.movie_id,
            title: item.title,
            poster_path: item.poster_path,
            media_type: item.media_type,
            adult: false,
            backdrop_path: "",
            genre_ids: [],
            original_language: "",
            original_title: item.title,
            overview: "",
            popularity: 0,
            release_date: "",
            video: false,
            vote_average: 0,
            vote_count: 0,
          } as Movie)
      );

      setMyList(formattedList);
    } catch (error) {
      console.error("Error fetching my list:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Update useEffect to properly handle dependencies
  useEffect(() => {
    if (user) {
      fetchMyList();
    }
  }, [user?.id]); // Add proper dependency

  // Add subscription for real-time updates
  useEffect(() => {
    if (!user) return;

    const subscription = supabase
      .channel("user_lists_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_lists",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new && "movies" in payload.new) {
            setMyList(payload.new.movies || []);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#141414] text-white px-4">
        <div className="max-w-md w-full text-center space-y-6 py-16">
          <div className="mx-auto w-24 h-24 rounded-full bg-[#2f2f2f] flex items-center justify-center mb-8">
            <FaPlus className="w-12 h-12 text-[#686868]" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold">
            Sign in to access your list
          </h1>
          <p className="text-lg text-[#686868]">
            Keep track of what you want to watch by adding movies and shows to
            your list.
          </p>
          <button
            onClick={() => navigate("/auth/login")}
            className="bg-red-600 text-white px-8 py-3 rounded-md font-medium hover:bg-red-700 transition duration-300"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mt-[68px] min-h-screen bg-[#141414]">
        <div className="px-4 py-6 md:px-6 lg:px-8">
          {/* Header Skeleton */}
          <div className="mb-6">
            <Skeleton
              variant="rectangular"
              width={160}
              height={32}
              sx={{ bgcolor: "#1f1f1f", borderRadius: 1 }}
            />
          </div>

          {/* Grid Skeleton */}
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
                {/* Mobile Title Skeleton - Only visible on mobile */}
                <div className="md:hidden absolute bottom-0 left-0 right-0 p-2">
                  <Skeleton
                    variant="text"
                    width="80%"
                    sx={{ bgcolor: "#1f1f1f" }}
                  />
                </div>
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
        <h1 className="mb-4 sm:mb-6 text-lg sm:text-xl md:text-2xl lg:text-3xl 
                    font-semibold text-white">
          My List
        </h1>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {myList.map((item) => (
            <MovieCard
              key={item.id}
              movie={item}
              showRemoveButton={true}
              onListUpdate={fetchMyList}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default MyList;
