import SatisfactionFeedback from "@/components/SatisfactionFeedback";

const ReviewPromptCard = ({ context }: { context?: string }) => (
  <div className="mt-6 rounded-lg border border-accent/40 bg-accent/5 p-5">
    <SatisfactionFeedback context={context} />
  </div>
);

export default ReviewPromptCard;