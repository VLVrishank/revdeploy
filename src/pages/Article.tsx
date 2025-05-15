import React from 'react';
import { useParams } from 'react-router-dom';

const Article = () => {
  const { id } = useParams();

  // This would normally fetch the article data based on the ID
  const article = {
    title: 'The Art of Slow Living in a Fast-Paced World',
    author: 'Emma Richardson',
    date: 'March 12, 2024',
    image: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d',
    content: `
      In an era where speed is celebrated and instant gratification is the norm, there's a growing movement that champions the opposite: slow living. This philosophy isn't about doing everything at a snail's pace; rather, it's about being present, finding purpose, and making conscious choices about how we spend our precious time.

      The modern world pulls us in countless directions simultaneously. Our phones buzz with notifications, our inboxes overflow with emails, and our calendars are packed with commitments. In this chaos, the art of slow living emerges as a revolutionary act of resistance.

      But what does it mean to live slowly in a fast-paced world? It starts with small, intentional choices. It's about savoring your morning coffee instead of rushing through it, taking the scenic route home occasionally, or spending an afternoon lost in a good book without feeling guilty about your productivity.

      The benefits of this approach extend far beyond the obvious. Research shows that slowing down can improve mental health, enhance creativity, and strengthen relationships. When we're not racing through life, we notice details we might have missed, appreciate moments we might have overlooked, and connect more deeply with those around us.
    `.trim()
  };

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <header className="text-center mb-12">
        <h1 className="font-serif text-4xl md:text-5xl font-bold text-stone-900 mb-4">
          {article.title}
        </h1>
        <div className="text-stone-500">
          <span>{article.author}</span>
          <span className="mx-2">·</span>
          <span>{article.date}</span>
        </div>
      </header>

      <div className="aspect-[16/9] mb-12 overflow-hidden rounded-lg">
        <img
          src={`${article.image}?auto=format&fit=crop&w=2000&q=80`}
          alt={article.title}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="prose prose-stone prose-lg mx-auto">
        {article.content.split('\n\n').map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
    </article>
  );
};

export default Article;