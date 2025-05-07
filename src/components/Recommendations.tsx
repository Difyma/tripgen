import { MapPin, Map, Utensils, Landmark } from 'lucide-react';

const Recommendations = () => {
  const forYouItems = [
    {
      title: 'Maruyasu Frankfurt Hauptwache',
      type: 'Japanese',
      image: 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=800&q=80'
    },
    {
      title: 'Helium',
      type: 'International',
      image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80'
    },
    {
      title: 'Hauptwache',
      type: 'Attraction',
      image: 'https://images.unsplash.com/photo-1577185816322-21f6647f9b47?w=800&q=80'
    }
  ];

  const jumpBackItems = [
    {
      title: 'Exploring Moscow Region: June...',
      image: 'https://images.unsplash.com/photo-1513326738677-b964603b136d?w=800&q=80'
    },
    {
      title: 'Take our travel quiz',
      image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80'
    },
    {
      title: 'Create a trip',
      image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=80'
    }
  ];

  const inspiredItems = [
    {
      title: 'Bruges - one of the most charming...',
      image: 'https://images.unsplash.com/photo-1491557345352-5929e343eb89?w=800&q=80',
      author: {
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80'
      }
    },
    {
      title: 'Los Cabos: Eat & Drink like a local',
      image: 'https://images.unsplash.com/photo-1515443961218-a51367888e4b?w=800&q=80',
      author: {
        avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&q=80'
      }
    },
    {
      title: 'Best Beaches in Puerto Rico',
      image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&q=80',
      author: {
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80'
      }
    }
  ];

  return (
    <div className="w-[500px] h-screen border-l border-gray-200/50 bg-white overflow-y-auto">
      <div className="min-h-screen py-16 px-8 flex flex-col justify-center">
        {/* For you in Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold">For you in</span>
              <div className="flex items-center gap-1 text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>Innenstadt</span>
              </div>
            </div>
            <button className="flex items-center gap-1 px-3 py-1 rounded-full border border-gray-200 text-sm">
              <Map className="w-4 h-4" />
              Map
            </button>
          </div>
          <div className="grid grid-cols-3 gap-5">
            {forYouItems.map((item, index) => (
              <div key={index} className="relative rounded-2xl overflow-hidden group cursor-pointer aspect-[4/5]">
                <img 
                  src={item.image} 
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent text-white">
                  <h3 className="text-sm font-medium leading-tight">{item.title}</h3>
                  <div className="flex items-center gap-1 mt-1.5">
                    {item.type === 'Japanese' || item.type === 'International' ? (
                      <Utensils className="w-4 h-4" />
                    ) : (
                      <Landmark className="w-4 h-4" />
                    )}
                    <span className="text-xs">{item.type}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Jump back in Section */}
        <div className="mb-12">
          <h2 className="text-lg font-semibold mb-6">Jump back in</h2>
          <div className="grid grid-cols-3 gap-6">
            {jumpBackItems.map((item, index) => (
              <div key={index} className="relative rounded-2xl overflow-hidden group cursor-pointer aspect-[4/5]">
                <img 
                  src={item.image} 
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent text-white">
                  <h3 className="text-sm font-medium leading-tight">{item.title}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Get inspired Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Get inspired</h2>
            <button className="text-sm text-gray-600 hover:text-black">See all</button>
          </div>
          <div className="grid grid-cols-3 gap-5">
            {inspiredItems.map((item, index) => (
              <div key={index} className="relative rounded-2xl overflow-hidden group cursor-pointer aspect-[4/5]">
                <img 
                  src={item.image} 
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {item.author && (
                  <div className="absolute top-3 left-3">
                    <img 
                      src={item.author.avatar}
                      alt="Author"
                      className="w-7 h-7 rounded-full border-2 border-white"
                    />
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent text-white">
                  <h3 className="text-sm font-medium leading-tight">{item.title}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Recommendations; 