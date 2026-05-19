import { discoverPageStyles } from "./discoverPageStyles";
import { discoverCardStyles } from "./discoverCardStyles";
import { discoverFeedStyles } from "./discoverFeedStyles";

const styles = {
  ...discoverPageStyles,
  ...discoverCardStyles,
  ...discoverFeedStyles,
};

export default styles;
export const s = styles;
export const feed = discoverFeedStyles;
