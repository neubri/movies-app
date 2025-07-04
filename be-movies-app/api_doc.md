# Movies API Documentation

## Endpoints :

List of available endpoints:
​

- `GET /pub/movies`
- `GET /pub/movies/popular`
- `GET /pub/movies/:id`
- `GET /pub/genres`

List of available endpoints (require login):
​

- `POST /register`
- `POST /login`
- `POST /google-login`
- `GET /movies`
- `GET /movies/:id`
- `GET /recommendations`
- `GET /recommendations/history`
- `POST /user-movies`
- `GET /user-movies`
- `PATCH /user-movies/:id/status`
- `DELETE /user-movies/:id`

&nbsp;

## 1. POST /register

Request:

- body:

```json
{
  "username": "johndoe",
  "email": "john.doe@example.com",
  "password": "password123",
  "preferredGenres": "28,12,16"
}
```

_Response (201 - Created)_

```json
{
  "message": "Create user success",
  "user": {
    "username": "johndoe",
    "email": "john.doe@example.com",
    "preferredGenres": "28,12,16"
  }
}
```

_Response (400 - Bad Request)_

```json
{
  "message": "Email is required"
}
OR
{
  "message": "Invalid email format"
}
OR
{
  "message": "Password is required"
}
OR
{
  "message": "Username is required"
}
OR
{
  "message": "Password must be at least 8 characters"
}
OR
{
  "message": "Email must be unique"
}
OR
{
  "message": "Username must be unique"
}
```

&nbsp;

## 2. POST /login

Request:

- body:

```json
{
  "email": "john.doe@example.com",
  "password": "password123"
}
```

_Response (200 - OK)_
​

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzE5ODcwMTMzfQ.example",
  "user": {
    "username": "johndoe",
    "email": "john.doe@example.com",
    "preferredGenres": "28,12,16"
  }
}
```

_Response (400 - Bad Request)_

```json
{
  "message": "Email is required"
}
OR
{
  "message": "Password is required"
}
```

_Response (401 - Unauthorized)_

```json
{
  "message": "Invalid email/password"
}
```

&nbsp;

## 3. POST /google-login

Request:

- body:

```json
{
  "id_token": "google_oauth2_id_token_here"
}
```

_Response (200 - OK)_

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzE5ODcwMTMzfQ.example",
  "user": {
    "username": "johndoe",
    "email": "john.doe@example.com",
    "preferredGenres": null
  },
  "message": "Google login successful"
}
```

_Response (400 - Bad Request)_

```json
{
  "message": "Google ID token is required"
}
OR
{
  "message": "Invalid or expired Google token"
}
```

&nbsp;

## 4. GET /pub/movies

Description: Get movies from TMDB API without authentication

Request:

- query parameters (optional):

```
?search=avengers
?filter=28 (genre ID)
?sort=title or ?sort=-title
?page[number]=1&page[size]=10
```

_Response (200 - OK)_

```json
{
  "statusCode": 200,
  "data": {
    "query": [
      {
        "id": 299536,
        "title": "Avengers: Infinity War",
        "synopsis": "As the Avengers and their allies have continued to protect the world...",
        "trailerUrl": "https://www.youtube.com/watch?v=6ZfuNTqbHE8",
        "imgUrl": "https://image.tmdb.org/t/p/w500/7WsyChQLEftFiDOVTGkv3hFpyyt.jpg",
        "rating": 8,
        "genreId": 12,
        "authorId": 1,
        "createdAt": "2018-04-25",
        "updatedAt": "2025-07-04T12:00:00.000Z",
        "Genre": {
          "id": 12,
          "name": "Adventure",
          "createdAt": "2025-07-04T12:00:00.000Z",
          "updatedAt": "2025-07-04T12:00:00.000Z"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPage": 500,
      "totalRows": 10000
    }
  }
}
```

_Response (401 - Unauthorized)_

```json
{
  "message": "Invalid TMDB API token"
}
```

_Response (404 - Not Found)_

```json
{
  "message": "No movies found"
}
```

&nbsp;

## 5. GET /pub/movies/popular

Description: Get popular movies from TMDB API

Request:

- query parameters (optional):

```
?page[number]=1&page[size]=10
```

_Response (200 - OK)_

