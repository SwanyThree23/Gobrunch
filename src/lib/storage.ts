import { supabase } from './supabase';

export const storage = {
  async upload(bucket: string, path: string, file: File) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true,
      });
    if (error) throw error;

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
    return { path: data.path, url: urlData.publicUrl };
  },

  async download(bucket: string, path: string) {
    const { data, error } = await supabase.storage.from(bucket).download(path);
    if (error) throw error;
    return data;
  },

  async remove(bucket: string, paths: string[]) {
    const { data, error } = await supabase.storage.from(bucket).remove(paths);
    if (error) throw error;
    return data;
  },

  getPublicUrl(bucket: string, path: string) {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  },

  async list(bucket: string, path?: string) {
    const { data, error } = await supabase.storage.from(bucket).list(path);
    if (error) throw error;
    return data;
  },
};
