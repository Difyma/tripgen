import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface CreatorFormProps {
  onSubmit: (data: any) => void;
}

export default function CreatorForm({ onSubmit }: CreatorFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    expertise: '',
    socialLinks: {
      instagram: '',
      youtube: '',
      tiktok: ''
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSocialLinkChange = (platform: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [platform]: value
      }
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-2">
          Creator Name
        </label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          placeholder="Enter your name"
          required
        />
      </div>

      <div>
        <label htmlFor="bio" className="block text-sm font-medium mb-2">
          Bio
        </label>
        <Textarea
          id="bio"
          value={formData.bio}
          onChange={(e) => handleInputChange('bio', e.target.value)}
          placeholder="Tell us about yourself"
          rows={4}
        />
      </div>

      <div>
        <label htmlFor="expertise" className="block text-sm font-medium mb-2">
          Expertise
        </label>
        <Input
          id="expertise"
          value={formData.expertise}
          onChange={(e) => handleInputChange('expertise', e.target.value)}
          placeholder="What are you known for?"
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Social Media Links</h3>
        
        <div>
          <label htmlFor="instagram" className="block text-sm font-medium mb-2">
            Instagram
          </label>
          <Input
            id="instagram"
            value={formData.socialLinks.instagram}
            onChange={(e) => handleSocialLinkChange('instagram', e.target.value)}
            placeholder="https://instagram.com/username"
          />
        </div>

        <div>
          <label htmlFor="youtube" className="block text-sm font-medium mb-2">
            YouTube
          </label>
          <Input
            id="youtube"
            value={formData.socialLinks.youtube}
            onChange={(e) => handleSocialLinkChange('youtube', e.target.value)}
            placeholder="https://youtube.com/@username"
          />
        </div>

        <div>
          <label htmlFor="tiktok" className="block text-sm font-medium mb-2">
            TikTok
          </label>
          <Input
            id="tiktok"
            value={formData.socialLinks.tiktok}
            onChange={(e) => handleSocialLinkChange('tiktok', e.target.value)}
            placeholder="https://tiktok.com/@username"
          />
        </div>
      </div>

      <Button type="submit" className="w-full">
        Submit Creator Application
      </Button>
    </form>
  );
}