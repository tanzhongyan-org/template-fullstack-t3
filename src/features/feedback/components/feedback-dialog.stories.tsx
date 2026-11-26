import type { Meta, StoryObj } from "@storybook/react";
import { FeedbackDialog } from "./feedback-dialog";

const meta: Meta<typeof FeedbackDialog> = {
  title: "Feedback/Dialog",
  component: FeedbackDialog,
};

export default meta;
type Story = StoryObj<typeof FeedbackDialog>;

export const Default: Story = {};
