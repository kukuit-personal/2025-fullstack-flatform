"use client";

import { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import slugify from "slugify";
import { CurrencyEnum, CURRENCY_OPTIONS } from "../constants";

export default function StepInfo({
  setCurrency,
}: {
  setCurrency: (c: CurrencyEnum) => void;
}) {
  const {
    register,
    formState: { errors },
    watch,
    setValue,
  } = useFormContext();

  // Watch các field liên quan
  const nameValue = watch("name");

  // Auto-update slug liên tục theo name (options cố định)
  useEffect(() => {
    const gen = slugify(nameValue || "", {
      lower: true, // luôn về chữ thường
      strict: true, // loại ký tự đặc biệt
      locale: "vi", // hỗ trợ tiếng Việt
    });
    setValue("slug", gen, { shouldValidate: true, shouldDirty: true });
  }, [nameValue, setValue]);

  const Label = ({
    children,
    required,
  }: {
    children: React.ReactNode;
    required?: boolean;
  }) => (
    <label className="mb-1 block text-sm font-medium">
      {children}{" "}
      {required && (
        <span className="text-red-600" aria-label="required">
          *
        </span>
      )}
    </label>
  );

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm space-y-4">
      <div className="text-sm text-gray-600">2. Info</div>

      <div>
        <Label required>Name</Label>
        <input
          {...register("name", { required: "Name is required" })}
          className="w-full rounded-lg border px-3 py-2"
          placeholder="Promo Summer 2039"
        />
        {errors.name && (
          <p className="mt-1 text-xs text-red-600">
            {String(errors.name.message)}
          </p>
        )}
      </div>

      <div>
        <Label required>Slug</Label>
        <input
          {...register("slug", { required: "Slug is required" })}
          className="w-full rounded-lg border px-3 py-2"
          placeholder="promo-summer-2039"
        />
        {errors.slug && (
          <p className="mt-1 text-xs text-red-600">
            {String(errors.slug.message)}
          </p>
        )}
      </div>

      <div>
        <Label>Description</Label>
        <textarea
          {...register("description")}
          rows={3}
          className="w-full rounded-lg border px-3 py-2"
          placeholder="Landing promo email for summer campaign"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <Label required>Price</Label>
          <input
            type="number"
            {...register("price", {
              valueAsNumber: true,
              required: "Price is required",
            })}
            className="w-full rounded-lg border px-3 py-2"
            placeholder="5"
            min={0}
            step={0.01}
          />
          {errors.price && (
            <p className="mt-1 text-xs text-red-600">
              {String(errors.price.message)}
            </p>
          )}
        </div>
        <div>
          <Label required>Currency</Label>
          <select
            {...(register("currency", {
              required: "Currency is required",
            }) as any)}
            onChange={(e) => setCurrency(e.target.value as CurrencyEnum)}
            className="w-full rounded-lg border px-3 py-2"
          >
            {CURRENCY_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          {errors.currency && (
            <p className="mt-1 text-xs text-red-600">
              {String(errors.currency.message)}
            </p>
          )}
        </div>
      </div>

      <div>
        <Label>Customer</Label>
        <input
          {...register("customerId", {
            setValueAs: (v) => (v === "" ? null : v),
          })}
          className="w-full rounded-lg border px-3 py-2"
          placeholder="(optional) customer id"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          id="hasImages"
          type="checkbox"
          {...register("hasImages")}
          className="h-4 w-4"
        />
        <label htmlFor="hasImages" className="text-sm">
          Has images
        </label>
      </div>

      <p className="text-xs text-gray-500">
        Các trường có dấu <span className="text-red-600">*</span> là bắt buộc.
      </p>
    </div>
  );
}
