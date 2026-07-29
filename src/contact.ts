import contactJson from "../brand/contact.json";

export const contact = contactJson;

export const phoneHref = `tel:${contact.phone.replace(/[^+\d]/g, "")}`;
export const emailHref = `mailto:${contact.email}`;

export const contactLine = (
  values: Array<string | null | undefined>,
  separator = " · ",
) => values.map((value) => value?.trim() ?? "").filter(Boolean).join(separator);

export const socialLinks = [
  {
    id: "instagram",
    label: "Instagram",
    handle: contact.handles.instagram,
    href: contact.links.instagram,
  },
  {
    id: "tiktok",
    label: "TikTok",
    handle: contact.handles.tiktok,
    href: contact.links.tiktok,
  },
  {
    id: "snapchat",
    label: "Snapchat",
    handle: contact.handles.snapchat,
    href: contact.links.snapchat,
  },
].filter((item) => item.handle.trim() && item.href.trim());
