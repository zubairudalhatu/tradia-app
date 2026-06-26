"use client";

import { track } from "@vercel/analytics";
import Link from "next/link";
import type { ComponentProps, FormEvent, FormEventHandler } from "react";

type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>;

type AnalyticsLinkProps = ComponentProps<typeof Link> & {
  eventName: string;
  eventProperties?: AnalyticsProperties;
};

type AnalyticsFormProps = Omit<ComponentProps<"form">, "onSubmit"> & {
  eventName: string;
  eventProperties?: AnalyticsProperties;
  eventFields?: string[];
  eventCheckboxFields?: string[];
  onSubmit?: FormEventHandler<HTMLFormElement>;
};

export function trackTradiaEvent(eventName: string, properties: AnalyticsProperties = {}) {
  track(eventName, cleanProperties(properties));
}

export function AnalyticsLink({ eventName, eventProperties, onClick, ...props }: AnalyticsLinkProps) {
  return (
    <Link
      {...props}
      onClick={(event) => {
        trackTradiaEvent(eventName, eventProperties);
        onClick?.(event);
      }}
    />
  );
}

export function AnalyticsForm({
  eventName,
  eventProperties,
  eventFields = [],
  eventCheckboxFields = [],
  onSubmit,
  ...props
}: AnalyticsFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const formData = new FormData(event.currentTarget);
    const fieldProperties = Object.fromEntries(
      eventFields.map((field) => [field, String(formData.get(field) ?? "").trim() || null])
    );
    const checkboxProperties = Object.fromEntries(
      eventCheckboxFields.map((field) => [field, formData.get(field) !== null])
    );

    trackTradiaEvent(eventName, {
      ...eventProperties,
      ...fieldProperties,
      ...checkboxProperties
    });
    onSubmit?.(event);
  }

  return <form {...props} onSubmit={handleSubmit} />;
}

function cleanProperties(properties: AnalyticsProperties) {
  return Object.fromEntries(
    Object.entries(properties).filter(([, value]) => value !== undefined && value !== "")
  ) as Record<string, string | number | boolean | null>;
}
