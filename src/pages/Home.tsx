import { useEffect } from "react";
import Banner from "../components/Banner";
import Row from "../components/Row";
import requests from "../utils/requests";


const Home = () => {

  useEffect(() => {
    document.title = "Home - MovieZone";
  }, []);
  
  return (
    <div className="relative h-screen">
      {/* Banner Section */}
      <Banner fetchUrl={requests.fetchNetflixOriginals} />

      {/* Main Content */}
      <main className="relative z-10 -mt-[55px] pb-6 md:pb-12 lg:-mt-[100px] lg:space-y-16">
        <section className="space-y-6 md:space-y-12">
          <Row title="Netflix Originals" fetchUrl={requests.fetchNetflixOriginals} />
          <Row title="Trending Now" fetchUrl={requests.fetchTrending} />
          <Row title="Top Rated TV" fetchUrl={requests.fetchTopRatedTV} />
          <Row title="Popular TV Shows" fetchUrl={requests.fetchPopularTV} />
          <Row title="Action Movies" fetchUrl={requests.fetchActionMovies} />
          <Row title="Comedy Movies" fetchUrl={requests.fetchComedyMovies} />
          <Row title="Horror Movies" fetchUrl={requests.fetchHorrorMovies} />
          <Row title="Romance Movies" fetchUrl={requests.fetchRomanceMovies} />
          <Row title="Documentaries" fetchUrl={requests.fetchDocumentaries} />
        </section>
      </main>

      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#010511] via-gray-900/90 to-transparent -z-10" />
    </div>
  );
};

export default Home;
