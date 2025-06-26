if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const axios = require('axios');
const { Movie } = require('../models/');

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

const GENRE_MAP = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Science Fiction',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western'
};

async function fetchMoviesFromTMDB(page = 1) {
  try {
    console.log(`Fetching page ${page} from TMDB...`);

    const response = await axios.get(`${TMDB_BASE_URL}/movie/popular`, {
      headers: {
        'Authorization': `Bearer ${TMDB_API_KEY}`,
        'Content-Type': 'application/json'
      },
      params: {
        page,
        language: 'en-US'
      }
    });

    return response.data;
  } catch (error) {
    console.log(error.message, "<<< error fetching from TMDB");
    throw error;
  }
}

async function seedMovies() {
  try {
    console.log('Starting movie seeding process...');

    const totalPages = 5; // Adjust as needed
    let totalMoviesAdded = 0;

    for (let page = 1; page <= totalPages; page++) {
      const data = await fetchMoviesFromTMDB(page);

      for (const movie of data.results) {
        try {
          // Check if movie already exists
          const existingMovie = await Movie.findOne({
            where: { tmdbId: movie.id }
          });

          if (existingMovie) {
            console.log(`Movie ${movie.title} already exists, skipping...`);
            continue;
          }

          // Map genre IDs to genre names
          const genres = movie.genre_ids
            .map(id => GENRE_MAP[id])
            .filter(Boolean);

          if (genres.length === 0) {
            console.log(`Skipping ${movie.title} - no valid genres`);
            continue;
          }

          const movieData = {
            tmdbId: movie.id,
            title: movie.title,
            overview: movie.overview || '',
            releaseDate: movie.release_date,
            posterPath: movie.poster_path,
            backdropPath: movie.backdrop_path,
            voteAverage: movie.vote_average || 0,
            voteCount: movie.vote_count || 0,
            genres: genres
          };

          await Movie.create(movieData);
          totalMoviesAdded++;
          console.log(`Added movie: ${movie.title}`);

          // Add delay to respect API rate limits
          await new Promise(resolve => setTimeout(resolve, 100));

        } catch (error) {
          console.log(`Error processing movie ${movie.title}:`, error.message);
          continue;
        }
      }

      // Add delay between pages
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log(`Movie seeding completed! Added ${totalMoviesAdded} movies.`);
  } catch (error) {
    console.log('Error seeding movies:', error.message);
    process.exit(1);
  }
}

// Run the seed function
seedMovies().then(() => {
  console.log('Seeding finished successfully!');
  process.exit(0);
}).catch((error) => {
  console.log('Seeding failed:', error.message);
  process.exit(1);
});
