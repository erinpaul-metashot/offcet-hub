/**
 * remotion/index.ts
 * Registers the Remotion Root so the CLI and Studio can find it.
 */
import { registerRoot } from "remotion";
import { RemotionRoot } from "./Root";

registerRoot(RemotionRoot);
