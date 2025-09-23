import React from "react";
import { dummyShowsData } from "../assets/assets";
import MovieCard from "../components/MovieCard";
import BlurCircle from "../components/BlurCircle";

const Favorite = () => {
  if (!dummyShowsData || dummyShowsData.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <p className="text-gray-500 text-lg">No Favorite available right now.</p>
      </div>
    );
  }

  return (
    <div className="relative my-40 mb-60 px-6 md:px-16 lg:px-40 xl:px-44 overflow-hidden min-h-[80vh]">
      {/* Top Left Blur */}
      <BlurCircle top="50px" left="0px" />

      {/* Bottom Right Blur */}
      <BlurCircle bottom="0px" right="0px" />

      <h1 className="text-lg font-medium my-4">Your Favorite Movies</h1>
      <div className="flex flex-wrap max-sm:justify-center gap-8">
        {dummyShowsData.map((movie) => (
          <MovieCard movie={movie} key={movie.id} />
        ))}
      </div>
    </div>
  );
};

export default Favorite;
