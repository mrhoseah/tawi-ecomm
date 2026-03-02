/**
 * Get tracking URL for a carrier and tracking number.
 * Supports common carriers used in e-commerce.
 */
export function getTrackingUrl(carrier: string | null | undefined, trackingNumber: string): string | null {
  if (!trackingNumber?.trim()) return null;

  const number = trackingNumber.trim();
  const c = (carrier || "").toLowerCase().replace(/\s+/g, "");

  if (c.includes("dhl")) {
    return `https://www.dhl.com/tracking?AWB=${encodeURIComponent(number)}`;
  }
  if (c.includes("fedex")) {
    return `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(number)}`;
  }
  if (c.includes("ups")) {
    return `https://www.ups.com/track?tracknum=${encodeURIComponent(number)}`;
  }
  if (c.includes("usps") || c.includes("unitedstatespostal")) {
    return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodeURIComponent(number)}`;
  }
  if (c.includes("dpd")) {
    return `https://www.dpd.com/tracking?parcelNumber=${encodeURIComponent(number)}`;
  }
  if (c.includes("royalmail") || c.includes("royal")) {
    return `https://www.royalmail.com/track-your-item#/tracking-results/${encodeURIComponent(number)}`;
  }
  if (c.includes("canadapost") || c.includes("canada")) {
    return `https://www.canadapost-postescanada.ca/track-reperage/en#/search?SearchFor=${encodeURIComponent(number)}`;
  }

  // Generic: return null so we just show the number
  return null;
}
