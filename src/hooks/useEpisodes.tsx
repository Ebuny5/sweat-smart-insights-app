
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ProcessedEpisode, SeverityLevel, BodyArea } from '@/types';
import { useToast } from '@/hooks/use-toast';

export const useEpisodes = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [episodes, setEpisodes] = useState<ProcessedEpisode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEpisodes = useCallback(async () => {
    if (!user) {
      setLoading(false);
      setEpisodes([]);
      return;
    }

    try {
      setError(null);
      console.log('Fetching episodes for user:', user.id);
      
      const { data, error } = await supabase
        .from('episodes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching episodes:', error);
        throw error;
      }

      console.log('Raw episodes data:', data);

      const processedEpisodes: ProcessedEpisode[] = (data || []).map(ep => {
        try {
          let parsedTriggers = [];
          if (ep.triggers && Array.isArray(ep.triggers)) {
            parsedTriggers = ep.triggers.map((t: any) => {
              if (typeof t === 'string') {
                try {
                  const parsed = JSON.parse(t);
                  return {
                    type: parsed.type || 'environmental',
                    value: parsed.value || t,
                    label: parsed.label || parsed.value || t
                  };
                } catch {
                  return {
                    type: 'environmental',
                    value: t,
                    label: t
                  };
                }
              }
              return {
                type: t?.type || 'environmental',
                value: t?.value || 'Unknown',
                label: t?.label || t?.value || 'Unknown'
              };
            });
          }

          return {
            id: ep.id,
            userId: ep.user_id,
            datetime: new Date(ep.date),
            severityLevel: ep.severity as SeverityLevel,
            bodyAreas: (ep.body_areas || []) as BodyArea[],
            triggers: parsedTriggers,
            notes: ep.notes || undefined,
            createdAt: new Date(ep.created_at),
          };
        } catch (error) {
          console.error('Error processing episode:', ep.id, error);
          return {
            id: ep.id,
            userId: ep.user_id,
            datetime: new Date(ep.date),
            severityLevel: ep.severity as SeverityLevel,
            bodyAreas: (ep.body_areas || []) as BodyArea[],
            triggers: [],
            notes: ep.notes || undefined,
            createdAt: new Date(ep.created_at),
          };
        }
      });

      setEpisodes(processedEpisodes);
      console.log('Processed episodes:', processedEpisodes.length);
    } catch (error) {
      console.error('Failed to fetch episodes:', error);
      setError('Failed to load episodes');
      setEpisodes([]);
      toast({
        title: "Error loading episodes",
        description: "Please refresh the page to try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, toast]);

  useEffect(() => {
    fetchEpisodes();
  }, [fetchEpisodes]);

  return { episodes, loading, error, refetch: fetchEpisodes };
};
