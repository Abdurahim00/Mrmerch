"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useSelector } from "react-redux"
import { RootState } from "@/lib/redux/store"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Lock, Unlock, FlipHorizontal, FlipVertical, RotateCw } from "lucide-react"

export function ImagePropertiesPanel() {
  const fabricCanvas = useSelector((s: RootState) => (s.canvas as any).fabricCanvas)
  const selected = useSelector((s: RootState) => (s.canvas as any).selectedObject)
  const isImage = selected && selected.type === "image"

  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [size, setSize] = useState({ w: 0, h: 0 })
  const [angle, setAngle] = useState(0)
  const [flipX, setFlipX] = useState(false)
  const [flipY, setFlipY] = useState(false)
  const [lockAspect, setLockAspect] = useState(true)

  const natural = useMemo(() => {
    if (!isImage) return { w: 1, h: 1, ratio: 1 }
    const natW = selected.width || 1
    const natH = selected.height || 1
    return { w: natW, h: natH, ratio: natW / natH }
  }, [isImage, selected])

  const pullFromObject = useCallback(() => {
    if (!isImage) return
    const x = Math.round(selected.left || 0)
    const y = Math.round(selected.top || 0)
    const scaleX = selected.scaleX || 1
    const scaleY = selected.scaleY || 1
    const w = Math.round((selected.width || 0) * scaleX)
    const h = Math.round((selected.height || 0) * scaleY)
    const a = Math.round(selected.angle || 0)
    setPos({ x, y })
    setSize({ w, h })
    setAngle(a)
    setFlipX(Boolean(selected.flipX))
    setFlipY(Boolean(selected.flipY))
  }, [isImage, selected])

  useEffect(() => {
    pullFromObject()
    if (!fabricCanvas) return
    const rerender = () => pullFromObject()
    fabricCanvas.on("object:modified", rerender)
    fabricCanvas.on("selection:updated", rerender)
    fabricCanvas.on("selection:created", rerender)
    return () => {
      fabricCanvas.off("object:modified", rerender)
      fabricCanvas.off("selection:updated", rerender)
      fabricCanvas.off("selection:created", rerender)
    }
  }, [fabricCanvas, pullFromObject])

  const apply = useCallback(
    (next: Partial<{ x: number; y: number; w: number; h: number; angle: number; flipX: boolean; flipY: boolean }>) => {
      if (!fabricCanvas || !isImage) return
      const obj = selected
      const n = { x: pos.x, y: pos.y, w: size.w, h: size.h, angle, flipX, flipY, ...next }

      // Position
      obj.set({ left: n.x, top: n.y })

      // Size via scale based on natural dimensions
      const scaleX = n.w / (natural.w || 1)
      const scaleY = n.h / (natural.h || 1)
      obj.set({ scaleX, scaleY })

      // Rotation
      obj.set({ angle: n.angle })

      // Flip
      obj.set({ flipX: n.flipX, flipY: n.flipY })

      fabricCanvas.requestRenderAll()
    },
    [fabricCanvas, isImage, selected, pos, size, angle, flipX, flipY, natural]
  )

  if (!isImage) return null

  return (
    <Card className="mx-3 my-3 border-slate-200">
      <CardContent className="p-3 space-y-3">
        {/* Position */}
        <div className="flex flex-col gap-2 ">
          <div>
            <Label className="text-xs text-slate-500">Position</Label>
            <div className="flex gap-2">
              <div>
                <Input
                  type="number"
                  value={pos.x}
                  onChange={(e) => {
                    const nx = Number(e.target.value) || 0
                    setPos((p) => ({ ...p, x: nx }))
                    apply({ x: nx })
                  }}
                  inputMode="numeric"
                />
                <div className="text-[10px] text-center text-slate-400 mt-1">X</div>
              </div>
              <div>
                <Input
                  type="number"
                  value={pos.y}
                  onChange={(e) => {
                    const ny = Number(e.target.value) || 0
                    setPos((p) => ({ ...p, y: ny }))
                    apply({ y: ny })
                  }}
                  inputMode="numeric"
                />
                <div className="text-[10px] text-center text-slate-400 mt-1">Y</div>
              </div>
            </div>
          </div>

          {/* Size */}
          <div>
            <Label className="text-xs text-slate-500">Size</Label>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Input
                  type="number"
                  value={size.w}
                  onChange={(e) => {
                    const w = Number(e.target.value) || 0
                    if (lockAspect) {
                      const h = Math.round(w / (natural.ratio || 1))
                      setSize({ w, h })
                      apply({ w, h })
                    } else setSize({ ...size, w })
                    apply({ w, h: size.h })
                  }}
                  inputMode="numeric"
                />
                <div className="text-[10px] text-center text-slate-400 mt-1">Width</div>
              </div>
              <button 
                className="flex items-center justify-center p-0 text-slate-500 hover:text-slate-700 transition-colors mt-[-18px]" 
                onClick={() => setLockAspect(!lockAspect)} 
                type="button"
                title={lockAspect ? "Unlock aspect ratio" : "Lock aspect ratio"}
              >
                {lockAspect ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
              </button>
              <div className="flex-1">
                <Input
                  type="number"
                  value={size.h}
                  onChange={(e) => {
                    const h = Number(e.target.value) || 0
                    if (lockAspect) {
                      const w = Math.round(h * (natural.ratio || 1))
                      setSize({ w, h })
                      apply({ w, h })
                    } else setSize({ ...size, h })
                    apply({ w: size.w, h })
                  }}
                  inputMode="numeric"
                />
                <div className="text-[10px] text-center text-slate-400 mt-1">Height</div>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Transform */}
        <div>
          <Label className="text-xs text-slate-500">Transform</Label>
          <div className="flex flex-col gap-2 ">
            <div>
              <Input
                type="number"
                value={angle}
                onChange={(e) => {
                  const a = Number(e.target.value) || 0
                  setAngle(a)
                  apply({ angle: a })
                }}
                inputMode="numeric"
              />
              <div className="text-[10px] text-center text-slate-400 mt-1">Rotate</div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => { setFlipX(!flipX); apply({ flipX: !flipX }) }}>
                <FlipHorizontal className="w-4 h-4 mr-1" /> Flip X
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => { setFlipY(!flipY); apply({ flipY: !flipY }) }}>
                <FlipVertical className="w-4 h-4 mr-1" /> Flip Y
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}


