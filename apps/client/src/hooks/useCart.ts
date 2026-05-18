import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { addToCart, fetchCart, removeCartLine, updateCartLine } from "../services/cart"
import { useCartStore } from "../stores/cartStore"
import { useAuth } from "../types/auth-context"

export const useCart = () => {
  const { accessToken } = useAuth()
  const queryClient = useQueryClient()
  const touch = useCartStore((s) => s.touch)

  const query = useQuery({
    queryKey: ["cart"],
    queryFn: fetchCart,
    enabled: !!accessToken,
  })

  const invalidate = () => {
    touch()
    void queryClient.invalidateQueries({ queryKey: ["cart"] })
  }

  const addItem = useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) => addToCart(productId, quantity),
    onSuccess: invalidate,
  })

  const setQty = useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) => updateCartLine(productId, quantity),
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: (productId: string) => removeCartLine(productId),
    onSuccess: invalidate,
  })

  return {
    ...query,
    addItem: addItem.mutateAsync,
    setQty: setQty.mutateAsync,
    removeLine: remove.mutateAsync,
    isUpdating: addItem.isPending || setQty.isPending || remove.isPending,
  }
}
