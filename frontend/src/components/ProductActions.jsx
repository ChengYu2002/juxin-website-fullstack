import { useNavigate } from 'react-router-dom'

export default function ProductActions({ product, selectedVariant }) {
  const navigate = useNavigate()

  const handleContact = () => {
    // 用 querystring 预填 Contact 页
    const params = new URLSearchParams({
      productId: product.id,
      productName: product.name,
      variant: selectedVariant?.label ?? '',
    })

    navigate(`/contact?${params.toString()}`)
  }

  return (
    <div className="mt-5 flex gap-3">
      <button
        type="button"
        onClick={handleContact}
        className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition"
      >
        Contact for Quote
      </button>

    </div>
  )
}