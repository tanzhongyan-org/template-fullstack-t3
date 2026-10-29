import type { Meta, StoryObj } from "@storybook/react";
import { ExampleList } from "./example-list";

const meta: Meta<typeof ExampleList> = {
  title: "Example/List",
  component: ExampleList,
};

export default meta;
type Story = StoryObj<typeof ExampleList>;

export const Ready: Story = {
  args: {
    items: [
      { id: 1, title: "First slice", body: "A thin vertical feature." },
      { id: 2, title: "Second slice", body: "" },
    ],
  },
};

export const Empty: Story = { args: { items: [] } };
