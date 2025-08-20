"use client"

import { useState } from "react"
import { useSelector } from "react-redux"
import { useRouter, useSearchParams } from "next/navigation"
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy, Check, Instagram, Facebook, Linkedin, MessageCircle, X } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { RootState } from "@/lib/redux/store"

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ShareModal({ isOpen, onClose }: ShareModalProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)
  
  // Get design data from Redux store
  const { selectedProduct, selectedTemplate } = useSelector((state: RootState) => state.design)
  
  // Generate the current design page URL
  const generateShareUrl = () => {
    const baseUrl = window.location.origin
    const currentPath = window.location.pathname
    const designId = searchParams.get('designId')
    
    if (designId) {
      return `${baseUrl}${currentPath}?designId=${designId}`
    }
    return `${baseUrl}${currentPath}`
  }

  const shareUrl = generateShareUrl()
  
  // Generate dynamic share text based on what's selected
  const generateShareText = () => {
    if (selectedProduct) {
      if (selectedTemplate) {
        return `Check out my ${selectedProduct.name} design using the ${selectedTemplate.name} template!`
      }
      return `Check out my ${selectedProduct.name} design!`
    }
    return "Check out my amazing design!"
  }

  const shareText = generateShareText()

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      toast({
        title: "Link Copied!",
        description: "Design link has been copied to clipboard",
        variant: "default",
        className: "bg-green-50 border-green-200 text-green-800"
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually",
        variant: "destructive"
      })
    }
  }

  const handleSocialShare = (platform: string) => {
    let shareUrl = ""
    
    switch (platform) {
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(generateShareUrl())}&quote=${encodeURIComponent(shareText)}`
        break
      case "linkedin":
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(generateShareUrl())}`
        break
      case "whatsapp":
        shareUrl = `https://wa.me/?text=${encodeURIComponent(shareText + " " + generateShareUrl())}`
        break
      case "instagram":
        // Instagram doesn't support direct link sharing, so we'll copy the link and show instructions
        handleCopyLink()
        toast({
          title: "Instagram Sharing",
          description: "Link copied! Paste it in your Instagram bio or story",
          variant: "default",
          className: "bg-purple-50 border-purple-200 text-purple-800"
        })
        return
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400,scrollbars=yes,resizable=yes')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Share Your Design
            </DialogTitle>
          </div>
          <DialogDescription className="text-gray-600">
            Share your amazing design with friends and on social media
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Social Media Icons */}
          <div className="space-y-4">
            <Label className="text-sm font-medium text-gray-700">Share on Social Media</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => handleSocialShare("facebook")}
                variant="outline"
                className="h-16 flex flex-col items-center justify-center space-y-2 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
              >
                <Facebook className="w-6 h-6 text-blue-600" />
                <span className="text-xs font-medium text-blue-600">Facebook</span>
              </Button>
              
              <Button
                onClick={() => handleSocialShare("linkedin")}
                variant="outline"
                className="h-16 flex flex-col items-center justify-center space-y-2 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
              >
                <Linkedin className="w-6 h-6 text-blue-700" />
                <span className="text-xs font-medium text-blue-700">LinkedIn</span>
              </Button>
              
              <Button
                onClick={() => handleSocialShare("instagram")}
                variant="outline"
                className="h-16 flex flex-col items-center justify-center space-y-2 hover:bg-pink-50 hover:border-pink-300 transition-all duration-200"
              >
                <Instagram className="w-6 h-6 text-pink-600" />
                <span className="text-xs font-medium text-pink-600">Instagram</span>
              </Button>
              
              <Button
                onClick={() => handleSocialShare("whatsapp")}
                variant="outline"
                className="h-16 flex flex-col items-center justify-center space-y-2 hover:bg-green-50 hover:border-green-300 transition-all duration-200"
              >
                <MessageCircle className="w-6 h-6 text-green-600" />
                <span className="text-xs font-medium text-green-600">WhatsApp</span>
              </Button>
            </div>
          </div>

          {/* Copy Link Section */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-700">Or copy the link</Label>
            <div className="flex space-x-2">
              <Input
                value={shareUrl}
                readOnly
                className="flex-1 text-sm bg-gray-50"
              />
              <Button
                onClick={handleCopyLink}
                variant="outline"
                size="sm"
                className="px-3 hover:bg-green-50 hover:border-green-300 transition-all duration-200"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-200">
          <Button
            onClick={onClose}
            variant="ghost"
            className="text-gray-600 hover:text-gray-800"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
