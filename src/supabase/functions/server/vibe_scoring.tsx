// Vibe Scoring System - Ported from Python backend

interface AudioProfile {
  energy?: number;
  danceability?: number;
  valence?: number;
  acousticness?: number;
  instrumentalness?: number;
}

interface UserVibe {
  genres: Record<string, number>;
  avg_popularity: number;
  audio_avg: AudioProfile;
  top_artists_lower: string[];
}

interface EventData {
  artist: string;
  genres: string[];
  popularity: number;
  audio_profile: AudioProfile;
  vibe_score?: number;
}

const GENRE_KEYWORDS: Record<string, string[]> = {
  "rock": ["rock", "grunge", "punk", "metal", "hard rock"],
  "alternative": ["alternative", "post-punk", "shoegaze", "indie rock"],
  "indie": ["indie", "indie pop", "indie folk", "bedroom pop"],
  "pop": ["pop", "dance pop", "synthpop", "k-pop", "electropop"],
  "hip hop": ["hip hop", "rap", "trap", "gangsta rap", "drill"],
  "r&b": ["r&b", "soul", "neo-soul", "contemporary r&b"],
  "electronic": ["edm", "electronic", "house", "techno", "dubstep", "trance"],
  "jazz": ["jazz", "swing", "bebop", "fusion"],
  "country": ["country", "folk", "bluegrass", "americana"],
  "latin": ["latin", "reggaeton", "salsa", "bossa nova", "bachata"],
  "classical": ["classical", "baroque", "symphony", "opera"],
  "blues": ["blues", "delta blues", "electric blues"]
};

/**
 * Assign normalized genres from raw Spotify genres
 */
export function assignGenre(rawGenres: string[]): string[] {
  if (!rawGenres || rawGenres.length === 0) {
    return ["alternative"];
  }

  const processed = rawGenres.map(g => g.toLowerCase().trim());
  const genreScores: Record<string, number> = {};

  for (const genreName in GENRE_KEYWORDS) {
    genreScores[genreName] = 0;
  }

  for (const g of processed) {
    for (const [genreName, keywords] of Object.entries(GENRE_KEYWORDS)) {
      for (const kw of keywords) {
        if (g.includes(kw)) {
          genreScores[genreName] += 1;
        }
      }
    }
  }

  const ranked = Object.entries(genreScores)
    .filter(([_, score]) => score > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([genre, _]) => genre);

  return ranked.length > 0 ? ranked.slice(0, 3) : ["alternative"];
}

/**
 * Build user vibe profile from top artists
 */
export function buildUserVibe(
  topArtists: string[],
  details: Record<string, { genres: string[]; popularity: number; audio_features?: AudioProfile }>
): UserVibe {
  const genreCounts: Record<string, number> = {};
  let totalPopularity = 0;
  let count = 0;

  const audioSums = {
    energy: 0,
    danceability: 0,
    valence: 0,
    acousticness: 0,
    instrumentalness: 0
  };
  let audioCount = 0;

  for (const artist of topArtists) {
    const artistData = details[artist];
    if (!artistData) continue;

    // Count genres
    for (const genre of artistData.genres || []) {
      genreCounts[genre] = (genreCounts[genre] || 0) + 1;
    }

    // Sum popularity
    totalPopularity += artistData.popularity || 0;
    count++;

    // Sum audio features
    const audio = artistData.audio_features;
    if (audio) {
      if (audio.energy !== undefined) audioSums.energy += audio.energy;
      if (audio.danceability !== undefined) audioSums.danceability += audio.danceability;
      if (audio.valence !== undefined) audioSums.valence += audio.valence;
      if (audio.acousticness !== undefined) audioSums.acousticness += audio.acousticness;
      if (audio.instrumentalness !== undefined) audioSums.instrumentalness += audio.instrumentalness;
      audioCount++;
    }
  }

  // Calculate averages
  const avgPopularity = count > 0 ? totalPopularity / count : 50;
  const audioAvg: AudioProfile = audioCount > 0 ? {
    energy: audioSums.energy / audioCount,
    danceability: audioSums.danceability / audioCount,
    valence: audioSums.valence / audioCount,
    acousticness: audioSums.acousticness / audioCount,
    instrumentalness: audioSums.instrumentalness / audioCount
  } : {};

  return {
    genres: genreCounts,
    avg_popularity: avgPopularity,
    audio_avg: audioAvg,
    top_artists_lower: topArtists.map(a => a.toLowerCase())
  };
}

