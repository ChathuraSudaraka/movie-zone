import { useEffect } from "react";
import Banner from "../components/Banner";
import Row from "../components/Row";
import requests from "../utils/requests";


const Home = () => {

  useEffect(() => {
    document.title = "Home - MovieZone";
  }, []);
  
  return (
    <div className="relative min-h-screen">
      {/* Banner Section */}
      <Banner fetchUrl={requests.fetchNetflixOriginals} />

      {/* Main Content */}
      <main className="relative z-10 -mt-[55px] pb-12 md:pb-16 lg:-mt-[100px] lg:space-y-12">
        <section className="space-y-4 md:space-y-8">
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
    </div>
  );
};

export default Home;
