import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';

type Article = Database['public']['Tables']['articles']['Row'] & {
  profiles: {
    username: string;
  };
};

const Recommendations = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticles = async () => {
      const { data, error } = await supabase
        .from('articles')
        .select(`
          *,
          profiles (
            username
          )
        `)
        .eq('published', true)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching articles:', error);
      } else {
        setArticles(data as Article[]);
      }
      setLoading(false);
    };

    fetchArticles();
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse space-y-8">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="h-6 bg-stone-200 rounded w-3/4"></div>
              <div className="h-4 bg-stone-200 rounded w-1/4"></div>
              <div className="h-4 bg-stone-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="font-serif text-3xl font-bold text-stone-900 mb-8">Recommended Articles</h1>
      <div className="space-y-8">
        {articles.map((article) => (
          <article key={article.id} className="border-b border-stone-200 pb-8">
            <Link to={`/article/${article.id}`} className="group">
              <h2 className="font-serif text-2xl font-bold text-stone-900 mb-2 group-hover:text-stone-700">
                {article.title}
              </h2>
              <div className="text-sm text-stone-500 mb-3">
                <span>{article.profiles.username}</span>
                <span className="mx-2">·</span>
                <span>{new Date(article.created_at).toLocaleDateString()}</span>
              </div>
              <p className="text-stone-600 line-clamp-3">
                {typeof article.content === 'object' && 'content' in article.content
                  ? String(article.content.content).slice(0, 200) + '...'
                  : ''}
              </p>
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
};

export default Recommendations;