/**
 * Helper function to get genre family for better matching
 */
function getGenreFamily(genre: string): string | null {
  for (const [family, keywords] of Object.entries(GENRE_KEYWORDS)) {
    for (const keyword of keywords) {
      if (genre.includes(keyword)) {
        return family;
      }
    }
  }
  return null;
}

/**
 * Calculate vibe score for an event
 * PERCENTAGE-BASED SYSTEM: 0-100% match score (MORE GENEROUS)
 * - Known Artist: 25% max (increased from 20%)
 * - Genre Match: 30% max (increased from 25%)
 * - Audio Features: 20% max (increased from 15%)
 * - Popularity: 35% max (MAJOR FACTOR - prioritizes popular artists)
 * - Discovery Boost: Up to +20% for new similar artists (increased from +15%)
 * - Base Score Boost: +15 to all events to make scoring more favorable
 */
export function calculateVibeScore(
  event: EventData,
  userVibe: UserVibe,
  recentArtistsList: string[] = []
): number {
  let score = 15; // Start with a 15-point base boost!

  const recentLower = recentArtistsList.map(a => a.toLowerCase());
  const artistLower = event.artist.toLowerCase();
  
  // 1. Known Artist Score (25% max - INCREASED)
  let knownArtistScore = 0;
  if (recentLower.includes(artistLower)) {
    const artistIndex = recentLower.indexOf(artistLower);
    if (artistIndex < 5) {
      knownArtistScore = 25; // Top 5 (increased from 20)
    } else if (artistIndex < 10) {
      knownArtistScore = 23; // Top 10 (increased from 18)
    } else if (artistIndex < 20) {
      knownArtistScore = 21; // Top 20 (increased from 16)
    } else if (artistIndex < 50) {
      knownArtistScore = 18; // Top 50 (increased from 14)
    } else {
      knownArtistScore = 15; // Top 100 (increased from 12)
    }
  } else if (userVibe.top_artists_lower.includes(artistLower)) {
    knownArtistScore = 12; // Known but not recent (increased from 10)
  }
  score += knownArtistScore;

  // 2. GENRE MATCH (30% max - INCREASED)
  const eventGenres = event.genres || [];
  let genreScore = 0;
  let genreMatches = 0;
  
  for (const genre of eventGenres) {
    const genreLower = genre.toLowerCase();
    
    if (userVibe.genres[genreLower]) {
      const userGenreCount = userVibe.genres[genreLower];
      // Direct match is worth more (increased multipliers)
      genreScore += Math.min(userGenreCount * 3.5, 15);
      genreMatches++;
    } else {
      for (const userGenre in userVibe.genres) {
        const userGenreLower = userGenre.toLowerCase();
        const userGenreCount = userVibe.genres[userGenre];
        
        if (genreLower.includes(userGenreLower) || userGenreLower.includes(genreLower)) {
          genreScore += Math.min(userGenreCount * 2.5, 10);
          genreMatches++;
          break;
        }
        
        const genreFamily = getGenreFamily(genreLower);
        const userGenreFamily = getGenreFamily(userGenreLower);
        if (genreFamily && genreFamily === userGenreFamily) {
          genreScore += Math.min(userGenreCount * 1.5, 7);
          genreMatches++;
          break;
        }
      }
    }
  }
  
  // Bonus for multiple genre matches (increased)
  if (genreMatches >= 3) {
    genreScore += 8;
  } else if (genreMatches >= 2) {
    genreScore += 5;
  }
  
  score += Math.min(genreScore, 30);

  // 3. AUDIO FEATURE SIMILARITY (20% max - INCREASED)
  let audioScore = 0;
  if (event.audio_profile && Object.keys(userVibe.audio_avg).length > 0) {
    const features: (keyof AudioProfile)[] = ['energy', 'danceability', 'valence', 'acousticness', 'instrumentalness'];
    
    const featureWeights = {
      energy: 1.2,
      danceability: 1.0,
      valence: 0.8,
      acousticness: 1.1,
      instrumentalness: 0.9
    };
    
    let featureSum = 0;
    let featureCount = 0;
    
    for (const feature of features) {
      const userVal = userVibe.audio_avg[feature];
      const eventVal = event.audio_profile[feature];
      
      if (userVal !== undefined && eventVal !== undefined) {
        const diff = Math.abs(userVal - eventVal);
        const similarity = 1 - diff; // 0 to 1
        const weight = featureWeights[feature] || 1;
        featureSum += similarity * weight;
        featureCount++;
      }
    }

    if (featureCount > 0) {
      const avgSimilarity = featureSum / featureCount;
      audioScore = avgSimilarity * 20; // Scale to 20% max (increased from 15)
    }
  }
  score += audioScore;

  // 4. POPULARITY SCORE (35% max - MAJOR FACTOR)
  // This heavily weights popular artists
  let popularityScore = 0;
  
  // Artist's raw popularity (0-100 from Spotify)
  const artistPopularity = event.popularity || 0;
  
  // Base popularity score - higher popularity = higher score
  // Popular artists (70-100) get 25-35 points
  // Mid-tier artists (40-70) get 15-25 points
  // Niche artists (0-40) get 0-15 points
  const popularityBase = (artistPopularity / 100) * 28; // Up to 28 points
  popularityScore += popularityBase;
  
  // Bonus for matching user's popularity preference
  const popularityDiff = Math.abs(artistPopularity - userVibe.avg_popularity);
  const popularityMatchBonus = Math.max(0, 7 - (popularityDiff / 15)); // Up to 7 bonus points
  popularityScore += popularityMatchBonus;
  
  score += Math.min(popularityScore, 35);

  // 5. DISCOVERY BOOST (up to +20% for new artists - INCREASED)
  const isNewArtist = !recentLower.includes(artistLower) && !userVibe.top_artists_lower.includes(artistLower);
  if (isNewArtist && score > 35) {
    // High scoring new artist gets discovery boost
    const baseScore = score;
    
    // The better the match, the bigger the boost
    if (baseScore >= 50) {
      score += 20; // Excellent new match (increased from 15)
    } else if (baseScore >= 40) {
      score += 15; // Great new match (increased from 10)
    } else if (baseScore >= 35) {
      score += 8; // Good new match (increased from 5)
    }
  }

  return Math.min(score, 100); // Cap at 100%
}

