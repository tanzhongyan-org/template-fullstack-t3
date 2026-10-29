import type { Meta, StoryObj } from "@storybook/react";
import { WaitlistForm } from "./waitlist-form";

const meta: Meta<typeof WaitlistForm> = {
  title: "Waitlist/Form",
  component: WaitlistForm,
};

export default meta;
type Story = StoryObj<typeof WaitlistForm>;

export const Default: Story = {};
