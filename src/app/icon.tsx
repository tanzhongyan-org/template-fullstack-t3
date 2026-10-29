import { ImageResponse } from "next/og";
import { site } from "~/shared/config/site";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

/** App icon generated from the site config; TEMPLATE-BRAND(icon) replaces the letter. */
export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgb(24, 24, 27)",
        color: "rgb(250, 250, 250)",
        fontSize: 40,
        fontWeight: 800,
        borderRadius: 14,
      }}
    >
      {site.name.slice(0, 1)}
    </div>,
    { ...size },
  );
}
