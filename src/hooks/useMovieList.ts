import { useState, useEffect, useCallback } from 'react';
import { Movie } from '../types/movie';
import {
  getList,
  isInList as localIsInList,
  addToList as localAdd,
  removeFromList as localRemove,
  subscribeToList,
} from '../utils/localList';

export function useIsInMovieList(movieId: number): boolean {
  const [inList, setInList] = useState<boolean>(() => localIsInList(movieId));

  useEffect(() => {
    const sync = () => {
      const next = localIsInList(movieId);
      setInList((prev) => (prev === next ? prev : next));
    };
    sync();
    return subscribeToList(sync);
  }, [movieId]);

  return inList;
}

export function useMovieList() {
  const [movieList, setMovieList] = useState<Movie[]>(() => getList());

  useEffect(() => {
    return subscribeToList(() => {
      setMovieList(getList());
    });
  }, []);

  const isInList = useCallback((movieId: number) => localIsInList(movieId), []);

  const addToList = useCallback(async (movie: Movie) => {
    localAdd(movie);
    return true;
  }, []);

  const removeFromList = useCallback(async (movieId: number) => {
    localRemove(movieId);
    return true;
  }, []);

  const toggleListItem = useCallback(async (movie: Movie): Promise<boolean> => {
    if (localIsInList(movie.id)) {
      localRemove(movie.id);
    } else {
      localAdd(movie);
    }
    return true;
  }, []);

  const refreshList = useCallback(() => {
    setMovieList(getList());
  }, []);

  return {
    movieList,
    loading: false,
    isInList,
    addToList,
    removeFromList,
    toggleListItem,
    refreshList,
  };
}