```json
{
  "statusCode": 200,
  "data": {
    "query": [
      {
        "id": 299536,
        "title": "Avengers: Infinity War",
        "synopsis": "As the Avengers and their allies have continued to protect the world...",
        "trailerUrl": "https://www.youtube.com/watch?v=6ZfuNTqbHE8",
        "imgUrl": "https://image.tmdb.org/t/p/w500/7WsyChQLEftFiDOVTGkv3hFpyyt.jpg",
        "rating": 8,
        "genreId": 12,
        "authorId": 1,
        "createdAt": "2018-04-25",
        "updatedAt": "2025-07-04T12:00:00.000Z",
        "Genre": {
          "id": 12,
          "name": "Adventure",
          "createdAt": "2025-07-04T12:00:00.000Z",
          "updatedAt": "2025-07-04T12:00:00.000Z"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPage": 500,
      "totalRows": 10000
    }
  }
}
```

&nbsp;

## 6. GET /pub/movies/:id

Description: Get specific movie details from TMDB API

Request:

- params:

```json
{
  "id": 299536
}
```

_Response (200 - OK)_

```json
{
  "statusCode": 200,
  "data": {
    "movie": {
      "id": 299536,
      "title": "Avengers: Infinity War",
      "synopsis": "As the Avengers and their allies have continued to protect the world...",
      "trailerUrl": "https://www.youtube.com/watch?v=6ZfuNTqbHE8",
      "imgUrl": "https://image.tmdb.org/t/p/w500/7WsyChQLEftFiDOVTGkv3hFpyyt.jpg",
      "rating": 8,
      "genreId": 12,
      "authorId": 1,
      "createdAt": "2018-04-25",
      "updatedAt": "2025-07-04T12:00:00.000Z",
      "Genre": {
        "id": 12,
        "name": "Adventure",
        "createdAt": "2025-07-04T12:00:00.000Z",
        "updatedAt": "2025-07-04T12:00:00.000Z"
      }
    }
  }
}
```

_Response (404 - Not Found)_

```json
{
  "message": "Movie with ID 999999 not found"
}
```

&nbsp;

## 7. GET /pub/genres

Description: Get all movie genres from TMDB API

Request:

- `-`

_Response (200 - OK)_

```json
{
  "statusCode": 200,
  "data": {
    "query": [
      {
        "id": 28,
        "name": "Action",
        "createdAt": "2025-07-04T12:00:00.000Z",
        "updatedAt": "2025-07-04T12:00:00.000Z"
      },
      {
        "id": 12,
        "name": "Adventure",
        "createdAt": "2025-07-04T12:00:00.000Z",
        "updatedAt": "2025-07-04T12:00:00.000Z"
      }
    ]
  }
}
```

&nbsp;

## 8. GET /movies

Description: Get movies from local database (requires authentication)

Request:

- headers:

```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzE5ODcwMTMzfQ.example"
}
```

- query parameters (optional):

```
?search=avengers
?filter=28 (genre ID)
?sort=title or ?sort=-title
?page[number]=1&page[size]=10
```

_Response (200 - OK)_

```json
{
  "statusCode": 200,
  "data": {
    "query": [
      {
        "id": 1,
        "title": "Test Movie 1",
        "overview": "Test overview 1",
        "posterPath": "/test1.jpg",
        "releaseDate": "2025-07-01",
        "genreIds": "1,2",
        "createdAt": "2025-07-04T12:00:00.000Z",
        "updatedAt": "2025-07-04T12:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPage": 1,
      "totalRows": 2
    }
  }
}
```

&nbsp;

## 9. GET /movies/:id

Description: Get specific movie from local database

Request:

- headers:

```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzE5ODcwMTMzfQ.example"
}
```

- params:

```json
{
  "id": 1
}
```

_Response (200 - OK)_

```json
{
  "statusCode": 200,
  "data": {
    "movie": {
      "id": 1,
      "title": "Test Movie 1",
      "overview": "Test overview 1",
      "posterPath": "/test1.jpg",
      "releaseDate": "2025-07-01",
      "genreIds": "1,2",
      "createdAt": "2025-07-04T12:00:00.000Z",
      "updatedAt": "2025-07-04T12:00:00.000Z"
    }
  }
}
```

_Response (404 - Not Found)_

```json
{
  "message": "Movie with id 999999 not found"
}
```

&nbsp;

## 10. GET /recommendations

Description: Get personalized movie recommendations using AI

Request:

- headers:

```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzE5ODcwMTMzfQ.example"
}
```

_Response (200 - OK)_

```json
{
  "statusCode": 200,
  "data": {
    "recommendations": [
      {
        "id": 1,
        "title": "Test Movie 1",
        "overview": "Test overview 1",
        "posterPath": "/test1.jpg",
        "releaseDate": "2025-07-01",
        "genreIds": "1,2",
        "reason": "Recommended based on your interest in Action, Comedy"
      }
    ],
    "preferredGenres": ["Action", "Comedy", "Drama"]
  }
}
```

