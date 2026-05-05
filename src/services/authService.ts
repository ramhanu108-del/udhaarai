import { supabase } from '../lib/supabase';
import { useStore } from '../store/useStore';

export const authService = {
  async signUp(email: string, password: string, profile: any) {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (error) throw error;
    
    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          ...profile,
          created_at: Date.now(),
          updated_at: Date.now()
        });
        
      if (profileError) {
         console.error('Failed to create profile', profileError);
      }
      useStore.getState().setAuthUser({ id: data.user.id, email: data.user.email || '' });
    }
    return data;
  },

  async signIn(email: string, password: string) {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    if (data.user) {
      useStore.getState().setAuthUser({ id: data.user.id, email: data.user.email || '' });
    }
    return data;
  },

  async signOut() {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    useStore.getState().setAuthUser(null);
  },

  async getCurrentUser() {
    if (!supabase) return null;
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  async updateProfile(updates: any) {
    if (!supabase) throw new Error('Supabase client not initialized');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not logged in');

    const { error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: Date.now() })
      .eq('id', user.id);

    if (error) throw error;
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    if (!supabase) return { data: { subscription: { unsubscribe: () => {} } } };
    return supabase.auth.onAuthStateChange(callback);
  }
};
