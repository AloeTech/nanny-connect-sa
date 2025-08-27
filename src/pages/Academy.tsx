import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Video, Play, CheckCircle, Clock, Award, BookOpen } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface AcademyVideo {
  id: string;
  title: string;
  description: string;
  video_url: string;
  duration_minutes: number;
  order_index: number;
  is_active: boolean;
}

interface VideoProgress {
  video_id: string;
  completed_at: string;
}

export default function Academy() {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const [videos, setVideos] = useState<AcademyVideo[]>([]);
  const [progress, setProgress] = useState<VideoProgress[]>([]);
  const [nannyId, setNannyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<AcademyVideo | null>(null);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      // Fetch academy videos
      const { data: videosData } = await supabase
        .from('academy_videos')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (videosData) {
        setVideos(videosData);
      }

      // If user is a nanny, fetch their progress
      if (user && userRole === 'nanny') {
        // Get nanny ID
        const { data: nannyData } = await supabase
          .from('nannies')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (nannyData) {
          setNannyId(nannyData.id);

          // Fetch progress
          const { data: progressData } = await supabase
            .from('nanny_academy_progress')
            .select('video_id, completed_at')
            .eq('nanny_id', nannyData.id);

          if (progressData) {
            setProgress(progressData);
          }
        }
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load academy content",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const markVideoComplete = async (videoId: string) => {
    if (!nannyId) return;

    try {
      const { error } = await supabase
        .from('nanny_academy_progress')
        .insert([{
          nanny_id: nannyId,
          video_id: videoId
        }]);

      if (error) {
        // If already completed, ignore the error
        if (!error.message.includes('duplicate')) {
          throw error;
        }
      }

      // Update local progress
      const newProgress = [...progress, { video_id: videoId, completed_at: new Date().toISOString() }];
      setProgress(newProgress);

      // Check if all videos are complete
      const totalActiveVideos = videos.filter(v => v.is_active).length;
      const completedVideos = newProgress.length;

      if (completedVideos >= totalActiveVideos && nannyId) {
        // Update nanny's academy_completed status
        await supabase
          .from('nannies')
          .update({ academy_completed: true })
          .eq('id', nannyId);

        toast({
          title: "Academy Complete!",
          description: "Congratulations! You've completed all training videos. An admin will review and approve your completion.",
        });
      } else {
        toast({
          title: "Success",
          description: "Video marked as complete!",
        });
      }

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const isVideoCompleted = (videoId: string) => {
    return progress.some(p => p.video_id === videoId);
  };

  const getCompletionPercentage = () => {
    if (videos.length === 0) return 0;
    return Math.round((progress.length / videos.length) * 100);
  };

  const getVideoEmbed = (url: string) => {
    // Convert YouTube URLs to embed format
    if (url.includes('youtube.com/watch')) {
      const videoId = url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    return url;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading academy content...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <BookOpen className="h-8 w-8" />
          Nanny Academy
        </h1>
        <p className="text-muted-foreground">Foundational training for certified nannies</p>
      </div>

      {userRole === 'nanny' && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Your Progress
            </CardTitle>
            <CardDescription>Complete all videos to earn your certification</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Videos Completed</span>
                <span>{progress.length} / {videos.length}</span>
              </div>
              <Progress value={getCompletionPercentage()} className="h-3" />
              <p className="text-sm text-muted-foreground">{getCompletionPercentage()}% complete</p>
            </div>
            {getCompletionPercentage() === 100 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <p className="font-medium text-green-800">Congratulations!</p>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  You have completed all academy training videos and earned your certification!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map((video, index) => {
          const isCompleted = isVideoCompleted(video.id);
          const isLocked = userRole === 'nanny' && index > 0 && !isVideoCompleted(videos[index - 1]?.id);

          return (
            <Card key={video.id} className={`relative ${isCompleted ? 'border-green-200 bg-green-50' : ''}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{video.title}</CardTitle>
                    <CardDescription className="mt-2">{video.description}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {isCompleted && (
                      <Badge variant="default" className="bg-green-500">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Complete
                      </Badge>
                    )}
                    {isLocked && (
                      <Badge variant="secondary">
                        <Clock className="h-3 w-3 mr-1" />
                        Locked
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{video.duration_minutes} minutes</span>
                  <span>Video {video.order_index + 1}</span>
                </div>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      className="w-full" 
                      disabled={isLocked}
                      onClick={() => setSelectedVideo(video)}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      {isCompleted ? 'Review Video' : 'Watch Video'}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl">
                    <DialogHeader>
                      <DialogTitle>{selectedVideo?.title}</DialogTitle>
                      <DialogDescription>{selectedVideo?.description}</DialogDescription>
                    </DialogHeader>
                    {selectedVideo && (
                      <div className="space-y-4">
                        <div className="aspect-video">
                          <iframe
                            src={getVideoEmbed(selectedVideo.video_url)}
                            className="w-full h-full rounded-lg"
                            frameBorder="0"
                            allowFullScreen
                            title={selectedVideo.title}
                          />
                        </div>
                        {userRole === 'nanny' && !isVideoCompleted(selectedVideo.id) && (
                          <div className="flex justify-center">
                            <Button onClick={() => markVideoComplete(selectedVideo.id)}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Mark as Complete
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </DialogContent>
                </Dialog>

                {isLocked && (
                  <p className="text-xs text-muted-foreground text-center">
                    Complete the previous video to unlock
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {videos.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Training Videos Available</h3>
            <p className="text-muted-foreground">
              Training content is being prepared. Please check back soon!
            </p>
          </CardContent>
        </Card>
      )}

      {/* Safety Notice */}
      <Card className="mt-8 border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-800">Training Guidelines</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Complete all videos in sequential order</li>
            <li>• Take notes during training sessions</li>
            <li>• Apply learned techniques in practice</li>
            <li>• Contact support if you have questions</li>
            <li>• Certification is required for profile approval</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
