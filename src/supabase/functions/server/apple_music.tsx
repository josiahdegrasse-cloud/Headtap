/**
 * Apple Music / iTunes API Integration
 * Uses the free iTunes Search API for artist enrichment (no authentication required)
 */

export interface AppleMusicArtist {
  artistId: number;
  artistName: string;
  primaryGenreName: string;
  artistLinkUrl: string;
  artistArtwork?: string;
  amgArtistId?: number;
}

export interface AppleMusicAlbum {
  collectionId: number;
  collectionName: string;
  artworkUrl100: string;
  artworkUrl600: string; // High-res artwork
  releaseDate: string;
  trackCount: number;
  primaryGenreName: string;
}

export interface AppleMusicEnrichment {
  appleMusicId?: number;
  appleMusicUrl?: string;
  appleMusicArtwork?: string; // High-res artwork
  genres?: string[];
  topAlbums?: AppleMusicAlbum[];
  amgArtistId?: number;
}

/**
 * Search for an artist on Apple Music/iTunes
 */
export async function searchAppleMusicArtist(artistName: string): Promise<AppleMusicEnrichment | null> {
  try {
    // Search iTunes API for the artist
    const searchUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(artistName)}&entity=musicArtist&limit=1`;
    
    const response = await fetch(searchUrl);
    
    if (!response.ok) {
      console.log(`Apple Music search failed for "${artistName}": ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      console.log(`No Apple Music results for "${artistName}"`);
      return null;
    }
    
    const artist = data.results[0];
    
    // Fetch top albums for this artist
    const albumsUrl = `https://itunes.apple.com/lookup?id=${artist.artistId}&entity=album&limit=10&sort=recent`;
    const albumsResponse = await fetch(albumsUrl);
    
    let topAlbums: AppleMusicAlbum[] = [];
    
    if (albumsResponse.ok) {
      const albumsData = await albumsResponse.json();
      // First result is the artist info, rest are albums
      topAlbums = albumsData.results
        .slice(1) // Skip first result (artist)
        .filter((item: any) => item.wrapperType === 'collection')
        .map((album: any) => ({
          collectionId: album.collectionId,
          collectionName: album.collectionName,
          artworkUrl100: album.artworkUrl100,
          artworkUrl600: album.artworkUrl100.replace('100x100', '600x600'), // Get high-res
          releaseDate: album.releaseDate,
          trackCount: album.trackCount,
          primaryGenreName: album.primaryGenreName
        }));
    }
    
    return {
      appleMusicId: artist.artistId,
      appleMusicUrl: artist.artistLinkUrl,
      appleMusicArtwork: artist.artistLinkUrl ? await getArtistArtwork(artist.artistId) : undefined,
      genres: artist.primaryGenreName ? [artist.primaryGenreName] : [],
      topAlbums,
      amgArtistId: artist.amgArtistId
    };
  } catch (error) {
    console.log(`Error searching Apple Music for "${artistName}": ${error}`);
    return null;
  }
}

/**
 * Get high-resolution artist artwork from their top album
 */
async function getArtistArtwork(artistId: number): Promise<string | undefined> {
  try {
    const url = `https://itunes.apple.com/lookup?id=${artistId}&entity=album&limit=1`;
    const response = await fetch(url);
    
    if (!response.ok) return undefined;
    
    const data = await response.json();
    
    // Get artwork from first album
    const album = data.results?.find((item: any) => item.wrapperType === 'collection');
    
    if (album?.artworkUrl100) {
      // Convert to high-res (600x600)
      return album.artworkUrl100.replace('100x100', '600x600');
    }
    
    return undefined;
  } catch (error) {
    console.log(`Error getting artist artwork: ${error}`);
    return undefined;
  }
}

/**
 * Batch enrich multiple artists with Apple Music data
 */
export async function enrichArtistsWithAppleMusic(
  artistNames: string[],
  cache: Map<string, AppleMusicEnrichment>
): Promise<Map<string, AppleMusicEnrichment>> {
  const results = new Map<string, AppleMusicEnrichment>();
  
  // Process in batches to avoid rate limits
  const batchSize = 5;
  
  for (let i = 0; i < artistNames.length; i += batchSize) {
    const batch = artistNames.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async (artistName) => {
      const cacheKey = artistName.toLowerCase();
      
      // Check cache first
      if (cache.has(cacheKey)) {
        return { artistName, data: cache.get(cacheKey)! };
      }
      
      // Search Apple Music
      const enrichment = await searchAppleMusicArtist(artistName);
      
      if (enrichment) {
        cache.set(cacheKey, enrichment);
        return { artistName, data: enrichment };
      }
      
      return { artistName, data: null };
    });
    
    const batchResults = await Promise.all(batchPromises);
    
    for (const result of batchResults) {
      if (result.data) {
        results.set(result.artistName, result.data);
      }
    }
    
    // Small delay between batches to be respectful to Apple's servers
    if (i + batchSize < artistNames.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return results;
}

/**
 * Get Apple Music preview/sample URL for a track
 */
export async function getAppleMusicTrackPreview(trackName: string, artistName: string): Promise<string | null> {
  try {
    const searchTerm = `${trackName} ${artistName}`;
    const searchUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(searchTerm)}&entity=song&limit=1`;
    
    const response = await fetch(searchUrl);
    
    if (!response.ok) return null;
    
    const data = await response.json();
    
    if (!data.results || data.results.length === 0) return null;
    
    // Return preview URL (30-second sample)
    return data.results[0].previewUrl || null;
  } catch (error) {
    console.log(`Error getting Apple Music preview: ${error}`);
    return null;
  }
}
