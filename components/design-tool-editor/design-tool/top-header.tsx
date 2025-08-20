"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Phone, Share2, Palette, Sparkles } from "lucide-react"
import { ShareModal } from "./modals/share-modal"

export function TopHeader() {
  const [showShareModal, setShowShareModal] = useState(false)

  return (
    <>
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
        {/* Right - Actions only */}
        <div className="flex items-center space-x-2 ml-auto">
    
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex items-center space-x-2 hover:bg-gray-100 transition-all duration-200 rounded-lg"
            onClick={() => setShowShareModal(true)}
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline text-sm">Share</span>
          </Button>
          
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal 
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
      />
    </>
  )
}
