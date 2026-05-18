import type { OrderStatusEventDto } from "@jewellery/types"

export const OrderTimeline = ({ events }: { events: OrderStatusEventDto[] }) => (
  <ul className="list-group list-group-flush">
    {events.map((e) => (
      <li key={e.id} className="list-group-item d-flex justify-content-between align-items-start">
        <div>
          <div className="fw-semibold text-capitalize">{e.status}</div>
          {e.note && <div className="small text-secondary">{e.note}</div>}
        </div>
        <time className="small text-secondary text-nowrap ms-2">{new Date(e.createdAt).toLocaleString()}</time>
      </li>
    ))}
  </ul>
)
