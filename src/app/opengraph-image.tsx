import { ImageResponse } from "next/og";
import { site } from "~/shared/config/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Social card generated from the site config; page-specific cards override per route. */
export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: 80,
        background: "rgb(24, 24, 27)",
        color: "rgb(250, 250, 250)",
      }}
    >
      <div style={{ fontSize: 72, fontWeight: 800 }}>{site.name}</div>
      <div style={{ fontSize: 32, marginTop: 16, color: "rgb(161, 161, 170)" }}>{site.tagline}</div>
    </div>,
    { ...size },
  );
}
