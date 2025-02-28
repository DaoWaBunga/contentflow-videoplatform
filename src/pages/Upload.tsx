
import { useState, useRef } from "react";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, Upload as UploadIcon, ImageIcon, FileVideo, AlertCircle, Tag, Filter } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CATEGORIES } from "./Discover";

// File size limits in bytes
const IMAGE_SIZE_LIMIT = 5 * 1024 * 1024; // 5MB
const VIDEO_SIZE_LIMIT = 50 * 1024 * 1024; // 50MB

const Upload = () => {
  // URL upload states
  const [embedUrl, setEmbedUrl] = useState("");
  const [title, setTitle] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [category, setCategory] = useState("");
  
  // File upload states
  const [file, setFile] = useState<File | null>(null);
  const [fileTitle, setFileTitle] = useState("");
  const [fileCategory, setFileCategory] = useState("");
  const [fileType, setFileType] = useState<"image" | "video" | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Validate file type and size
  const validateFile = (file: File): boolean => {
    setValidationError(null);

    // Check file type
    const imageTypes = ['image/jpeg', 'image/png', 'image/gif'];
    const videoTypes = ['video/mp4', 'video/quicktime', 'video/webm'];
    
    if (imageTypes.includes(file.type)) {
      setFileType("image");
      // Check image size
      if (file.size > IMAGE_SIZE_LIMIT) {
        setValidationError(`Image size exceeds 5MB limit (${(file.size / (1024 * 1024)).toFixed(2)}MB)`);
        return false;
      }
    } else if (videoTypes.includes(file.type)) {
      setFileType("video");
      // Check video size
      if (file.size > VIDEO_SIZE_LIMIT) {
        setValidationError(`Video size exceeds 50MB limit (${(file.size / (1024 * 1024)).toFixed(2)}MB)`);
        return false;
      }
    } else {
      setValidationError("Unsupported file format. Please upload JPEG, PNG, GIF, MP4, MOV, or WebM files.");
      return false;
    }

    return true;
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    if (validateFile(selectedFile)) {
      setFile(selectedFile);
      // Use the file name (without extension) as the default title
      const fileName = selectedFile.name.split('.').slice(0, -1).join('.');
      setFileTitle(fileName);
    } else {
      // Reset file input if validation fails
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Category management functions
  const toggleUrlCategory = (selectedCategory: string) => {
    setCategory(prev => prev === selectedCategory ? "" : selectedCategory);
  };

  const toggleFileCategory = (selectedCategory: string) => {
    setFileCategory(prev => prev === selectedCategory ? "" : selectedCategory);
  };

  const clearUrlCategory = () => {
    setCategory("");
  };

  const clearFileCategory = () => {
    setFileCategory("");
  };

  // Handle URL submission
  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!embedUrl || !title) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please fill in all required fields",
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to upload",
      });
      return;
    }

    try {
      // Insert into database
      const { data: mediaData, error: mediaError } = await supabase
        .from('videos')
        .insert({
          title,
          url: embedUrl,
          thumbnail_url: thumbnailUrl || null,
          user_id: user.id,
          category: category || null
        })
        .select()
        .single();

      if (mediaError) throw mediaError;

      // Reward tokens for the upload
      const { error: rewardError } = await supabase.rpc('reward_upload_tokens', {
        user_id: user.id,
        is_video: embedUrl.includes('youtube.com') || embedUrl.includes('youtu.be')
      });

      if (rewardError) throw rewardError;

      toast({
        title: "Success",
        description: "Your content has been uploaded and you've earned tokens!",
      });

      // Reset form and redirect to profile
      setEmbedUrl("");
      setThumbnailUrl("");
      setTitle("");
      setCategory("");
      navigate("/profile");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  // Handle file upload
  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file || !fileTitle) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please select a file and provide a title",
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to upload",
      });
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Create a filename that's unique
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;
      
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(fileType === "image" ? "images" : "videos")
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get the public URL for the uploaded file
      const { data: publicUrlData } = supabase.storage
        .from(fileType === "image" ? "images" : "videos")
        .getPublicUrl(filePath);

      const publicUrl = publicUrlData.publicUrl;
      
      // Insert into the videos table
      const { data: mediaData, error: mediaError } = await supabase
        .from('videos')
        .insert({
          title: fileTitle,
          url: publicUrl,
          user_id: user.id,
          category: fileCategory || null
        })
        .select()
        .single();

      if (mediaError) throw mediaError;

      // Reward tokens for the upload
      const { error: rewardError } = await supabase.rpc('reward_upload_tokens', {
        user_id: user.id,
        is_video: fileType === "video"
      });

      if (rewardError) throw rewardError;

      toast({
        title: "Success",
        description: "Your file has been uploaded and you've earned tokens!",
      });

      // Reset form and redirect to profile
      setFile(null);
      setFileTitle("");
      setFileType(null);
      setFileCategory("");
      setUploadProgress(100);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      navigate("/profile");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-card text-foreground pb-16">
      <Header />
      <main className="max-w-lg mx-auto pt-20 px-4">
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Upload Content</h1>
            <p className="text-muted-foreground">
              Share your videos, images, or embed links
            </p>
          </div>
          
          <Tabs defaultValue="url" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="url">URL / Embed</TabsTrigger>
              <TabsTrigger value="file">File Upload</TabsTrigger>
            </TabsList>
            
            <TabsContent value="url" className="mt-4">
              <form onSubmit={handleUrlSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="Give your content a title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="embedUrl">Content URL</Label>
                  <div className="relative">
                    <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      id="embedUrl"
                      placeholder="YouTube, Imgur, or direct media URL"
                      value={embedUrl}
                      onChange={(e) => setEmbedUrl(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Supports YouTube, Imgur, and direct image/video links
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="thumbnailUrl">Thumbnail URL (optional)</Label>
                  <div className="relative">
                    <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      id="thumbnailUrl"
                      placeholder="Paste your thumbnail link here"
                      value={thumbnailUrl}
                      onChange={(e) => setThumbnailUrl(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <div className="flex justify-between items-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="flex items-center gap-2">
                          <Filter className="h-4 w-4" />
                          {category ? category : "Select a category"}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-56">
                        <DropdownMenuLabel>Select a category</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {CATEGORIES.map(cat => (
                          <DropdownMenuCheckboxItem
                            key={cat}
                            checked={category === cat}
                            onCheckedChange={() => toggleUrlCategory(cat)}
                          >
                            {cat}
                          </DropdownMenuCheckboxItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={clearUrlCategory}>
                          Clear selection
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    
                    {category && (
                      <Button variant="ghost" size="sm" onClick={clearUrlCategory}>
                        Clear
                      </Button>
                    )}
                  </div>
                  
                  {category && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge 
                        variant="secondary"
                        className="px-2 py-1 flex items-center gap-1"
                      >
                        {category}
                        <button 
                          className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                          onClick={clearUrlCategory}
                        >
                          <span className="sr-only">Remove</span>
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 3L3 9M3 3L9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      </Badge>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full py-2 px-4 bg-primary hover:bg-primary/90 text-white rounded-lg flex items-center justify-center space-x-2 transition-colors"
                >
                  <UploadIcon className="h-5 w-5" />
                  <span>Upload Content</span>
                </button>
              </form>
            </TabsContent>
            
            <TabsContent value="file" className="mt-4">
              <form onSubmit={handleFileUpload} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="fileTitle">Title</Label>
                  <Input
                    id="fileTitle"
                    placeholder="Give your content a title"
                    value={fileTitle}
                    onChange={(e) => setFileTitle(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="file">File</Label>
                  <div 
                    className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {file ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-center">
                          {fileType === "image" ? (
                            <ImageIcon className="h-12 w-12 text-primary" />
                          ) : (
                            <FileVideo className="h-12 w-12 text-primary" />
                          )}
                        </div>
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(file.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center justify-center">
                          <UploadIcon className="h-12 w-12 text-muted-foreground/50" />
                        </div>
                        <p className="font-medium">Drag and drop or click to upload</p>
                        <p className="text-sm text-muted-foreground">
                          Images (JPEG, PNG, GIF) - max 5MB<br />
                          Videos (MP4, MOV, WebM) - max 50MB
                        </p>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      id="file"
                      className="hidden"
                      accept=".jpg,.jpeg,.png,.gif,.mp4,.mov,.webm"
                      onChange={handleFileChange}
                    />
                  </div>
                  
                  {validationError && (
                    <Alert variant="destructive" className="mt-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{validationError}</AlertDescription>
                    </Alert>
                  )}
                  
                  {isUploading && (
                    <div className="space-y-2 mt-4">
                      <div className="flex justify-between">
                        <span className="text-sm">Uploading...</span>
                        <span className="text-sm">{Math.round(uploadProgress)}%</span>
                      </div>
                      <Progress value={uploadProgress} className="h-2" />
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="fileCategory">Category</Label>
                  <div className="flex justify-between items-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="flex items-center gap-2">
                          <Filter className="h-4 w-4" />
                          {fileCategory ? fileCategory : "Select a category"}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-56">
                        <DropdownMenuLabel>Select a category</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {CATEGORIES.map(cat => (
                          <DropdownMenuCheckboxItem
                            key={cat}
                            checked={fileCategory === cat}
                            onCheckedChange={() => toggleFileCategory(cat)}
                          >
                            {cat}
                          </DropdownMenuCheckboxItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={clearFileCategory}>
                          Clear selection
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    
                    {fileCategory && (
                      <Button variant="ghost" size="sm" onClick={clearFileCategory}>
                        Clear
                      </Button>
                    )}
                  </div>
                  
                  {fileCategory && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge 
                        variant="secondary"
                        className="px-2 py-1 flex items-center gap-1"
                      >
                        {fileCategory}
                        <button 
                          className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                          onClick={clearFileCategory}
                        >
                          <span className="sr-only">Remove</span>
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 3L3 9M3 3L9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      </Badge>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!file || isUploading || !!validationError}
                  className="w-full py-2 px-4 bg-primary hover:bg-primary/90 disabled:bg-primary/50 disabled:cursor-not-allowed text-white rounded-lg flex items-center justify-center space-x-2 transition-colors"
                >
                  <UploadIcon className="h-5 w-5" />
                  <span>{isUploading ? "Uploading..." : "Upload File"}</span>
                </button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <BottomNav />
    </div>
  );
};

export default Upload;
