import type { Meta, StoryObj } from "@storybook/react";
import { ExampleForm } from "./example-form";

const meta: Meta<typeof ExampleForm> = {
  title: "Example/Form",
  component: ExampleForm,
};

export default meta;
type Story = StoryObj<typeof ExampleForm>;

export const Default: Story = {};