/**
 * Calculate vibe score and generate match reasons
 * PERCENTAGE-BASED SYSTEM: 0-100% match score (MORE GENEROUS VERSION)
 */
export function calculateVibeScoreWithReasons(
  event: EventData,
  userVibe: UserVibe,
  recentArtistsList: string[] = []
): { score: number; reasons: string[] } {
  let score = 15; // Start with 15-point base boost!
  const reasons: string[] = [];
  
  const recentLower = recentArtistsList.map(a => a.toLowerCase());
  const artistLower = event.artist.toLowerCase();

  // 1. Known Artist Score (25% max - INCREASED)
  let knownArtistScore = 0;
  if (recentLower.includes(artistLower)) {
    const artistIndex = recentLower.indexOf(artistLower);
    
    if (artistIndex < 5) {
      knownArtistScore = 25;
      reasons.push(`🎵 ${event.artist} is in your top ${artistIndex + 1} artists!`);
    } else if (artistIndex < 10) {
      knownArtistScore = 23;
      reasons.push(`🎵 ${event.artist} is in your top 10 artists`);
    } else if (artistIndex < 20) {
      knownArtistScore = 21;
      reasons.push(`🎵 You listen to ${event.artist} frequently`);
    } else if (artistIndex < 50) {
      knownArtistScore = 18;
      reasons.push(`🎵 ${event.artist} is one of your top artists`);
    } else {
      knownArtistScore = 15;
      reasons.push(`🎵 You listen to ${event.artist}`);
    }
  } else if (userVibe.top_artists_lower.includes(artistLower)) {
    knownArtistScore = 12;
    reasons.push(`🎵 ${event.artist} is in your listening rotation`);
  }
  score += knownArtistScore;

  // 2. GENRE MATCH (30% max - INCREASED)
  const eventGenres = event.genres || [];
  let genreScore = 0;
  let genreMatches = 0;
  const matchedGenres: string[] = [];
  
  for (const genre of eventGenres) {
    const genreLower = genre.toLowerCase();
    
    if (userVibe.genres[genreLower]) {
      const userGenreCount = userVibe.genres[genreLower];
      genreScore += Math.min(userGenreCount * 3.5, 15);
      genreMatches++;
      if (!matchedGenres.includes(genre)) {
        matchedGenres.push(genre);
      }
    } else {
      for (const userGenre in userVibe.genres) {
        const userGenreLower = userGenre.toLowerCase();
        const userGenreCount = userVibe.genres[userGenre];
        
        if (genreLower.includes(userGenreLower) || userGenreLower.includes(genreLower)) {
          genreScore += Math.min(userGenreCount * 2.5, 10);
          genreMatches++;
          if (!matchedGenres.includes(genre)) {
            matchedGenres.push(genre);
          }
          break;
        }
        
        const genreFamily = getGenreFamily(genreLower);
        const userGenreFamily = getGenreFamily(userGenreLower);
        if (genreFamily && genreFamily === userGenreFamily) {
          genreScore += Math.min(userGenreCount * 1.5, 7);
          genreMatches++;
          if (!matchedGenres.includes(genre)) {
            matchedGenres.push(genre);
          }
          break;
        }
      }
    }
  }
  
  // Bonus for multiple genre matches (increased)
  if (genreMatches >= 3) {
    genreScore += 8;
  } else if (genreMatches >= 2) {
    genreScore += 5;
  }
  
  const finalGenreScore = Math.min(genreScore, 30);
  score += finalGenreScore;
  
  if (matchedGenres.length > 0) {
    if (matchedGenres.length === 1) {
      reasons.push(`🎸 Perfect match for your ${matchedGenres[0]} taste`);
    } else if (matchedGenres.length === 2) {
      reasons.push(`🎸 Matches your ${matchedGenres[0]} & ${matchedGenres[1]} vibe`);
    } else {
      reasons.push(`🎸 Multi-genre match: ${matchedGenres.slice(0, 2).join(', ')} & more`);
    }
  }

  // 3. AUDIO FEATURE SIMILARITY (20% max - INCREASED)
  let audioScore = 0;
  if (event.audio_profile && Object.keys(userVibe.audio_avg).length > 0) {
    const features: (keyof AudioProfile)[] = ['energy', 'danceability', 'valence', 'acousticness', 'instrumentalness'];
    
    const featureWeights = {
      energy: 1.2,
      danceability: 1.0,
      valence: 0.8,
      acousticness: 1.1,
      instrumentalness: 0.9
    };
    
    let featureSum = 0;
    let featureCount = 0;
    
    for (const feature of features) {
      const userVal = userVibe.audio_avg[feature];
      const eventVal = event.audio_profile[feature];
      
      if (userVal !== undefined && eventVal !== undefined) {
        const diff = Math.abs(userVal - eventVal);
        const similarity = 1 - diff;
        const weight = featureWeights[feature] || 1;
        featureSum += similarity * weight;
        featureCount++;
      }
    }

    if (featureCount > 0) {
      const avgSimilarity = featureSum / featureCount;
      audioScore = avgSimilarity * 20; // Increased from 15
      score += audioScore;
      
      if (audioScore > 13) {
        reasons.push('🎧 Similar sound profile to your favorites');
      }
    }
  }

  // 4. POPULARITY SCORE (35% max - MAJOR FACTOR)
  let popularityScore = 0;
  const artistPopularity = event.popularity || 0;
  
  // Base popularity score
  const popularityBase = (artistPopularity / 100) * 28;
  popularityScore += popularityBase;
  
  // Bonus for matching user's popularity preference
  const popularityDiff = Math.abs(artistPopularity - userVibe.avg_popularity);
  const popularityMatchBonus = Math.max(0, 7 - (popularityDiff / 15));
  popularityScore += popularityMatchBonus;
  
  score += Math.min(popularityScore, 35);
  
  // Add popularity reasons
  if (artistPopularity > 80) {
    reasons.push('⭐⭐ Major superstar - extremely popular artist');
  } else if (artistPopularity > 70) {
    reasons.push('⭐ Popular artist with widespread appeal');
  } else if (artistPopularity > 50) {
    reasons.push('🎯 Well-known artist in the scene');
  } else if (artistPopularity > 30) {
    reasons.push('💎 Rising talent - growing fanbase');
  } else {
    reasons.push('🔍 Underground artist - hidden gem');
  }

  // 5. DISCOVERY BOOST (up to +20% - INCREASED)
  const isNewArtist = !recentLower.includes(artistLower) && !userVibe.top_artists_lower.includes(artistLower);
  if (isNewArtist && score > 35) {
    const baseScore = score;
    
    if (baseScore >= 50) {
      score += 20; // Increased from 15
      reasons.push('✨ NEW DISCOVERY - Highly recommended for you!');
    } else if (baseScore >= 40) {
      score += 15; // Increased from 10
      reasons.push('🔍 Great new artist match - worth exploring');
    } else if (baseScore >= 35) {
      score += 8; // Increased from 5
      reasons.push('🆕 New artist you might enjoy');
    }
  }

  return { score: Math.min(score, 100), reasons };
}

