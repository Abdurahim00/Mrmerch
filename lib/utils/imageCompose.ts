/**
 * Client-side image composition utility to merge a base product image with a design overlay PNG.
 * Returns a PNG data URL suitable for cart/checkout previews and persisting into orders.
 */

export interface ComposeOptions {
	/** Base product image URL */
	productImageUrl: string
	/** Transparent PNG overlay URL (design elements) */
	overlayImageUrl: string
	/** Target canvas width in pixels (height auto-calculated by product image aspect ratio) */
	targetWidth?: number
	/** Overlay scale factor relative to composed canvas size (0..1). Default 0.6 */
	overlayScale?: number
}

function loadImage(url: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const img = new Image()
		img.crossOrigin = "anonymous"
		img.onload = () => resolve(img)
		img.onerror = reject
		img.src = url
	})
}

/**
 * Compose a base product image with a design overlay.
 * The product image is drawn to fit within the canvas with margin; overlay centered and scaled.
 */
export async function composeProductAndDesign({
	productImageUrl,
	overlayImageUrl,
	targetWidth = 1000,
	overlayScale = 0.6,
}: ComposeOptions): Promise<string> {
	try {
		// Load images in parallel
		const [productImg, overlayImg] = await Promise.all([
			loadImage(productImageUrl),
			loadImage(overlayImageUrl),
		])

		// Maintain product aspect ratio. Use a square canvas bias if ratio unknown extremes.
		const productAspect = productImg.width > 0 && productImg.height > 0
			? productImg.width / productImg.height
			: 1
		const marginFactor = 0.1 // 10% outer margin for better presentation
		const targetHeight = Math.round(targetWidth / productAspect)

		const canvas = document.createElement("canvas")
		canvas.width = targetWidth
		canvas.height = targetHeight
		const ctx = canvas.getContext("2d")
		if (!ctx) throw new Error("Canvas 2D context not available")

		// Background white for consistent preview; printers can ignore.
		ctx.fillStyle = "#ffffff"
		ctx.fillRect(0, 0, canvas.width, canvas.height)

		// Draw product image fitted with margin
		const innerWidth = canvas.width * (1 - 2 * marginFactor)
		const innerHeight = canvas.height * (1 - 2 * marginFactor)
		const scaleToFit = Math.min(innerWidth / productImg.width, innerHeight / productImg.height)
		const prodW = productImg.width * scaleToFit
		const prodH = productImg.height * scaleToFit
		const prodX = (canvas.width - prodW) / 2
		const prodY = (canvas.height - prodH) / 2
		ctx.drawImage(productImg, prodX, prodY, prodW, prodH)

		// Draw overlay centered with specified scale (relative to canvas)
		const overlayMaxW = canvas.width * overlayScale
		const overlayMaxH = canvas.height * overlayScale
		const overlayScaleFactor = Math.min(overlayMaxW / overlayImg.width, overlayMaxH / overlayImg.height)
		const ovW = overlayImg.width * overlayScaleFactor
		const ovH = overlayImg.height * overlayScaleFactor
		const ovX = (canvas.width - ovW) / 2
		const ovY = (canvas.height - ovH) / 2
		ctx.drawImage(overlayImg, ovX, ovY, ovW, ovH)

		return canvas.toDataURL("image/png")
	} catch (e) {
		// On failure, fall back to the overlay itself; better than nothing.
		try {
			const overlay = await loadImage(overlayImageUrl)
			const canvas = document.createElement("canvas")
			canvas.width = overlay.width
			canvas.height = overlay.height
			const ctx = canvas.getContext("2d")
			if (!ctx) throw new Error("Canvas 2D context not available")
			ctx.drawImage(overlay, 0, 0)
			return canvas.toDataURL("image/png")
		} catch {
			return overlayImageUrl
		}
	}
}


