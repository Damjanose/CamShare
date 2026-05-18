import { useState } from "react"
import type { ProductImage } from "@jewellery/types"

export const ProductGallery = ({ images, alt }: { images: ProductImage[]; alt: string }) => {
  const [idx, setIdx] = useState(0)
  const main = images[idx]?.url ?? "https://placehold.co/600x600?text=No+image"
  return (
    <div className="row g-3">
      <div className="col-12">
        <div className="ratio ratio-1x1 bg-body-secondary rounded-3 overflow-hidden shadow-sm">
          <img src={main} alt={alt} className="object-fit-cover w-100 h-100" />
        </div>
      </div>
      {images.length > 1 && (
        <div className="col-12 d-flex gap-2 flex-wrap">
          {images.map((im, i) => (
            <button
              type="button"
              key={im.id}
              className={`btn p-0 border-0 bg-transparent rounded-2 ${i === idx ? "border border-2 border-primary" : ""}`}
              onClick={() => setIdx(i)}
            >
              <img src={im.url} alt="" className="rounded-2" style={{ width: 72, height: 72, objectFit: "cover" }} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
