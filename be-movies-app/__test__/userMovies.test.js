const request = require('supertest');
const app = require('../app');
const { User, Movie, UserMovies } = require('../models');
const { signToken } = require('../helpers/jwt');

let token;
let userId;
let movieId;
let nonExistentMovieId = 99999;

beforeAll(async () => {
  const user = await User.create({
    username: 'testuser',
    email: 'test@mail.com',
    password: 'password123',
    preferredGenres: 'Action, Comedy'
  });
  userId = user.id;
  token = signToken({ id: userId });

  const movie = await Movie.create({
    title: 'Test Movie',
    posterPath: '/test.jpg',
    overview: 'Test overview',
    releaseDate: '2025-07-03',
    genreIds: '1,2'
  });
  movieId = movie.id;
});

afterAll(async () => {
  await UserMovies.destroy({ where: {} });
  await Movie.destroy({ where: {} });
  await User.destroy({ where: {} });
});

describe('UserMovies Routes', () => {
  describe('POST /user-movies', () => {
    it('should add movie to favorites', async () => {
      const res = await request(app)
        .post('/user-movies')
        .set('Authorization', `Bearer ${token}`)
        .send({
          movieId,
          type: 'favorite'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.userMovie).toHaveProperty('id');
      expect(res.body.data.userMovie.type).toBe('favorite');
    });

    it('should add movie to watchlist', async () => {
      const res = await request(app)
        .post('/user-movies')
        .set('Authorization', `Bearer ${token}`)
        .send({
          movieId,
          type: 'watchlist'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.userMovie).toHaveProperty('id');
      expect(res.body.data.userMovie.type).toBe('watchlist');
      expect(res.body.data.userMovie.status).toBe('pending');
    });

    it('should not allow invalid type', async () => {
      const res = await request(app)
        .post('/user-movies')
        .set('Authorization', `Bearer ${token}`)
        .send({
          movieId,
          type: 'invalid'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Type must be 'favorite' or 'watchlist'");
    });

    it('should not allow missing movieId or type', async () => {
      const res = await request(app)
        .post('/user-movies')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Movie ID and type are required");
    });

    it('should handle non-existent movie', async () => {
      const res = await request(app)
        .post('/user-movies')
        .set('Authorization', `Bearer ${token}`)
        .send({
          movieId: nonExistentMovieId,
          type: 'favorite'
        });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe(`Movie with id ${nonExistentMovieId} not found`);
    });

    it('should prevent adding same movie twice', async () => {
      // Clear existing user movies first
      await UserMovies.destroy({ where: { userId } });

      // First addition
      await request(app)
        .post('/user-movies')
        .set('Authorization', `Bearer ${token}`)
        .send({
          movieId,
          type: 'favorite'
        });

      // Second attempt with same movie
      const res = await request(app)
        .post('/user-movies')
        .set('Authorization', `Bearer ${token}`)
        .send({
          movieId,
          type: 'favorite'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Movie already in your favorite');
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .post('/user-movies')
        .send({
          movieId,
          type: 'favorite'
        });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('message');
    });
  });

  describe('GET /user-movies', () => {
    beforeAll(async () => {
      // Clear and add some test data
      await UserMovies.destroy({ where: { userId } });

      await UserMovies.bulkCreate([
        { userId, movieId, type: 'favorite' },
        { userId, movieId, type: 'watchlist', status: 'pending' }
      ]);
    });

    it('should get all user movies', async () => {
      const res = await request(app)
        .get('/user-movies')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.userMovies)).toBe(true);
    });

    it('should filter by type', async () => {
      const res = await request(app)
        .get('/user-movies?type=favorite')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.userMovies.every(m => m.type === 'favorite')).toBe(true);
    });

    it('should filter by status', async () => {
      const res = await request(app)
        .get('/user-movies?type=watchlist&status=pending')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.userMovies.every(m => m.status === 'pending')).toBe(true);
    });

    it('should require authentication', async () => {
      const res = await request(app).get('/user-movies');

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('message');
    });

    it('should handle invalid type filter', async () => {
      const res = await request(app)
        .get('/user-movies?type=invalid')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Type must be 'favorite' or 'watchlist'");
    });
  });

  describe('PATCH /user-movies/:id/status', () => {
    let watchlistMovieId;

    beforeAll(async () => {
      // Ensure we have a watchlist movie to update
      const userMovie = await UserMovies.findOne({
        where: { userId, type: 'watchlist' }
      });

      if (!userMovie) {
        const newUserMovie = await UserMovies.create({
          userId,
          movieId,
          type: 'watchlist',
          status: 'pending'
        });
        watchlistMovieId = newUserMovie.id;
      } else {
        watchlistMovieId = userMovie.id;
      }
    });

    it('should update movie status to watched', async () => {
      const res = await request(app)
        .patch(`/user-movies/${watchlistMovieId}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'watched' });

      expect(res.status).toBe(200);
      expect(res.body.data.userMovie.status).toBe('watched');
    });

    it('should not allow invalid status', async () => {
      const res = await request(app)
        .patch(`/user-movies/${watchlistMovieId}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'invalid' });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Status must be 'watched'");
    });

    it('should handle non-existent user movie', async () => {
      const res = await request(app)
        .patch(`/user-movies/99999/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'watched' });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Movie not found in your watchlist');
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .patch(`/user-movies/${watchlistMovieId}/status`)
        .send({ status: 'watched' });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('message');
    });
  });

  describe('DELETE /user-movies/:id', () => {
    let movieToDeleteId;

    beforeAll(async () => {
      // Create a user movie to delete
      const userMovie = await UserMovies.create({
        userId,
        movieId,
        type: 'favorite'
      });
      movieToDeleteId = userMovie.id;
    });

    it('should delete user movie', async () => {
      const res = await request(app)
        .delete(`/user-movies/${movieToDeleteId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Movie removed from your list');
    });

    it('should return 404 for non-existent movie', async () => {
      const res = await request(app)
        .delete(`/user-movies/999999`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Movie not found in your list');
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .delete(`/user-movies/999999`);

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('message');
    });
  });
});
