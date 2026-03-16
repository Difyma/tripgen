import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import { MainNavbar } from '../components/MainNavbar';
import { Footer } from '../components/Footer';
import { travelArticles } from '../data/travelArticles';

const BLOG_TITLE = 'Блог о путешествиях — маршруты и идеи для поездок по России | TRIPGEN';
const BLOG_DESCRIPTION = 'Статьи о путешествиях по России: лучшие места, маршруты по Москве и Петербургу, куда поехать на выходные и летом. Советы от TRIPGEN.';

function setMetaDescription(content: string) {
  let el = document.querySelector('meta[name="description"]');
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', 'description');
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export function BlogPage() {
  useEffect(() => {
    document.title = BLOG_TITLE;
    setMetaDescription(BLOG_DESCRIPTION);
    return () => {
      document.title = 'TRIPGEN - Планируй отдых по России с AI';
      setMetaDescription('Планируй отдых по России за 1 минуту с помощью искусственного интеллекта. Получи готовое путешествие с маршрутами, отелями и ценами.');
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#FBFBFD]">
      <MainNavbar onAuthClick={() => {}} />
      <section className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 pt-24">
        <div className="max-w-[1400px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-semibold mb-4 tracking-tight text-gray-900">
              Блог о путешествиях
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Советы, маршруты и идеи для поездок по России и не только
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {travelArticles.map((article, index) => (
              <motion.article
                key={article.slug}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.05 * index }}
                className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <Link to={`/blog/${article.slug}`} className="block">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={article.heroImage}
                      alt={article.h1}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  <div className="p-5">
                    <h2 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-[#094D92] transition-colors line-clamp-2">
                      {article.h1}
                    </h2>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {article.excerpt}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(article.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                      {article.readTime && (
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          {article.readTime}
                        </span>
                      )}
                    </div>
                    <span className="inline-flex items-center gap-2 text-sm font-medium text-[#094D92] group-hover:gap-3 transition-all">
                      Читать статью
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </Link>
              </motion.article>
            ))}
          </motion.div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
