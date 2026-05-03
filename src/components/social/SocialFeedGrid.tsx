import SocialMediaCard from "./SocialMediaCard";
import type { SocialPost } from "@/data/socialPosts";

type Props = {
  posts: SocialPost[];
  className?: string;
};

const SocialFeedGrid = ({ posts, className }: Props) => {
  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 ${className ?? ""}`}
    >
      {posts.map((post) => (
        <SocialMediaCard key={post.id} post={post} />
      ))}
    </div>
  );
};

export default SocialFeedGrid;
