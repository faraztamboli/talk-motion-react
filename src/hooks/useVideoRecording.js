import { useState, useEffect } from "react";
import JS2Py from "../remotepyjs";
import useLocalStorage from "./useLocalStorage";

function useVideoRecording(recordingId) {
  const [token] = useLocalStorage("token");
  const [recording, setRecording] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!recordingId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      JS2Py.PythonFunctions.TalkMotionServer.getVideoRecording(
        token,
        parseInt(recordingId),
        true, // withShots = true to get all shots
        function (result) {
          if (result) {
            // Process shots and sort by original_video_start
            // Filter: include shots that have video_url (status field may not be present in response)
            const shots = (result.recording_shots || [])
              .filter(shot => {
                // Include shots that have a video_url
                // If status exists, it should be 'complete', otherwise just check for video_url
                const hasVideoUrl = shot.video_url && shot.video_url.trim() !== '';
                if (shot.status !== undefined) {
                  return hasVideoUrl && shot.status === 'complete';
                }
                // If status is not provided, assume complete if video_url exists
                return hasVideoUrl;
              })
              .map(shot => ({
                id: shot.id,
                videoUrl: shot.video_url,
                startTime: shot.original_video_start || 0,
                endTime: shot.original_video_end || 0,
                duration: (shot.original_video_end || 0) - (shot.original_video_start || 0),
              }))
              .sort((a, b) => {
                // Sort by startTime first, then by ID (descending) to prioritize latest shots
                if (a.startTime !== b.startTime) {
                  return a.startTime - b.startTime;
                }
                // If same startTime, higher ID = newer shot, so sort descending
                return b.id - a.id;
              });
            
            console.log("Processed shots:", shots.length, "from", result.recording_shots?.length || 0, "raw shots");
            console.log("Raw shots data:", result.recording_shots);

            setRecording({
              id: result.id,
              title: result.title,
              description: result.description,
              youtubeURL: result.original_video_url,
              youtubeVideoId: extractYouTubeVideoId(result.original_video_url),
              shots: shots,
            });
          } else {
            setError("No recording data found");
          }
          setLoading(false);
        }
      );
    } catch (err) {
      console.error("Error fetching video recording:", err);
      setError(err.message || "Failed to fetch video recording");
      setLoading(false);
    }
  }, [recordingId, token]);

  function extractYouTubeVideoId(url) {
    if (!url) return null;
    
    // Handle full YouTube URLs
    const watchMatch = url.match(/(?:youtube\.com\/watch\?v=)([^&\n?#]+)/);
    if (watchMatch) return watchMatch[1];
    
    // Handle youtu.be short URLs
    const shortMatch = url.match(/(?:youtu\.be\/)([^&\n?#]+)/);
    if (shortMatch) return shortMatch[1];
    
    // Handle embed URLs
    const embedMatch = url.match(/(?:youtube\.com\/embed\/)([^&\n?#]+)/);
    if (embedMatch) return embedMatch[1];
    
    // Handle if it's already just a video ID (11 characters)
    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
      return url;
    }
    
    return null;
  }

  return { recording, loading, error };
}

export default useVideoRecording;

