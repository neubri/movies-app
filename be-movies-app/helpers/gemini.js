const { GoogleGenerativeAI } = require("@google/generative-ai");

/**
 * Generates movie recommendations using Google Gemini AI
 * @param {string[]} preferredGenreNames - Array of genre names the user prefers
 * @param {Object[]} movieList - List of movies with their metadata
 * @returns {Promise<number[]>} - Promise resolving to array of exactly 6 movie IDs
 */
async function generateRecommendationIds(preferredGenreNames, movieList) {
  try {
    // Validate API key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY not found in environment variables");
    }

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Format user preferences for prompt
    const userPreferences = preferredGenreNames.join(", ");

    // Use a subset of movies to avoid token limits (take the most recent ones)
    const contextMovies = movieList.slice(0, 100).map((movie) => ({
      id: movie.id,
      title: movie.title,
      genreIds: movie.genreIds,
    }));

    // Craft prompt for Gemini
    const prompt = `
As a movie recommendation system, your task is to select 6 movies that match a user's genre preferences.

User's preferred genres: ${userPreferences}

Available movies (format: id | title | genreIds):
${contextMovies
  .map((movie) => `${movie.id} | ${movie.title} | ${movie.genreIds}`)
  .join("\n")}

Instructions:
1. Choose exactly 6 movies that best match the user's preferred genres
2. Prioritize movies with genres matching user preferences
3. Provide diverse recommendations within those genres
4. Return ONLY the movie IDs as a JSON array with no explanation
5. Format: [id1, id2, id3, id4, id5, id6]
`;

    // Generate content with Gemini
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Handle null or undefined response
    if (!text) {
      throw new Error("No response text from Gemini API");
    }

    const trimmedText = text.trim();

    // Parse the response
    let recommendedIds;

    try {
      // Try parsing as JSON array
      recommendedIds = JSON.parse(trimmedText);
    } catch (e) {
      // Try extracting array if embedded in text
      const arrayMatch = trimmedText.match(/\[\s*(\d+\s*,\s*)*\d+\s*\]/);
      if (arrayMatch) {
        recommendedIds = JSON.parse(arrayMatch[0]);
      } else {
        // Extract numbers as last resort
        recommendedIds = trimmedText.match(/\d+/g)?.map(Number) || [];
      }
    }

    // Validate recommendations
    if (!Array.isArray(recommendedIds)) {
      recommendedIds = [];
    }

    // Remove any non-numeric values
    recommendedIds = recommendedIds.filter(
      (id) => typeof id === "number" && !isNaN(id)
    );

    // Ensure we have valid movie IDs that exist in our database
    recommendedIds = recommendedIds.filter((id) =>
      movieList.some((movie) => movie.id === id)
    );

    // If we don't have enough recommendations, add more movies
    if (recommendedIds.length < 6) {
      const additionalIds = movieList
        .filter((movie) => !recommendedIds.includes(movie.id))
        .slice(0, 6 - recommendedIds.length)
        .map((movie) => movie.id);

      recommendedIds = [...recommendedIds, ...additionalIds];
    }

    // Return exactly 6 recommendations
    return recommendedIds.slice(0, 6);
  } catch (error) {
    console.error("Gemini API Error:", error.message);

    // Fallback: return 6 first movies from the list
    return movieList.slice(0, 6).map((movie) => movie.id);
  }
}

module.exports = { generateRecommendationIds };
