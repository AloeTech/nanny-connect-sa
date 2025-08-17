import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Heart, MapPin, Star, Clock, CheckCircle, X, Eye } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  criminal_check_status: string;
  credit_check_status: string;
  hourly_rate: number;
  bio: string;
  interview_video_url: string;
  date_of_birth: string;
  accommodation_preference: string;
  profiles: {
    first_name: string;
    last_name: string;
    city: string;
    suburb: string;
    town: string;
    profile_picture_url: string;
    email: string;
  };
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
  const [existingInterests, setExistingInterests] = useState<string[]>([]);

  // Check role for client features
  const hasRole = userRole === 'client';

  useEffect(() => {
    fetchNannies();
    if (user && hasRole) {
      fetchExistingInterests();
    }
  }, [user, hasRole]);

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
            town,
            profile_picture_url,
            email
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

  const fetchExistingInterests = async () => {
    if (!user) return;
    
    try {
      const { data: clientData } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (clientData) {
        const { data: interests } = await supabase
          .from('interests')
          .select('nanny_id')
          .eq('client_id', clientData.id);

        if (interests) {
          setExistingInterests(interests.map(i => i.nanny_id));
        }
      }
    } catch (error) {
      console.error('Error fetching existing interests:', error);
    }
  };

  const canExpressInterest = (nannyId: string) => {
    return !existingInterests.includes(nannyId);
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

      // Check if client can express interest (no pending/approved interest exists)
      const { data: existingInterest, error: checkError } = await supabase
        .from('interests')
        .select('id')
        .eq('client_id', clientId)
        .eq('nanny_id', selectedNanny.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') throw checkError;

      if (existingInterest) {
        toast({
          title: "Interest Already Sent",
          description: "You have already expressed interest in this nanny. Please wait for their response or contact admin.",
          variant: "destructive"
        });
        setSelectedNanny(null);
        return;
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

      // Send email notification to nanny
      try {
        await supabase.functions.invoke('send-notification', {
          body: {
            to: selectedNanny.profiles.email,
            subject: 'New Client Interest - Nanny Placements SA',
            message: `You have received a new interest request from a client.

Client Message: "${interestMessage}"

Please log in to your nanny dashboard to approve or decline this request.

Best regards,
Nanny Placements SA Team`,
            type: 'new_interest',
            nannyName: `${selectedNanny.profiles.first_name} ${selectedNanny.profiles.last_name}`,
            clientName: `${user?.user_metadata?.first_name} ${user?.user_metadata?.last_name}`
          }
        });
      } catch (emailError) {
        console.error('Error sending notification email:', emailError);
        // Don't block the main flow if email fails
      }

      toast({
        title: "Interest Sent!",
        description: "The nanny will be notified of your interest and can approve or decline it.",
      });

      setSelectedNanny(null);
      setInterestMessage('');
      fetchExistingInterests(); // Refresh existing interests
    } catch (error) {
      console.error('Error expressing interest:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to express interest",
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
          <Card key={nanny.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                {nanny.profiles.profile_picture_url ? (
                  <img 
                    src={nanny.profiles.profile_picture_url}
                    alt="Profile"
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                    <Heart className="h-8 w-8 text-primary" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{nanny.profiles.first_name}</h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {nanny.profiles.city}{nanny.profiles.town ? `, ${nanny.profiles.town}` : ''}
                  </p>
                  {nanny.date_of_birth && (
                    <p className="text-xs text-muted-foreground">
                      Age: {new Date().getFullYear() - new Date(nanny.date_of_birth).getFullYear()} years
                    </p>
                  )}
                  {nanny.accommodation_preference && (
                    <p className="text-xs text-muted-foreground capitalize">
                      {nanny.accommodation_preference.replace('_', ' ')} position
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold">{nanny.profiles.first_name}</h3>
                  <p className="text-muted-foreground">
                    {nanny.profiles.city}{nanny.profiles.town ? `, ${nanny.profiles.town}` : ''}
                  </p>
                  {nanny.date_of_birth && (
                    <p className="text-sm text-muted-foreground">
                      Age: {new Date().getFullYear() - new Date(nanny.date_of_birth).getFullYear()} years • 
                      {nanny.accommodation_preference && (
                        <span className="capitalize ml-1">
                          {nanny.accommodation_preference.replace('_', ' ')} position
                        </span>
                      )}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">R{nanny.hourly_rate}/hour</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {nanny.academy_completed && (
                      <Badge variant="secondary">Academy Complete</Badge>
                    )}
                    {nanny.criminal_check_status === 'approved' && (
                      <Badge variant="default">Criminal Check ✓</Badge>
                    )}
                    {nanny.credit_check_status === 'approved' && (
                      <Badge variant="default">Credit Check ✓</Badge>
                    )}
                    {nanny.profile_approved && (
                      <Badge variant="default">Profile Verified</Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Bio */}
              {nanny.bio && (
                <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                  {nanny.bio}
                </p>
              )}

              {/* Languages */}
              <div className="mt-3">
                <p className="text-sm font-medium mb-1">Languages:</p>
                <div className="flex flex-wrap gap-1">
                  {nanny.languages.slice(0, 3).map((lang, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {lang}
                    </Badge>
                  ))}
                  {nanny.languages.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{nanny.languages.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Button 
                  variant="outline"
                  onClick={() => setSelectedNanny(nanny)}
                >
                  View Profile
                </Button>
                {user && hasRole && (
                  <Button 
                    className="flex-1"
                    onClick={() => setSelectedNanny(nanny)}
                    disabled={!canExpressInterest(nanny.id)}
                  >
                    {canExpressInterest(nanny.id) ? 'Express Interest' : 'Interest Already Sent'}
                  </Button>
                )}
              </div>
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

      {/* Nanny Profile Dialog */}
      <Dialog open={!!selectedNanny} onOpenChange={() => setSelectedNanny(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nanny Profile - {selectedNanny?.profiles.first_name}</DialogTitle>
            <DialogDescription>
              Detailed profile information
            </DialogDescription>
          </DialogHeader>
          
          {selectedNanny && (
            <div className="space-y-6">
              {/* Profile Header */}
              <div className="flex items-start gap-4">
                {selectedNanny.profiles.profile_picture_url && (
                  <img
                    src={selectedNanny.profiles.profile_picture_url}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover"
                  />
                )}
                <div className="flex-1">
                  <h3 className="text-2xl font-bold">{selectedNanny.profiles.first_name}</h3>
                  <p className="text-muted-foreground">
                    {selectedNanny.profiles.city}{selectedNanny.profiles.town ? `, ${selectedNanny.profiles.town}` : ''}{selectedNanny.profiles.suburb ? `, ${selectedNanny.profiles.suburb}` : ''}
                  </p>
                  <div className="flex gap-4 mt-1">
                    <p className="text-xl font-semibold text-primary">R{selectedNanny.hourly_rate}/hour</p>
                    {selectedNanny.date_of_birth && (
                      <p className="text-lg text-muted-foreground">
                        Age: {new Date().getFullYear() - new Date(selectedNanny.date_of_birth).getFullYear()} years
                      </p>
                    )}
                  </div>
                  {selectedNanny.accommodation_preference && (
                    <p className="text-sm text-muted-foreground capitalize mt-1">
                      Prefers {selectedNanny.accommodation_preference.replace('_', ' ')} position
                    </p>
                  )}
                  
                  <div className="flex flex-wrap gap-2 mt-3">
                    {selectedNanny.academy_completed && (
                      <Badge variant="secondary">Academy Complete</Badge>
                    )}
                    {selectedNanny.criminal_check_status === 'approved' && (
                      <Badge variant="default">Criminal Check ✓</Badge>
                    )}
                    {selectedNanny.credit_check_status === 'approved' && (
                      <Badge variant="default">Credit Check ✓</Badge>
                    )}
                    {selectedNanny.profile_approved && (
                      <Badge variant="default">Profile Verified</Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Bio */}
              {selectedNanny.bio && (
                <div>
                  <h4 className="font-semibold mb-2">About Me</h4>
                  <p className="text-muted-foreground">{selectedNanny.bio}</p>
                </div>
              )}

              {/* Experience & Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Experience</h4>
                  <p className="capitalize">{selectedNanny.experience_type}</p>
                  {selectedNanny.experience_duration && (
                    <p className="text-sm text-muted-foreground">{selectedNanny.experience_duration} years</p>
                  )}
                </div>
                
                {selectedNanny.education_level && (
                  <div>
                    <h4 className="font-semibold mb-2">Education</h4>
                    <p className="capitalize">{selectedNanny.education_level}</p>
                  </div>
                )}
                
                {selectedNanny.languages.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Languages</h4>
                    <p>{selectedNanny.languages.join(', ')}</p>
                  </div>
                )}
              </div>

              {/* Training Certifications */}
              <div>
                <h4 className="font-semibold mb-2">Training & Certifications</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className={`flex items-center gap-2 ${selectedNanny.training_first_aid ? 'text-green-600' : 'text-muted-foreground'}`}>
                    {selectedNanny.training_first_aid ? <CheckCircle className="h-4 w-4" /> : <X className="h-4 w-4" />}
                    First Aid
                  </div>
                  <div className={`flex items-center gap-2 ${selectedNanny.training_cpr ? 'text-green-600' : 'text-muted-foreground'}`}>
                    {selectedNanny.training_cpr ? <CheckCircle className="h-4 w-4" /> : <X className="h-4 w-4" />}
                    CPR
                  </div>
                  <div className={`flex items-center gap-2 ${selectedNanny.training_nanny ? 'text-green-600' : 'text-muted-foreground'}`}>
                    {selectedNanny.training_nanny ? <CheckCircle className="h-4 w-4" /> : <X className="h-4 w-4" />}
                    Nanny Training
                  </div>
                  <div className={`flex items-center gap-2 ${selectedNanny.training_child_development ? 'text-green-600' : 'text-muted-foreground'}`}>
                    {selectedNanny.training_child_development ? <CheckCircle className="h-4 w-4" /> : <X className="h-4 w-4" />}
                    Child Development
                  </div>
                </div>
              </div>

              {/* Interview Video */}
              {selectedNanny.interview_video_url && (
                <div>
                  <h4 className="font-semibold mb-2">Introduction Video</h4>
                  <video
                    controls
                    className="w-full max-w-md rounded-lg"
                    src={selectedNanny.interview_video_url}
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              )}

              {/* Express Interest Section */}
              {user && hasRole && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2">Express Interest</h4>
                  <div className="space-y-3">
                    <textarea
                      className="w-full p-3 border rounded-md resize-none"
                      rows={3}
                      value={interestMessage}
                      onChange={(e) => setInterestMessage(e.target.value)}
                      placeholder="Tell the nanny about your family and what you're looking for..."
                    />
                    <Button 
                      onClick={handleExpressInterest} 
                      disabled={sendingInterest || !interestMessage.trim() || !canExpressInterest(selectedNanny.id)}
                      className="w-full"
                    >
                      {sendingInterest ? 'Sending...' : canExpressInterest(selectedNanny.id) ? 'Send Interest' : 'Interest Already Sent'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedNanny(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}