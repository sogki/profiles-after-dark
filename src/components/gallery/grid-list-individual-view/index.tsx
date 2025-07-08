import { CombinedGridViewProps, LookupTables } from "./common-types";
import GalleryGridView from "./view";

export default function GalleryItemView<T extends LookupTables>({
  ...rest
}: CombinedGridViewProps<T>) {
  return <GalleryGridView {...rest} />;
}
