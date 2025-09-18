"use client";
import Image from "next/image";
import Link from "next/link";
import { formatDate, formatPrice } from "../utils";

export function TemplateCard({
  template,
  onPreview,
}: {
  template: any;
  onPreview: (url: string | null) => void;
}) {
  const t = template;
  const isAdmin = (t.creatorName ?? "").toLowerCase().includes("admin");
  return (
    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
      <div className="aspect-video relative bg-gray-50">
        {t.thumbnailUrl ? (
          <Image
            src={t.thumbnailUrl}
            alt={t.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-xs text-gray-400">
            No thumbnail
          </div>
        )}
      </div>

      <div className="p-4 flex items-center justify-between">
        <div>
          <div className="font-medium line-clamp-1">{t.name}</div>
          <div className="text-xs text-gray-500">
            Updated {formatDate(t.updatedAt)}
          </div>

          <div className="mt-1">
            <span className="text-xs text-gray-500">Created by</span>{" "}
            <span
              className={
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ring-1 " +
                (isAdmin
                  ? "bg-indigo-50 text-indigo-700 ring-indigo-200"
                  : "bg-amber-50 text-amber-700 ring-amber-200")
              }
            >
              {t.creatorName ?? "—"}
            </span>
          </div>

          {t.tags?.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {t.tags.slice(0, 3).map((tg: string) => (
                <span
                  key={tg}
                  className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 ring-1 ring-gray-200"
                >
                  {tg}
                </span>
              ))}
              {t.tags.length > 3 && (
                <span className="text-[10px] text-gray-500">
                  +{t.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {t.price != null && (
            <div className="text-md text-gray-500">{formatPrice(t.price)}</div>
          )}
          <button
            onClick={() => t.thumbnailUrl && onPreview(t.thumbnailUrl)}
            className="px-3 py-1.5 rounded-xl bg-gray-700 text-white text-sm"
          >
            View
          </button>
          <Link
            href={`/admin/templates/${t.id}/edit`}
            className="px-3 py-1.5 rounded-xl bg-black text-white text-sm"
          >
            Edit
          </Link>
        </div>
      </div>
    </div>
  );
}
