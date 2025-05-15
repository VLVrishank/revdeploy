import React from 'react';
import { Link } from 'react-router-dom';

const featuredArticle = {
  id: '1',
  title: 'The Art of Slow Living in a Fast-Paced World',
  excerpt: 'Discovering the beauty of mindful living and intentional choices in our modern society.',
  author: 'Emma Richardson',
  date: 'March 12, 2024',
  image: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d'
};

const articles = [
  {
    id: '2',
    title: 'Urban Gardens: A Green Revolution',
    excerpt: 'How city dwellers are transforming concrete jungles into verdant paradises.',
    author: 'James Mitchell',
    date: 'March 11, 2024',
  },
  {
    id: '3',
    title: 'The Renaissance of Analog Photography',
    excerpt: 'Young photographers return to film in search of authentic expression.',
    author: 'Sofia Chen',
    date: 'March 10, 2024',
  }
];

const Home = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="border-b border-stone-200 pb-12 mb-12">
        <Link to={`/article/${featuredArticle.id}`} className="group">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="font-serif text-4xl font-bold text-stone-900 mb-4 group-hover:text-stone-700">
                {featuredArticle.title}
              </h1>
              <p className="text-stone-600 mb-4">{featuredArticle.excerpt}</p>
              <div className="text-sm text-stone-500">
                <span>{featuredArticle.author}</span>
                <span className="mx-2">·</span>
                <span>{featuredArticle.date}</span>
              </div>
            </div>
            <div className="aspect-[4/3] overflow-hidden">
              <img 
                src={`${featuredArticle.image}?auto=format&fit=crop&w=1200&q=80`}
                alt={featuredArticle.title}
                className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          </div>
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-12">
        {articles.map(article => (
          <Link key={article.id} to={`/article/${article.id}`} className="group">
            <article>
              <h2 className="font-serif text-2xl font-bold text-stone-900 mb-3 group-hover:text-stone-700">
                {article.title}
              </h2>
              <p className="text-stone-600 mb-3">{article.excerpt}</p>
              <div className="text-sm text-stone-500">
                <span>{article.author}</span>
                <span className="mx-2">·</span>
                <span>{article.date}</span>
              </div>
            </article>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Home;