"use client";

// Latest shop orders; status updates arrive live (payment webhook → paid → shipped → delivered).
import type { LucideIcon } from "lucide-react";
import { CircleCheck, CircleX, Clock, ExternalLink, Package, ShoppingBag, Truck, Undo2 } from "lucide-react";
import type { OrderStatus, OrderSummary, SectionState } from "@/lib/dashboard/types";
import { formatMnt, shortDate, type DashboardCopy } from "@/lib/dashboard/copy";
import SectionCard from "./SectionCard";

const STATUS: Record<OrderStatus, { icon: LucideIcon; cls: string }> = {
  pending_payment: { icon: Clock, cls: "bg-amber-400/10 text-amber-300" },
  paid: { icon: CircleCheck, cls: "bg-sky-400/10 text-sky-300" },
  fulfilling: { icon: Package, cls: "bg-sky-400/10 text-sky-300" },
  shipped: { icon: Truck, cls: "bg-sky-400/10 text-sky-300" },
  delivered: { icon: CircleCheck, cls: "bg-emerald-400/10 text-emerald-300" },
  cancelled: { icon: CircleX, cls: "bg-white/[0.07] text-white/70" },
  refunded: { icon: Undo2, cls: "bg-white/[0.07] text-white/70" },
};

interface Props {
  state: SectionState<OrderSummary[]>;
  copy: DashboardCopy;
  onRetry?: () => void;
  className?: string;
}

export default function OrderHistory({ state, copy, onRetry, className }: Props) {
  return (
    <SectionCard title={copy.orders.title} icon={ShoppingBag} state={state} copy={copy} onRetry={onRetry} skeletonHeight={200} className={className}>
      {(orders) =>
        orders.length === 0 ? (
          <p className="py-8 text-center text-[13px] text-white/60">{copy.orders.empty}</p>
        ) : (
          <ul className="divide-y divide-white/[0.05]">
            {orders.map((o) => <OrderRow key={o.id} o={o} copy={copy} />)}
          </ul>
        )
      }
    </SectionCard>
  );
}

function OrderRow({ o, copy }: { o: OrderSummary; copy: DashboardCopy }) {
  const st = STATUS[o.status];
  const first = o.items[0];
  const extra = o.items.length - 1;
  return (
    <li className="py-3 first:pt-0 last:pb-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-white">
            {first ? first.title : o.id}
            {extra > 0 ? <span className="ml-1.5 font-normal text-white/60">{copy.orders.more(extra)}</span> : null}
          </p>
          <p className="mt-0.5 truncate text-[12px] text-white/55">
            <span className="tabular-nums">{shortDate(o.createdAt)}</span> · {o.id}
            {first?.variant ? ` · ${first.variant}` : ""}
          </p>
        </div>
        <span className="shrink-0 text-[14px] font-bold tabular-nums text-white">{formatMnt(o.total.amount)}</span>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${st.cls}`}>
          <st.icon size={12} aria-hidden />
          {copy.orderStatus[o.status]}
        </span>
        {o.trackingUrl && o.status === "shipped" ? (
          <a
            href={o.trackingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-10 items-center gap-1 rounded-[10px] px-2 text-[12px] font-semibold text-white/80 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-[#FF3B30]"
          >
            {copy.orders.track} <ExternalLink size={12} aria-hidden />
          </a>
        ) : null}
      </div>
    </li>
  );
}
