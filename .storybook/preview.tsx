import type { Decorator, Preview } from "@storybook/react";
import "../src/styles/globals.css";
import { MockAppProviders } from "./mock-providers";

const withProviders: Decorator = (Story, context) => (
  <MockAppProviders theme={String(context.globals.theme ?? "light")}>
    <div className="bg-background p-6 text-foreground">
      <Story />
    </div>
  </MockAppProviders>
);

const preview: Preview = {
  decorators: [withProviders],
  globalTypes: {
    theme: {
      description: "Color theme",
      defaultValue: "light",
      toolbar: {
        title: "Theme",
        items: [
          { value: "light", title: "Light" },
          { value: "dark", title: "Dark" },
        ],
        dynamicTitle: true,
      },
    },
  },
};

export default preview;
