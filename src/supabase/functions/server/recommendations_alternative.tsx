// Alternative recommendations implementation since Spotify's /recommendations API is not accessible
// This uses working endpoints: related artists, artist albums, and search

export async function getAlternativeRecommendations(
  access_token: string,
  genre: string | undefined,
  limit: number
) {
  console.log(`Getting alternative recommendations for genre: ${genre || 'all'}`);
  
  // 1. Get user's top artists
  const topArtistsRes = await fetch(
    'https://api.spotify.com/v1/me/top/artists?limit=10&time_range=medium_term',
    { headers: { 'Authorization': `Bearer ${access_token}` } }
  );
  
  if (!topArtistsRes.ok) {
    throw new Error('Failed to fetch top artists');
  }
  
  const topArtists = await topArtistsRes.json();
  let artists = topArtists.items || [];
  
  // Filter by genre if specified
  if (genre) {
    const genreFiltered = artists.filter((artist: any) =>
      artist.genres?.some((g: string) => g.toLowerCase().includes(genre.toLowerCase()))
    );
    
    if (genreFiltered.length > 0) {
      artists = genreFiltered;
    }
    
    console.log(`Filtered to ${artists.length} artists matching genre "${genre}"`);
  }
  
  if (artists.length === 0) {
    return { tracks: [] };
  }
  
  // 2. Get a mix of:
  //    - Related artists' top tracks
  //    - New albums from favorite artists
  const recommendations: any[] = [];
  
  // Strategy 1: Get related artists and their top tracks
  const primaryArtist = artists[0];
  console.log(`Getting related artists for: ${primaryArtist.name}`);
  
  const relatedRes = await fetch(
    `https://api.spotify.com/v1/artists/${primaryArtist.id}/related-artists`,
    { headers: { 'Authorization': `Bearer ${access_token}` } }
  );
  
  if (relatedRes.ok) {
    const relatedData = await relatedRes.json();
    const relatedArtists = relatedData.artists?.slice(0, 5) || [];
    
    console.log(`Found ${relatedArtists.length} related artists`);
    
    // Get top tracks from related artists
    for (const artist of relatedArtists) {
      const topTracksRes = await fetch(
        `https://api.spotify.com/v1/artists/${artist.id}/top-tracks?market=US`,
        { headers: { 'Authorization': `Bearer ${access_token}` } }
      );
      
      if (topTracksRes.ok) {
        const topTracksData = await topTracksRes.json();
        const tracks = topTracksData.tracks?.slice(0, 2) || [];
        recommendations.push(...tracks);
      }
      
      if (recommendations.length >= limit) break;
    }
  }
  
  // Strategy 2: Get new albums/singles from favorite artists
  if (recommendations.length < limit) {
    console.log(`Getting new releases from favorite artists...`);
    
    for (const artist of artists.slice(0, 3)) {
      const albumsRes = await fetch(
        `https://api.spotify.com/v1/artists/${artist.id}/albums?include_groups=album,single&limit=3`,
        { headers: { 'Authorization': `Bearer ${access_token}` } }
      );
      
      if (albumsRes.ok) {
        const albumsData = await albumsRes.json();
        const albums = albumsData.items || [];
        
        // Get tracks from these albums
        for (const album of albums) {
          const albumTracksRes = await fetch(
            `https://api.spotify.com/v1/albums/${album.id}/tracks?limit=2`,
            { headers: { 'Authorization': `Bearer ${access_token}` } }
          );
          
          if (albumTracksRes.ok) {
            const tracksData = await albumTracksRes.json();
            // Need to enrich tracks with album info
            const enrichedTracks = tracksData.items?.map((track: any) => ({
              ...track,
              album: {
                id: album.id,
                name: album.name,
                images: album.images,
                release_date: album.release_date
              }
            })) || [];
            recommendations.push(...enrichedTracks);
          }
          
          if (recommendations.length >= limit) break;
        }
      }
      
      if (recommendations.length >= limit) break;
    }
  }
  
  // Deduplicate and limit results
  const uniqueTracks = Array.from(
    new Map(recommendations.map(track => [track.id, track])).values()
  ).slice(0, limit);
  
  console.log(`Returning ${uniqueTracks.length} recommendation tracks`);
  
  return { tracks: uniqueTracks };
}
