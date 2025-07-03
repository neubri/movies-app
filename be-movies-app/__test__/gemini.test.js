const { GoogleGenerativeAI } = require('@google/generative-ai');
const { generateRecommendationIds } = require('../helpers/gemini');

// Mock the GoogleGenerativeAI
jest.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
      getGenerativeModel: jest.fn().mockReturnValue({
        generateContent: jest.fn()
      })
    }))
  };
});

// Save original environment
const originalEnv = process.env;

describe('Gemini Helper', () => {
  // Sample test data
  const preferredGenreNames = ['Action', 'Comedy', 'Drama'];
  const movieList = [
    { id: 1, title: 'Action Movie', genreIds: '28,12' },
    { id: 2, title: 'Comedy Movie', genreIds: '35,10749' },
    { id: 3, title: 'Drama Movie', genreIds: '18,36' },
    { id: 4, title: 'Horror Movie', genreIds: '27,53' },
    { id: 5, title: 'Romance Movie', genreIds: '10749,18' },
    { id: 6, title: 'Action Movie 2', genreIds: '28,53' },
    { id: 7, title: 'Comedy Movie 2', genreIds: '35,18' },
    { id: 8, title: 'Drama Movie 2', genreIds: '18,10749' }
  ];

  beforeEach(() => {
    // Reset the mocks before each test
    jest.clearAllMocks();

    // Reset environment variables
    process.env = { ...originalEnv, GEMINI_API_KEY: 'test-api-key' };
  });

  afterAll(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  it('should call Gemini API with correctly formatted prompt', async () => {
    // Mock the generate content response
    const mockGenerateContent = jest.fn().mockResolvedValue({
      response: {
        text: () => '[1, 2, 3, 4, 5, 6]'
      }
    });

    // Setup the mocks
    const mockGetGenerativeModel = jest.fn().mockReturnValue({
      generateContent: mockGenerateContent
    });

    GoogleGenerativeAI.mockImplementation(() => ({
      getGenerativeModel: mockGetGenerativeModel
    }));

    // Call the helper
    await generateRecommendationIds(preferredGenreNames, movieList);

    // Verify Gemini was initialized with API key
    expect(GoogleGenerativeAI).toHaveBeenCalledWith('test-api-key');

    // Verify correct model was requested (updated to new model name)
    expect(mockGetGenerativeModel).toHaveBeenCalledWith({ model: 'gemini-1.5-flash' });

    // Verify prompt contains user preferences and movie data
    expect(mockGenerateContent).toHaveBeenCalled();
    const promptArg = mockGenerateContent.mock.calls[0][0];
    expect(promptArg).toContain('Action, Comedy, Drama');
    expect(promptArg).toContain('1 | Action Movie | 28,12');
  });

  it('should return exactly 6 movie IDs', async () => {
    // Mock response with more than 6 IDs
    const mockGenerateContent = jest.fn().mockResolvedValue({
      response: {
        text: () => '[1, 2, 3, 4, 5, 6, 7, 8]'
      }
    });

    GoogleGenerativeAI.mockImplementation(() => ({
      getGenerativeModel: jest.fn().mockReturnValue({
        generateContent: mockGenerateContent
      })
    }));

    const result = await generateRecommendationIds(preferredGenreNames, movieList);

    expect(result).toHaveLength(6);
    expect(result).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('should handle fewer than 6 IDs by adding popular movies', async () => {
    // Mock response with fewer than 6 IDs
    const mockGenerateContent = jest.fn().mockResolvedValue({
      response: {
        text: () => '[1, 2, 3]'
      }
    });

    GoogleGenerativeAI.mockImplementation(() => ({
      getGenerativeModel: jest.fn().mockReturnValue({
        generateContent: mockGenerateContent
      })
    }));

    const result = await generateRecommendationIds(preferredGenreNames, movieList);

    expect(result).toHaveLength(6);
    // Should include the 3 from AI and 3 more from movieList
    expect(result).toContain(1);
    expect(result).toContain(2);
    expect(result).toContain(3);
  });

  it('should handle malformed JSON response', async () => {
    // Mock response with malformed JSON
    const mockGenerateContent = jest.fn().mockResolvedValue({
      response: {
        text: () => 'Here are your recommendations: [1, 2, 3, 4, 5, 6]'
      }
    });

    GoogleGenerativeAI.mockImplementation(() => ({
      getGenerativeModel: jest.fn().mockReturnValue({
        generateContent: mockGenerateContent
      })
    }));

    const result = await generateRecommendationIds(preferredGenreNames, movieList);

    expect(result).toHaveLength(6);
    expect(result).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('should handle completely invalid response format', async () => {
    // Mock response with text that has no array
    const mockGenerateContent = jest.fn().mockResolvedValue({
      response: {
        text: () => 'I recommend movies with IDs 1, 2, 3, 4, 5, and 6'
      }
    });

    GoogleGenerativeAI.mockImplementation(() => ({
      getGenerativeModel: jest.fn().mockReturnValue({
        generateContent: mockGenerateContent
      })
    }));

    const result = await generateRecommendationIds(preferredGenreNames, movieList);

    expect(result).toHaveLength(6);
    // Should still extract the IDs from text
    expect(result).toContain(1);
    expect(result).toContain(6);
  });

  it('should handle Gemini API error with fallback to movieList', async () => {
    // Mock API error
    const mockGenerateContent = jest.fn().mockRejectedValue(
      new Error('Gemini API error')
    );

    GoogleGenerativeAI.mockImplementation(() => ({
      getGenerativeModel: jest.fn().mockReturnValue({
        generateContent: mockGenerateContent
      })
    }));

    const result = await generateRecommendationIds(preferredGenreNames, movieList);

    expect(result).toHaveLength(6);
    // Should fallback to first 6 movies from movieList
    expect(result).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('should handle missing API key', async () => {
    // Remove API key from environment
    delete process.env.GEMINI_API_KEY;

    const result = await generateRecommendationIds(preferredGenreNames, movieList);

    expect(result).toHaveLength(6);
    // Should fallback to first 6 movies from movieList
    expect(result).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('should filter out non-numeric IDs from response', async () => {
    // Mock response with non-numeric values
    const mockGenerateContent = jest.fn().mockResolvedValue({
      response: {
        text: () => '[1, "two", 3, null, 5, 6]'
      }
    });

    GoogleGenerativeAI.mockImplementation(() => ({
      getGenerativeModel: jest.fn().mockReturnValue({
        generateContent: mockGenerateContent
      })
    }));

    const result = await generateRecommendationIds(preferredGenreNames, movieList);

    // Should only include numeric IDs and fill in missing ones
    expect(result).toHaveLength(6);
    expect(result).toContain(1);
    expect(result).toContain(3);
    expect(result).toContain(5);
    expect(result).toContain(6);
    expect(result).not.toContain("two");
    expect(result).not.toContain(null);
  });

  it('should handle empty movie list', async () => {
    const mockGenerateContent = jest.fn().mockResolvedValue({
      response: {
        text: () => '[1, 2, 3, 4, 5, 6]'
      }
    });

    GoogleGenerativeAI.mockImplementation(() => ({
      getGenerativeModel: jest.fn().mockReturnValue({
        generateContent: mockGenerateContent
      })
    }));

    const result = await generateRecommendationIds(preferredGenreNames, []);

    expect(result).toHaveLength(0);
  });

  it('should handle empty genre preferences', async () => {
    const mockGenerateContent = jest.fn().mockResolvedValue({
      response: {
        text: () => '[1, 2, 3, 4, 5, 6]'
      }
    });

    GoogleGenerativeAI.mockImplementation(() => ({
      getGenerativeModel: jest.fn().mockReturnValue({
        generateContent: mockGenerateContent
      })
    }));

    const result = await generateRecommendationIds([], movieList);

    expect(result).toHaveLength(6);
  });

  it('should handle null response from Gemini', async () => {
    const mockGenerateContent = jest.fn().mockResolvedValue({
      response: {
        text: () => null
      }
    });

    GoogleGenerativeAI.mockImplementation(() => ({
      getGenerativeModel: jest.fn().mockReturnValue({
        generateContent: mockGenerateContent
      })
    }));

    const result = await generateRecommendationIds(preferredGenreNames, movieList);

    expect(result).toHaveLength(6);
    // Should fall back to first 6 movies
    expect(result).toEqual([1, 2, 3, 4, 5, 6]);
  });
});
