# YouTube Search Feature Setup Guide

## Overview

The Video Subtitle Designer now supports searching YouTube videos directly from the application, in addition to the existing URL paste functionality.

## Features

- **Search YouTube Videos**: Search for videos by title, keywords, or channel name
- **Video Preview**: See thumbnails, titles, descriptions, and channel information
- **Auto-fill**: Selected videos automatically populate the title and description fields
- **Pagination**: Load more results if available
- **Fallback**: If API key is not configured, users can still use the "Paste URL" tab

## Setup Instructions

### Step 1: Get YouTube Data API v3 Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **YouTube Data API v3**:
   - Navigate to "APIs & Services" > "Library"
   - Search for "YouTube Data API v3"
   - Click "Enable"

4. Create API Credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy your API key

5. (Optional but Recommended) Restrict the API Key:
   - Click on your newly created API key
   - Under "API restrictions", select "Restrict key"
   - Choose "YouTube Data API v3"
   - Under "Application restrictions", you can restrict by HTTP referrer (for web apps)

### Step 2: Configure Environment Variable

1. Create a `.env` file in the root of your project (if it doesn't exist)
2. Add your YouTube API key:

```env
VITE_YOUTUBE_API_KEY=your_api_key_here
```

**Important Notes:**
- In Vite, environment variables must be prefixed with `VITE_` to be accessible in the browser
- Never commit your `.env` file to version control
- Add `.env` to your `.gitignore` file

### Step 3: Restart Development Server

After adding the environment variable, restart your Vite development server:

```bash
npm run dev
```

## Usage

1. Navigate to the Video Subtitle Designer page
2. You'll see two tabs:
   - **Paste URL**: The original functionality to paste YouTube URLs
   - **Search YouTube**: New search functionality
3. In the "Search YouTube" tab:
   - Type your search query
   - Click the search icon or press Enter
   - Browse results with thumbnails and descriptions
   - Click on a video to select it
   - The video URL, title, and description will be automatically filled

## API Quotas and Limits

YouTube Data API v3 has the following default quotas:
- **Queries per day**: 10,000 units (free tier)
- **Queries per 100 seconds per user**: 300 units

Each search request costs 100 units, so you can make approximately 100 searches per day on the free tier.

To increase quotas:
1. Go to Google Cloud Console
2. Navigate to "APIs & Services" > "Dashboard"
3. Select "YouTube Data API v3"
4. Click "Quotas" to view and request increases

## Troubleshooting

### Search Not Working

1. **Check API Key**: Ensure `VITE_YOUTUBE_API_KEY` is set in your `.env` file
2. **Restart Server**: Restart your development server after adding the environment variable
3. **Check Console**: Open browser developer tools and check for error messages
4. **Verify API Key**: Test your API key directly:
   ```bash
   curl "https://www.googleapis.com/youtube/v3/search?part=snippet&q=test&key=YOUR_API_KEY"
   ```

### API Key Errors

- **403 Forbidden**: API key might be restricted or invalid
- **400 Bad Request**: Check that the API key format is correct
- **Quota Exceeded**: You've reached your daily quota limit

### Build Issues

If the environment variable doesn't work in production:
- Ensure the variable is set in your deployment environment (e.g., Vercel, Netlify, etc.)
- For Vite, the variable must be available at build time

## Security Best Practices

1. **Never expose API keys in client-side code** (except for public API keys with restrictions)
2. **Use API key restrictions** in Google Cloud Console
3. **Monitor usage** regularly in Google Cloud Console
4. **Consider using a backend proxy** for production to hide the API key from the client

## Alternative: Backend Proxy (Recommended for Production)

For better security, you can create a backend endpoint that proxies YouTube API requests:

```javascript
// Backend endpoint example (Node.js/Express)
app.get('/api/youtube/search', async (req, res) => {
  const { q } = req.query;
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${q}&key=${process.env.YOUTUBE_API_KEY}`
  );
  const data = await response.json();
  res.json(data);
});
```

Then update `useYouTubeSearch.js` to call your backend endpoint instead of the YouTube API directly.

## Support

For issues or questions:
- Check [YouTube Data API Documentation](https://developers.google.com/youtube/v3)
- Review [API Quotas and Limits](https://developers.google.com/youtube/v3/getting-started#quota)


