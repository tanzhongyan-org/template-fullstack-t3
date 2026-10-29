import { ImageResponse } from "next/og";
import { site } from "~/shared/config/site";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Apple touch icon generated from the site config. */
export default function AppleIcon() {
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
        fontSize: 110,
        fontWeight: 800,
      }}
    >
      {site.name.slice(0, 1)}
    </div>,
    { ...size },
  );
}
