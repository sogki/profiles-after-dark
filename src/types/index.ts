export interface ProfileImage {
  id: string;
  title: string;
  category: 'discord' | 'twitter' | 'instagram' | 'general';
  type: 'profile' | 'banner';
  imageUrl: string;
  downloadCount: number;
  uploadedAt: string;
  tags: string[];
}

export interface UploadFormData {
  title: string;
  category: ProfileImage['category'];
  type: ProfileImage['type'];
  tags: string[];
  file: File | null;
}

export interface User {
  id: string;
  email: string;
  created_at: string;
}