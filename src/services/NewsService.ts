import { supabase, News } from '../lib/supabase';

const NEWS_API_KEY = import.meta.env.VITE_NEWS_API_KEY || 'd58b4f1c5edb4e559bae73d87afb3cc0';
const NEWS_API_URL = 'https://newsapi.org/v2/top-headlines';
const MAX_NEWS_ROWS = 100; // Maximum number of news rows to store

interface NewsApiResponse {
  status: string;
  totalResults: number;
  articles: {
    source: {
      id: string | null;
      name: string;
    };
    author: string | null;
    title: string;
    description: string | null;
    url: string;
    urlToImage: string | null;
    publishedAt: string;
    content: string | null;
  }[];
}

export const NewsService = {
  async fetchAndStoreNews(): Promise<boolean> {
    try {
      // Check if we've already fetched news today
      const today = new Date().toISOString().split('T')[0];
      const { data: existingNews } = await supabase
        .from('news')
        .select('id')
        .gte('created_at', `${today}T00:00:00`)
        .limit(1);

      // If we already have news from today, don't fetch more
      if (existingNews && existingNews.length > 0) {
        console.log('Already fetched news today, using existing data');
        return true;
      }

      // Check total count of news entries
      const { count, error: countError } = await supabase
        .from('news')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        console.error('Error counting news entries:', countError);
        return false;
      }

      // If we have reached the maximum limit, don't fetch more news
      if (count && count >= MAX_NEWS_ROWS) {
        console.log(`News table has reached maximum limit of ${MAX_NEWS_ROWS} rows. Skipping API fetch.`);
        // Optionally delete oldest entries to make room for new ones
        await this.pruneOldNews();
        return true;
      }

      // Fetch news from API
      const response = await fetch(`${NEWS_API_URL}?country=us&category=health&apiKey=${NEWS_API_KEY}`);
      const data: NewsApiResponse = await response.json();

      if (data.status !== 'ok') {
        throw new Error('Failed to fetch news');
      }

      // Transform and store news articles
      const newsItems = data.articles
        .filter(article => article.urlToImage && article.description)
        .map(article => ({
          title: article.title,
          description: article.description || '',
          url: article.url,
          image_url: article.urlToImage || '',
          published_at: article.publishedAt,
          source: article.source.name,
          created_at: new Date().toISOString()
        }));

      if (newsItems.length === 0) {
        console.log('No valid news items found');
        return false;
      }

      // Store in database
      const { error } = await supabase.from('news').insert(newsItems);

      if (error) {
        console.error('Error storing news:', error);
        return false;
      }

      console.log(`Stored ${newsItems.length} news items`);
      return true;
    } catch (error) {
      console.error('Error in fetchAndStoreNews:', error);
      return false;
    }
  },

  // New method to prune old news entries when we reach the limit
  async pruneOldNews(): Promise<boolean> {
    try {
      // Get the IDs of the oldest news entries that exceed our limit
      // We'll keep the newest MAX_NEWS_ROWS/2 entries and delete the rest
      const keepCount = Math.floor(MAX_NEWS_ROWS / 2);
      
      const { data: oldestNews, error: selectError } = await supabase
        .from('news')
        .select('id')
        .order('created_at', { ascending: true })
        .limit(MAX_NEWS_ROWS);

      if (selectError) {
        console.error('Error selecting old news for pruning:', selectError);
        return false;
      }

      if (!oldestNews || oldestNews.length <= keepCount) {
        return true; // Nothing to prune
      }

      // Get IDs to delete (all except the newest keepCount)
      const idsToDelete = oldestNews
        .slice(0, oldestNews.length - keepCount)
        .map(item => item.id);

      if (idsToDelete.length === 0) {
        return true; // Nothing to delete
      }

      // Delete the oldest entries
      const { error: deleteError } = await supabase
        .from('news')
        .delete()
        .in('id', idsToDelete);

      if (deleteError) {
        console.error('Error pruning old news:', deleteError);
        return false;
      }

      console.log(`Pruned ${idsToDelete.length} old news entries`);
      return true;
    } catch (error) {
      console.error('Error in pruneOldNews:', error);
      return false;
    }
  },

  async getNews(): Promise<News[]> {
    try {
      // Get news from the last 7 days, ordered by published date
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .order('published_at', { ascending: false })
        .limit(20);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching news:', error);
      return [];
    }
  },

  async getNewsSettings(): Promise<{ enabled: boolean }> {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'news_enabled')
        .single();

      if (error) {
        // If setting doesn't exist, create it
        if (error.code === 'PGRST116') {
          await supabase
            .from('settings')
            .insert({ key: 'news_enabled', value: { enabled: true } });
          return { enabled: true };
        }
        throw error;
      }

      return data?.value || { enabled: true };
    } catch (error) {
      console.error('Error fetching news settings:', error);
      return { enabled: true }; // Default to enabled
    }
  },

  async updateNewsSettings(enabled: boolean): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('settings')
        .upsert({ key: 'news_enabled', value: { enabled } });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating news settings:', error);
      return false;
    }
  }
};