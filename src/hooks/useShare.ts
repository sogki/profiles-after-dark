import { useCallback } from 'react';
import toast from 'react-hot-toast';

interface ShareOptions {
  title?: string;
  text?: string;
  url?: string;
}

export function useShare() {
  const copyToClipboard = useCallback(async (text: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        toast.success('Link copied to clipboard!');
        return true;
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand('copy');
          toast.success('Link copied to clipboard!');
          return true;
        } catch (err) {
          console.error('Failed to copy:', err);
          toast.error('Failed to copy link');
          return false;
        } finally {
          document.body.removeChild(textArea);
        }
      }
    } catch (err) {
      console.error('Failed to copy:', err);
      toast.error('Failed to copy link');
      return false;
    }
  }, []);

  const shareLink = useCallback(async (url: string, options?: ShareOptions) => {
    const shareUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`;
    
    // Try Web Share API first (mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: options?.title || 'Check this out!',
          text: options?.text || '',
          url: shareUrl,
        });
        return true;
      } catch (err) {
        // User cancelled or error occurred
        if ((err as Error).name !== 'AbortError') {
          console.error('Error sharing:', err);
        }
        // Fall through to clipboard fallback
      }
    }

    // Fallback to clipboard
    return await copyToClipboard(shareUrl);
  }, [copyToClipboard]);

  const shareProfile = useCallback(async (username: string) => {
    const fullUrl = `https://profilesafterdark.com/user/${username}`;
    return await copyToClipboard(fullUrl);
  }, [copyToClipboard]);

  const shareProfileCombo = useCallback(async (comboId: string, title?: string) => {
    const url = `/gallery/profiles/${comboId}`;
    return await shareLink(url, {
      title: title ? `${title} - Profile Combo` : 'Profile Combo',
      text: title ? `Check out this profile combo: ${title}` : 'Check out this profile combo!',
    });
  }, [shareLink]);

  const sharePfp = useCallback(async (pfpId: string, title?: string) => {
    const url = `/gallery/pfps/${pfpId}`;
    return await shareLink(url, {
      title: title ? `${title} - Profile Picture` : 'Profile Picture',
      text: title ? `Check out this profile picture: ${title}` : 'Check out this profile picture!',
    });
  }, [shareLink]);

  const shareBanner = useCallback(async (bannerId: string, title?: string) => {
    const url = `/gallery/banners/${bannerId}`;
    return await shareLink(url, {
      title: title ? `${title} - Banner` : 'Banner',
      text: title ? `Check out this banner: ${title}` : 'Check out this banner!',
    });
  }, [shareLink]);

  return {
    copyToClipboard,
    shareLink,
    shareProfile,
    shareProfileCombo,
    sharePfp,
    shareBanner,
  };
}

