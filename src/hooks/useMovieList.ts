import { useState, useEffect } from 'react';
import { Movie } from '../types/movie';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';

export function useMovieList() {
  const [movieList, setMovieList] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchMovieList = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('user_lists')
        .select('movie_id, title, poster_path, media_type')
        .eq('user_id', user.id)
        .order('added_at', { ascending: false });

      if (error) throw error;

      const formattedList = data?.map(item => ({
        id: item.movie_id,
        title: item.title,
        poster_path: item.poster_path,
        media_type: item.media_type,
        adult: false,
        backdrop_path: '',
        genre_ids: [],
        original_language: '',
        original_title: item.title,
        overview: '',
        popularity: 0,
        release_date: '',
        video: false,
        vote_average: 0,
        vote_count: 0
      } as Movie)) || [];

      setMovieList(formattedList);
    } catch (error) {
      console.error('Error fetching movie list:', error);
    } finally {
      setLoading(false);
    }
  };

  const isInList = (movieId: number) => {
    return movieList.some(movie => movie.id === movieId);
  };

  const addToList = async (movie: Movie) => {
    if (!user) return false;
    try {
      const { error } = await supabase
        .from('user_lists')
        .insert({
          user_id: user.id,
          movie_id: movie.id,
          title: movie.title,
          poster_path: movie.poster_path,
          media_type: movie.media_type || 'movie'
        });

      if (error) throw error;
      await fetchMovieList();
      return true;
    } catch (error) {
      console.error('Error adding to list:', error);
      return false;
    }
  };

  const removeFromList = async (movieId: number) => {
    if (!user) return false;
    try {
      const { error } = await supabase
        .from('user_lists')
        .delete()
        .eq('user_id', user.id)
        .eq('movie_id', movieId);

      if (error) throw error;
      await fetchMovieList();
      return true;
    } catch (error) {
      console.error('Error removing from list:', error);
      return false;
    }
  };

  useEffect(() => {
    fetchMovieList();
  }, [user]);

  return {
    movieList,
    loading,
    isInList,
    addToList,
    removeFromList,
    refreshList: fetchMovieList
  };
}