&nbsp;

## 11. GET /recommendations/history

Description: Get user's recommendation history

Request:

- headers:

```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzE5ODcwMTMzfQ.example"
}
```

- query parameters (optional):

```
?page[number]=1&page[size]=10
```

_Response (200 - OK)_

```json
{
  "statusCode": 200,
  "data": {
    "query": [
      {
        "id": 1,
        "userId": 1,
        "movieId": 1,
        "reason": "Recommended based on your interest in Action, Comedy",
        "createdAt": "2025-07-04T12:00:00.000Z",
        "updatedAt": "2025-07-04T12:00:00.000Z",
        "Movie": {
          "id": 1,
          "title": "Test Movie 1",
          "posterPath": "/test1.jpg",
          "overview": "Test overview 1",
          "releaseDate": "2025-07-01",
          "genreIds": "1,2"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPage": 1,
      "totalRows": 6
    }
  }
}
```

&nbsp;

## 12. POST /user-movies

Description: Add movie to user's favorites or watchlist

Request:

- headers:

```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzE5ODcwMTMzfQ.example"
}
```

- body:

```json
{
  "movieId": 1,
  "type": "favorite"
}
```

OR

```json
{
  "movieId": 1,
  "type": "watchlist"
}
```

_Response (201 - Created)_

```json
{
  "statusCode": 201,
  "data": {
    "userMovie": {
      "id": 1,
      "userId": 1,
      "movieId": 1,
      "type": "favorite",
      "status": null,
      "createdAt": "2025-07-04T12:00:00.000Z",
      "updatedAt": "2025-07-04T12:00:00.000Z"
    }
  }
}
```

_Response (400 - Bad Request)_

```json
{
  "message": "Movie ID and type are required"
}
OR
{
  "message": "Type must be 'favorite' or 'watchlist'"
}
OR
{
  "message": "Movie already in your favorite"
}
```

_Response (404 - Not Found)_

```json
{
  "message": "Movie with id 999999 not found"
}
```

&nbsp;

## 13. GET /user-movies

Description: Get user's movies (favorites and watchlist)

Request:

- headers:

```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzE5ODcwMTMzfQ.example"
}
```

- query parameters (optional):

```
?type=favorite
?type=watchlist
?status=pending
?status=watched
```

_Response (200 - OK)_

```json
{
  "statusCode": 200,
  "data": {
    "userMovies": [
      {
        "id": 1,
        "userId": 1,
        "movieId": 1,
        "type": "favorite",
        "status": null,
        "createdAt": "2025-07-04T12:00:00.000Z",
        "updatedAt": "2025-07-04T12:00:00.000Z",
        "Movie": {
          "id": 1,
          "title": "Test Movie 1",
          "posterPath": "/test1.jpg",
          "overview": "Test overview 1",
          "releaseDate": "2025-07-01",
          "genreIds": "1,2"
        }
      }
    ]
  }
}
```

_Response (400 - Bad Request)_

```json
{
  "message": "Type must be 'favorite' or 'watchlist'"
}
```

&nbsp;

## 14. PATCH /user-movies/:id/status

Description: Update watchlist movie status to watched

Request:

- headers:

```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzE5ODcwMTMzfQ.example"
}
```

- params:

```json
{
  "id": 1
}
```

- body:

```json
{
  "status": "watched"
}
```

_Response (200 - OK)_

```json
{
  "statusCode": 200,
  "data": {
    "message": "Movie status updated successfully"
  }
}
```

_Response (400 - Bad Request)_

```json
{
  "message": "Status must be 'watched'"
}
```

_Response (404 - Not Found)_

```json
{
  "message": "Movie not found in your watchlist"
}
```

&nbsp;

## 15. DELETE /user-movies/:id

Description: Remove movie from user's list

Request:

- headers:

```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzE5ODcwMTMzfQ.example"
}
```

- params:

```json
{
  "id": 1
}
```

_Response (200 - OK)_

```json
{
  "statusCode": 200,
  "data": {
    "message": "Movie removed from your list successfully"
  }
}
```

_Response (404 - Not Found)_

```json
{
  "message": "Movie not found in your list"
}
```

&nbsp;

## Global Error

_Response (401 - Unauthorized)_

```json
{
  "message": "Invalid Token"
}
OR
{
  "message": "Invalid token"
}
```

_Response (500 - Internal Server Error)_

```json
{
  "message": "Internal server error"
}
```
