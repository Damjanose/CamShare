import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { fetchNotifications, markAllNotificationsRead, markNotificationRead } from "../services/notifications"

export const NotificationsPage = () => {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ["notifications"], queryFn: fetchNotifications })

  const markOne = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  })

  const markAll = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  })

  if (isLoading) return <div className="alert alert-info">Loading…</div>

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-body p-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h1 className="h3 fw-bold mb-0">Notifications</h1>
          <button type="button" className="btn btn-sm btn-outline-secondary" disabled={markAll.isPending} onClick={() => void markAll.mutateAsync()}>
            Mark all read
          </button>
        </div>
        <div className="list-group">
          {data?.map((n) => (
            <button
              type="button"
              key={n.id}
              className={`list-group-item list-group-item-action text-start ${n.readAt ? "" : "fw-semibold"}`}
              onClick={() => {
                if (!n.readAt) void markOne.mutateAsync(n.id)
              }}
            >
              <div className="d-flex justify-content-between">
                <span>{n.title}</span>
                <time className="small text-secondary">{new Date(n.createdAt).toLocaleString()}</time>
              </div>
              {n.body && <div className="small text-secondary">{n.body}</div>}
            </button>
          ))}
        </div>
        {data?.length === 0 && <p className="text-secondary mb-0">You are all caught up.</p>}
      </div>
    </div>
  )
}