/**
 * Clean artist name for better Spotify search results
 */
function cleanArtistNameForSearch(artistName: string): string {
  let name = artistName.trim();
  
  // Remove common prefixes
  name = name.replace(/^(presents:?|featuring:?|live:?)\s+/i, '');
  
  // Split by common delimiters and take the first part (usually the headliner)
  name = name.split(/\s+(?:at|@|in)\s+/i)[0];
  name = name.split(/\s+-\s+/)[0];
  name = name.split(/\s+\|\s+/)[0];
  
  // Remove tour/year/event type suffixes
  name = name.replace(/\s+(live|tour|concert|festival|show|presents?|20\d{2}|'2\d).*$/i, '');
  
  // Remove "featuring" and everything after it
  name = name.replace(/\s+(featuring|feat\.?|ft\.?|with|w\/)\s+.*/i, '');
  
  // Remove common event descriptors
  name = name.replace(/\s+(live|tour|concert|festival|show|experience|night|evening|matinee)$/i, '');
  
  // Remove brackets and parentheses content (often contains event type, date, or venue info)
  name = name.replace(/[(\[].*?[)\]]/g, '');
  
  // Remove possessive 's at the end if it seems like an error
  name = name.replace(/'s\s*$/i, '');
  
  // Clean up multiple spaces, dashes, and trim
  name = name.replace(/\s+/g, ' ').replace(/\s*-\s*$/, '').trim();
  
  return name;
}

/**
 * Get Spotify artist data including audio features from top tracks
 */
export async function getSpotifyArtistData(
  artistName: string,
  accessToken: string
): Promise<any | null> {
  try {
    // Clean the artist name before searching
    const cleanedName = cleanArtistNameForSearch(artistName);
    
    const searchUrl = `https://api.spotify.com/v1/search?q=${encodeURIComponent(cleanedName)}&type=artist&limit=5`;
    const searchResponse = await fetch(searchUrl, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(6000)
    });

    if (!searchResponse.ok) {
      console.log(`Spotify search failed for ${artistName}: ${searchResponse.status}`);
      return null;
    }

    const searchData = await searchResponse.json();
    const artists = searchData.artists?.items || [];
    
    if (artists.length === 0) {
      console.log(`No Spotify results for "${cleanedName}"`);
      return null;
    }

    // Find best matching artist (prefer exact matches)
    const originalLower = artistName.toLowerCase().trim();
    const cleanedLower = cleanedName.toLowerCase().trim();
    
    let bestArtist: any = null; // Avoid attaching a different artist’s photo and popularity.
    
    // Look for exact or very close match in top 5 results
    for (const artist of artists) {
      const spotifyNameLower = artist.name.toLowerCase().trim();
      
      // Exact match - perfect!
      if (spotifyNameLower === originalLower || spotifyNameLower === cleanedLower) {
        bestArtist = artist;
        console.log(`✅ Exact match found: "${artist.name}" for "${artistName}"`);
        break;
      }
      
      // Very close match (one is contained in the other)
      if (spotifyNameLower.includes(cleanedLower) || cleanedLower.includes(spotifyNameLower)) {
        if (Math.abs(spotifyNameLower.length - cleanedLower.length) < 5) {
          bestArtist = artist;
          console.log(`✅ Close match found: "${artist.name}" for "${artistName}"`);
          break;
        }
      }
    }
    
    if (!bestArtist) return null;
    const artist = bestArtist;
    console.log(`Using Spotify artist: "${artist.name}" (popularity: ${artist.popularity}) for search: "${artistName}"`);

    // Concert matching uses artist genres/popularity. Avoid two additional
    // requests per artist for optional audio features on the critical path.
    const audioFeatures = {};

    return {
      name: artist.name,
      id: artist.id,
      genres: artist.genres || [],
      popularity: artist.popularity ?? 0,
      audio_features: audioFeatures,
      images: artist.images || []
    };
  } catch (error) {
    console.log(`Error fetching Spotify data for ${artistName}:`, error);
    return null;
  }
}

/**
 * Extract main artist from Ticketmaster event
 * ULTRA-IMPROVED VERSION: Better accuracy for artist name extraction
 */
export function getMainArtistFromTicketmaster(event: any): string {
  const attractions = event._embedded?.attractions || [];
  
  // PRIORITY 1: Use attraction data (MOST RELIABLE - Ticketmaster's structured data)
  if (attractions.length > 0) {
    // Filter out non-music attractions (venues, festivals, etc.)
    const musicAttractions = attractions.filter((attr: any) => {
      const classifications = attr.classifications || [];
      const isMusicClassified = classifications.some((c: any) => 
        c.segment?.name?.toLowerCase() === 'music' ||
        c.genre?.name?.toLowerCase() !== 'undefined'
      );
      
      // Exclude if it's a venue, promoter, or festival brand (not an artist)
      const name = (attr.name || '').toLowerCase();
      const isVenue = 
        name.includes('arena') || 
        name.includes('stadium') || 
        name.includes('theater') ||
        name.includes('theatre') ||
        name.includes('center') ||
        name.includes('hall') ||
        name.includes('club') ||
        name.includes('amphitheater') ||
        name.includes('pavilion');
      
      const isPromoter = 
        name.includes('presents') ||
        name.includes('productions') ||
        name.includes('entertainment');
      
      const isFestivalBrand = 
        name.includes('festival') && name.split(' ').length <= 3;
      
      return !isVenue && !isPromoter && !isFestivalBrand;
    });
    
    if (musicAttractions.length > 0) {
      // Get the headliner (first music attraction)
      const headliner = musicAttractions[0];
      const cleanName = headliner.name.trim();
      console.log(`✅ BEST MATCH - Using Ticketmaster attraction: "${cleanName}" from event "${event.name}"`);
      return cleanName;
    }
    
    // Fallback: use first attraction even if not classified as music
    if (attractions[0]?.name) {
      const cleanName = attractions[0].name.trim();
      console.log(`⚠️ Using first attraction (unclassified): "${cleanName}" from event "${event.name}"`);
      return cleanName;
    }
  }

  // PRIORITY 2: Intelligent event name parsing
  console.log(`⚠️ No attraction data available - parsing event name: "${event.name}"`);
  let name = event.name || "Unknown Artist";
  const originalName = name;
  
  // STEP 1: Remove date/time patterns (they're never part of artist name)
  name = name.replace(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{1,2}(st|nd|rd|th)?\b/gi, '');
  name = name.replace(/\b\d{1,2}\/\d{1,2}(\/\d{2,4})?\b/g, '');
  name = name.replace(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi, '');
  name = name.replace(/\b\d{1,2}:\d{2}\s*(am|pm)?\b/gi, '');
  
  // STEP 2: Remove common venue indicators that appear AFTER artist name
  // Pattern: "Artist at Venue" or "Artist - Venue"
  name = name.split(/\s+(?:at|@)\s+/i)[0]; // "Artist at Venue" → "Artist"
  name = name.split(/\s+-\s+(?:the\s+)?(arena|stadium|theater|theatre|center|hall|club|venue)/i)[0];
  
  // STEP 3: Remove city/location info (usually after " in " or " | ")
  name = name.split(/\s+in\s+/i)[0];
  name = name.split(/\s+\|\s+/)[0];
  
  // STEP 4: Remove tour/year suffixes (everything after these keywords)
  name = name.replace(/:\s*(live|tour|concert|show|presents?|20\d{2}|'2\d).*$/i, '');
  name = name.replace(/\s+(tour|concert|live|show|experience|night|anniversary)\s*20\d{2}.*$/i, '');
  name = name.replace(/\s+20\d{2}\s+(tour|concert|world tour|arena tour).*$/i, '');
  
  // STEP 5: Remove featuring/supporting acts (keep only headliner)
  name = name.replace(/\s+(featuring|feat\\.?|ft\\.?|with|w\/|plus|&)\s+.*/i, '');
  
  // STEP 6: Remove content in brackets/parentheses (often venue, date, or tour name)
  name = name.replace(/[(\\[][^)\\]]*[)\\]]/g, '');
  
  // STEP 7: Remove common event descriptors at the end
  name = name.replace(/\s+(live|tour|concert|festival|show|experience|night|evening|matinee|performance|session|sessions|unplugged|acoustic|electric)$/i, '');
  
  // STEP 8: Remove "presents" prefix (promoter info)
  name = name.replace(/^.*?\s+presents:?\s+/i, '');
  
  // STEP 9: Clean up possessives that aren't part of actual names
  name = name.replace(/'s\s+(concert|tour|show|live|night).*$/i, '');
  
  // STEP 10: If there's a dash with significant content after, check if it's a subtitle
  const dashParts = name.split(/\s+-\s+/);
  if (dashParts.length > 1) {
    // Keep first part if second part looks like a tour name or descriptor
    const secondPart = dashParts[1].toLowerCase();
    const isTourName = /\b(tour|concert|live|show|night|experience|anniversary|celebration|tribute)\b/.test(secondPart);
    if (isTourName || secondPart.length > 40) {
      name = dashParts[0];
    }
  }
  
  // STEP 11: Handle multiple artists separated by commas or "&"
  // Usually first artist is the headliner
  if (name.includes(',') || name.includes(' & ')) {
    const parts = name.split(/[,&]/);
    if (parts.length > 1) {
      // Take first artist if it's substantial
      const firstArtist = parts[0].trim();
      if (firstArtist.length > 3 && firstArtist.length < 60) {
        name = firstArtist;
      }
    }
  }
  
  // STEP 12: Clean up whitespace and trim
  name = name.replace(/\s+/g, ' ').trim();
  name = name.replace(/^[-:,\s]+|[-:,\s]+$/g, '');
  
  // STEP 13: Validation - if name is too short or too long, it's likely wrong
  if (name.length < 2) {
    console.log(`❌ Name too short after parsing: "${name}" - using first word from original`);
    const words = originalName.split(/\s+/);
    name = words[0] || "Unknown Artist";
  }
  
  if (name.length > 80) {
    console.log(`❌ Name too long after parsing: "${name}" - taking first 50 chars`);
    name = name.substring(0, 50).trim();
  }
  
  // STEP 14: Final validation - filter out obvious non-artist names
  const nameLower = name.toLowerCase();
  const isObviouslyNotArtist = 
    nameLower.includes('festival') && name.split(' ').length <= 2 ||
    nameLower.includes('arena') ||
    nameLower.includes('stadium') ||
    nameLower === 'tba' ||
    nameLower === 'tbd' ||
    nameLower === 'to be announced' ||
    /^(the\s+)?(venue|show|concert|event)$/i.test(nameLower);
  
  if (isObviouslyNotArtist) {
    console.log(`❌ Rejected as non-artist: "${name}" - using event name as fallback`);
    // Last resort: just return the event name and let Spotify search handle it
    name = event.name;
  }
  
  const finalName = name || "Unknown Artist";
  console.log(`📝 PARSED: "${originalName}" → "${finalName}"`);
  return finalName;
}