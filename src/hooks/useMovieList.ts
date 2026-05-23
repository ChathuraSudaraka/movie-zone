import { useState, useEffect } from 'react';
import { Movie } from '../types/movie';
import {
  getList,
  isInList as localIsInList,
  addToList as localAdd,
  removeFromList as localRemove,
} from '../utils/localList';

export function useMovieList() {
  const [movieList, setMovieList] = useState<Movie[]>(() => getList());

  // Keep state in sync if another tab changes localStorage
  useEffect(() => {
    const onStorage = () => setMovieList(getList());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const isInList = (movieId: number) => localIsInList(movieId);

  const addToList = async (movie: Movie) => {
    localAdd(movie);
    setMovieList(getList());
    return true;
  };

  const removeFromList = async (movieId: number) => {
    localRemove(movieId);
    setMovieList(getList());
    return true;
  };

  const toggleListItem = async (movie: Movie): Promise<boolean> => {
    if (localIsInList(movie.id)) {
      localRemove(movie.id);
    } else {
      localAdd(movie);
    }
    setMovieList(getList());
    return true;
  };

  return {
    movieList,
    loading: false,
    isInList,
    addToList,
    removeFromList,
    toggleListItem,
    refreshList: () => setMovieList(getList()),
  };
}
