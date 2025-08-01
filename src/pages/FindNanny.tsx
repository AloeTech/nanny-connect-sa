import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Heart, MapPin, Star, Clock, CheckCircle, MessageCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface Nanny {
  id: string;
  user_id: string;
  languages: string[];
  experience_type: string;
  experience_duration: number;
  education_level: string;
  training_first_aid: boolean;
  training_nanny: boolean;
  training_cpr: boolean;
  training_child_development: boolean;
  academy_completed: boolean;
  profile_approved: boolean;
  hourly_rate: number;
  bio: string;
  profiles: {
    first_name: string;
    last_name: string;
    city: string;
    suburb: string;
    profile_picture_url: string;
  };
  interview_video_url: string;
}

export default function FindNanny() {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const [nannies, setNannies] = useState<Nanny[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    city: '',
    experienceType: '',
    maxRate: '',
    languages: ''
  });

  // Interest modal state
  const [selectedNanny, setSelectedNanny] = useState<Nanny | null>(null);
  const [interestMessage, setInterestMessage] = useState('');
  const [sendingInterest, setSendingInterest] = useState(false);

  useEffect(() => {
    fetchNannies();
  }, []);

  const fetchNannies = async () => {
    try {
      let query = supabase
        .from('nannies')
        .select(`
          *,
          profiles!inner(
            first_name,
            last_name,
            city,
            suburb,
            profile_picture_url
          )
        `);

      // If not admin, only show approved profiles
      if (userRole !== 'admin') {
        query = query.eq('profile_approved', true);
      }

      const { data, error } = await query;
      if (error) throw error;
      setNannies(data || []);
    } catch (error) {
      console.error('Error fetching nannies:', error);
      toast({
        title: "Error",
        description: "Failed to load nannies",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExpressInterest = async () => {
    if (!selectedNanny || !user) return;

    setSendingInterest(true);
    try {
      // First, get or create client profile
      let clientId;
      const { data: existingClient } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (existingClient) {
        clientId = existingClient.id;
      } else {
        // Create client profile
        const { data: newClient, error: clientError } = await supabase
          .from('clients')
          .insert({ user_id: user.id })
          .select('id')
          .single();

        if (clientError) throw clientError;
        clientId = newClient.id;
      }

      // Express interest
      const { error } = await supabase
        .from('interests')
        .insert({
          client_id: clientId,
          nanny_id: selectedNanny.id,
          message: interestMessage
        });

      if (error) throw error;

      toast({
        title: "Interest Sent!",
        description: "The nanny will be notified of your interest. To get their contact details, you'll need to pay R500.",
      });

      setSelectedNanny(null);
      setInterestMessage('');
    } catch (error) {
      console.error('Error expressing interest:', error);
      toast({
        title: "Error",
        description: "Failed to express interest",
        variant: "destructive"
      });
    } finally {
      setSendingInterest(false);
    }
  };

  const filteredNannies = nannies.filter(nanny => {
    if (filters.city && !nanny.profiles.city.toLowerCase().includes(filters.city.toLowerCase())) {
      return false;
    }
    if (filters.experienceType && filters.experienceType !== 'all' && nanny.experience_type !== filters.experienceType) {
      return false;
    }
    if (filters.maxRate && nanny.hourly_rate > parseFloat(filters.maxRate)) {
      return false;
    }
    if (filters.languages && !nanny.languages.some(lang => 
      lang.toLowerCase().includes(filters.languages.toLowerCase())
    )) {
      return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading nannies...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Find Your Perfect Nanny</h1>
        <p className="text-muted-foreground">
          Browse verified, trained nannies in your area
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Filter Nannies</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                placeholder="Search by city"
                value={filters.city}
                onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="experience">Experience Type</Label>
              <Select value={filters.experienceType} onValueChange={(value) => setFilters(prev => ({ ...prev, experienceType: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Any experience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any experience</SelectItem>
                  <SelectItem value="nanny">Nanny only</SelectItem>
                  <SelectItem value="cleaning">Cleaning only</SelectItem>
                  <SelectItem value="both">Both nanny & cleaning</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="rate">Max Rate (R/hour)</Label>
              <Input
                id="rate"
                type="number"
                placeholder="Max hourly rate"
                value={filters.maxRate}
                onChange={(e) => setFilters(prev => ({ ...prev, maxRate: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="languages">Languages</Label>
              <Input
                id="languages"
                placeholder="Search languages"
                value={filters.languages}
                onChange={(e) => setFilters(prev => ({ ...prev, languages: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Nannies Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredNannies.map((nanny) => (
          <Card key={nanny.id} className="card-hover">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {nanny.profiles.profile_picture_url ? (
                    <img 
                      src={`https://oqdqadcobqpzpveawzni.supabase.co/storage/v1/object/public/profile-pictures/${nanny.profiles.profile_picture_url}`}
                      alt="Profile"
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <Heart className="h-6 w-6 text-primary" />
                    </div>
                  )}
                  <div>
                    <CardTitle className="text-lg">
                      {nanny.profiles.first_name} {nanny.profiles.last_name?.charAt(0)}.
                    </CardTitle>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {nanny.profiles.city}, {nanny.profiles.suburb}
                    </div>
                  </div>
                </div>
                <Badge variant="secondary">R{nanny.hourly_rate}/hr</Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Verification Badges */}
              <div className="flex flex-wrap gap-2">
                {nanny.academy_completed && (
                  <Badge variant="outline" className="text-green-600 border-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Academy Complete
                  </Badge>
                )}
                {nanny.training_first_aid && (
                  <Badge variant="outline">First Aid</Badge>
                )}
                {nanny.training_cpr && (
                  <Badge variant="outline">CPR</Badge>
                )}
              </div>

              {/* Experience */}
              <div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4" />
                  <span>{nanny.experience_duration} months experience</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {nanny.experience_type === 'both' ? 'Nanny & Cleaning' : 
                   nanny.experience_type === 'nanny' ? 'Nanny' : 'Cleaning'}
                </p>
              </div>

              {/* Languages */}
              <div>
                <p className="text-sm font-medium mb-1">Languages:</p>
                <div className="flex flex-wrap gap-1">
                  {nanny.languages.slice(0, 3).map((lang, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {lang}
                    </Badge>
                  ))}
                  {nanny.languages.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{nanny.languages.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>

              {/* Introduction Video */}
              {nanny.interview_video_url && (
                <div>
                  <p className="text-sm font-medium mb-2">Introduction Video:</p>
                  <video 
                    src={`https://oqdqadcobqpzpveawzni.supabase.co/storage/v1/object/public/interview-videos/${nanny.interview_video_url}`}
                    controls
                    className="w-full h-32 rounded-md object-cover"
                  />
                </div>
              )}

              {/* Bio */}
              {nanny.bio && (
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {nanny.bio}
                </p>
              )}

              {/* Express Interest Button */}
              {user && userRole === 'client' && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      className="w-full" 
                      onClick={() => setSelectedNanny(nanny)}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Express Interest
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Express Interest</DialogTitle>
                      <DialogDescription>
                        Send a message to {nanny.profiles.first_name} expressing your interest. 
                        To get their contact details, you'll need to pay R500 after they respond.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="message">Your Message</Label>
                        <Textarea
                          id="message"
                          placeholder="Tell the nanny about your family and childcare needs..."
                          value={interestMessage}
                          onChange={(e) => setInterestMessage(e.target.value)}
                          rows={4}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          onClick={handleExpressInterest}
                          disabled={sendingInterest || !interestMessage.trim()}
                          className="flex-1"
                        >
                          {sendingInterest ? 'Sending...' : 'Send Interest'}
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setSelectedNanny(null)}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}

              {!user && (
                <Button className="w-full" asChild>
                  <a href="/auth">Sign In to Contact</a>
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredNannies.length === 0 && (
        <div className="text-center py-12">
          <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No nannies found</h3>
          <p className="text-muted-foreground">
            Try adjusting your filters or check back later for new profiles.
          </p>
        </div>
      )}
    </div>
  );
}