import { useEffect, Fragment } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { MainNavbar } from '../components/MainNavbar';
import { Footer } from '../components/Footer';
import { getTravelArticleBySlug } from '../data/travelArticles';
import type { TravelArticleSection } from '../data/travelArticleTypes';
import {
  TravelArticleHero,
  TravelArticleIntro,
  TravelArticleList,
  TravelArticleRegion,
  TravelArticleText,
  TravelArticleCards,
  TravelArticleImageBlock,
  TravelArticleRelated,
  TravelArticleCTA,
  TravelArticleStickyCTA,
  TravelArticleRegionNav,
  TravelArticleRegionGrid,
  TravelArticleRegionDescriptions,
  TravelArticlePlacesDetail,
  TravelArticleWhenToVisit,
  TravelArticleFaq,
  TravelArticlePopularRoutes,
  TravelArticleTravelTips,
  TravelArticleRoute,
} from '../components/travel-article';
import type { TravelArticleSectionRegion } from '../data/travelArticleTypes';

const DEFAULT_TITLE = 'TRIPGEN - Планируй отдых по России с AI';
const DEFAULT_DESCRIPTION = 'Планируй отдых по России за 1 минуту с помощью искусственного интеллекта. Получи готовое путешествие с маршрутами, отелями и ценами.';

function setMetaDescription(content: string) {
  let el = document.querySelector('meta[name="description"]');
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', 'description');
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function getRegionList(sections: TravelArticleSection[]): { id: string; title: string }[] {
  return sections
    .filter((s): s is TravelArticleSectionRegion => s.type === 'region')
    .map((r) => ({ id: r.id || `region-${r.title.toLowerCase().replace(/\s+/g, '-')}`, title: r.title }));
}

function renderSection(
  block: TravelArticleSection,
  index: number,
  options: {
    regionList: { id: string; title: string }[];
    regionBlocks: TravelArticleSectionRegion[];
    firstRegionIndex: number;
    compactRegions?: boolean;
  }
) {
  const { regionList, regionBlocks, firstRegionIndex, compactRegions } = options;
  const isFirstRegion = block.type === 'region' && index === firstRegionIndex;

  switch (block.type) {
    case 'list':
      return <TravelArticleList key={index} block={block} />;
    case 'region':
      if (compactRegions && regionBlocks.length > 0) {
        if (isFirstRegion) {
          return (
            <Fragment key="region-grid">
              {regionList.length > 0 && <TravelArticleRegionNav regions={regionList} />}
              <TravelArticleRegionGrid regions={regionBlocks} />
            </Fragment>
          );
        }
        return <Fragment key={`region-skip-${index}`} />;
      }
      return (
        <Fragment key={index}>
          {isFirstRegion && regionList.length > 0 && (
            <TravelArticleRegionNav regions={regionList} />
          )}
          <TravelArticleRegion block={block} compact={compactRegions} />
        </Fragment>
      );
    case 'text':
      return <TravelArticleText key={index} block={block} />;
    case 'cards':
      return <TravelArticleCards key={index} block={block} />;
    case 'image':
      return <TravelArticleImageBlock key={index} block={block} />;
    case 'regionDescriptions':
      return regionBlocks.length > 0 ? (
        <TravelArticleRegionDescriptions key={index} regions={regionBlocks} />
      ) : null;
    case 'placesDetail':
      return <TravelArticlePlacesDetail key={index} block={block} />;
    case 'whenToVisit':
      return <TravelArticleWhenToVisit key={index} block={block} />;
    case 'faq':
      return <TravelArticleFaq key={index} block={block} />;
    case 'popularRoutes':
      return <TravelArticlePopularRoutes key={index} block={block} />;
    case 'travelTips':
      return <TravelArticleTravelTips key={index} block={block} />;
    case 'route':
      return <TravelArticleRoute key={index} block={block} />;
    case 'related':
      return <TravelArticleRelated key={index} links={block.links} />;
    case 'cta':
      return <TravelArticleCTA key={index} />;
    default:
      return null;
  }
}

export function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const article = slug ? getTravelArticleBySlug(slug) : undefined;

  useEffect(() => {
    if (article) {
      document.title = article.seoTitle + ' | TRIPGEN';
      setMetaDescription(article.seoDescription);
    }
    return () => {
      document.title = DEFAULT_TITLE;
      setMetaDescription(DEFAULT_DESCRIPTION);
    };
  }, [article]);

  if (!article) {
    return (
      <div className="min-h-screen bg-[#FBFBFD]">
        <MainNavbar onAuthClick={() => {}} />
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <h1 className="text-2xl font-semibold text-gray-900 mb-4">Статья не найдена</h1>
          <button
            type="button"
            onClick={() => navigate('/blog')}
            className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            К блогу
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  const regionList = getRegionList(article.sections);
  const regionBlocks = article.sections.filter(
    (s): s is TravelArticleSectionRegion => s.type === 'region'
  );
  const firstRegionIndex = article.sections.findIndex((s) => s.type === 'region');

  return (
    <div className="min-h-screen bg-[#FBFBFD]">
      <MainNavbar onAuthClick={() => {}} />
      <article className="pb-0">
        <TravelArticleHero
          title={article.h1}
          image={article.heroImage}
          date={article.date}
          readTime={article.readTime}
          author={article.author}
          heroCta={article.heroCta}
        />
        <TravelArticleIntro
          paragraphs={article.intro}
          introCards={article.introCards}
        />
        {article.sections.map((block, index) =>
          renderSection(block, index, {
            regionList,
            regionBlocks,
            firstRegionIndex,
            compactRegions: article.compactRegions,
          })
        )}
      </article>
      <TravelArticleStickyCTA />
      <Footer />
    </div>
  );
}
