import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import CreatorForm from './CreatorForm';
import { MapPinIcon, StarIcon, InstagramIcon, YoutubeIcon } from 'lucide-react';

interface Creator {
  id: string;
  name: string;
  bio: string;
  avatar: string;
  expertise: string[];
  location: string;
  followers: number;
  rating: number;
  trips: number;
  socialLinks: {
    instagram?: string;
    youtube?: string;
    tiktok?: string;
  };
}

const mockCreators: Creator[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    bio: 'Adventure photographer and travel blogger with 8 years of experience exploring hidden gems around the world.',
    avatar: '/api/placeholder/100/100',
    expertise: ['Photography', 'Adventure Travel', 'Solo Travel'],
    location: 'New York, USA',
    followers: 125000,
    rating: 4.9,
    trips: 47,
    socialLinks: {
      instagram: 'https://instagram.com/sarahjohnson',
      youtube: 'https://youtube.com/@sarahjohnson'
    }
  },
  {
    id: '2',
    name: 'Marco Rodriguez',
    bio: 'Food enthusiast and cultural explorer specializing in authentic local experiences and culinary adventures.',
    avatar: '/api/placeholder/100/100',
    expertise: ['Food Tourism', 'Cultural Immersion', 'Local Experiences'],
    location: 'Barcelona, Spain',
    followers: 89000,
    rating: 4.8,
    trips: 32,
    socialLinks: {
      instagram: 'https://instagram.com/marcorodriguez',
      tiktok: 'https://tiktok.com/@marcorodriguez'
    }
  }
];

export default function CreatorPage() {
  const [showForm, setShowForm] = useState(false);

  const handleFormSubmit = (data: any) => {
    console.log('Creator application submitted:', data);
    setShowForm(false);
    // Here you would typically send the data to your backend
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Meet Our Travel Creators
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Connect with experienced travelers and local experts who will guide you to unforgettable experiences
          </p>
          <Button 
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            Become a Creator
          </Button>
        </div>

        {/* Creator Application Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Become a Travel Creator</h2>
                <Button 
                  variant="ghost" 
                  onClick={() => setShowForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </Button>
              </div>
              <CreatorForm onSubmit={handleFormSubmit} />
            </div>
          </div>
        )}

        {/* Creators Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {mockCreators.map((creator) => (
            <Card key={creator.id} className="overflow-hidden hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="text-center">
                <Avatar className="w-24 h-24 mx-auto mb-4">
                  <AvatarImage src={creator.avatar} alt={creator.name} />
                  <AvatarFallback>{creator.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <CardTitle className="text-xl">{creator.name}</CardTitle>
                <CardDescription className="flex items-center justify-center text-sm text-gray-500">
                  <MapPinIcon className="w-4 h-4 mr-1" />
                  {creator.location}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-gray-600 text-sm leading-relaxed">{creator.bio}</p>
                
                {/* Expertise Tags */}
                <div className="flex flex-wrap gap-2">
                  {creator.expertise.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 text-center py-4 border-t border-gray-100">
                  <div>
                    <div className="font-semibold text-lg">{creator.followers.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">Followers</div>
                  </div>
                  <div>
                    <div className="font-semibold text-lg flex items-center justify-center">
                      <StarIcon className="w-4 h-4 text-yellow-500 mr-1" />
                      {creator.rating}
                    </div>
                    <div className="text-xs text-gray-500">Rating</div>
                  </div>
                  <div>
                    <div className="font-semibold text-lg">{creator.trips}</div>
                    <div className="text-xs text-gray-500">Trips</div>
                  </div>
                </div>

                {/* Social Links */}
                <div className="flex justify-center space-x-4 pt-2">
                  {creator.socialLinks.instagram && (
                    <a 
                      href={creator.socialLinks.instagram} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-pink-600 hover:text-pink-700"
                    >
                      <InstagramIcon className="w-5 h-5" />
                    </a>
                  )}
                  {creator.socialLinks.youtube && (
                    <a 
                      href={creator.socialLinks.youtube} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-red-600 hover:text-red-700"
                    >
                      <YoutubeIcon className="w-5 h-5" />
                    </a>
                  )}
                </div>

                <Button className="w-full mt-4">
                  View Profile
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16 p-8 bg-white rounded-2xl shadow-lg">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Share Your Travel Expertise?
          </h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Join our community of travel creators and help others discover amazing destinations while earning from your passion for travel.
          </p>
          <Button 
            onClick={() => setShowForm(true)}
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            Start Your Creator Journey
          </Button>
        </div>
      </div>
    </div>
  );
}