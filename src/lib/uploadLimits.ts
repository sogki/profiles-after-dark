import { supabase } from '@/lib/supabase';

export type UploadQuota = {
  used: number;
  quota: number;
  remaining: number;
  isPremium: boolean;
};

function normalizeQuotaPayload(payload: any): UploadQuota {
  const row = Array.isArray(payload) ? payload[0] : payload;
  return {
    used: Number(row?.used ?? 0),
    quota: Number(row?.quota ?? 100),
    remaining: Number(row?.remaining ?? 100),
    isPremium: Boolean(row?.is_premium ?? false),
  };
}

export async function getUploadQuota(userId: string): Promise<UploadQuota> {
  const { data, error } = await supabase.rpc('get_user_upload_usage', {
    p_user_id: userId,
  });

  if (error) {
    throw error;
  }

  return normalizeQuotaPayload(data);
}

export async function assertCanUpload(userId: string, uploadCost: number) {
  const quota = await getUploadQuota(userId);
  if (!quota.isPremium && quota.remaining < uploadCost) {
    throw new Error(
      `Upload limit reached. Free plan includes ${quota.quota} uploads. You have ${quota.remaining} remaining. Upgrade to Premium for unlimited uploads.`
    );
  }
  return quota;
}
