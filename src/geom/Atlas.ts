import { SortedCorners } from "./Grid";

export interface Atlas {
    checkMatch: (corners: SortedCorners) => boolean;
}
