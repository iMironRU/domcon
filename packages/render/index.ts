// @domcon/render — frozen presentation.
// Импортируется И билдом (renderToStaticMarkup), И Mini App (живое превью).
// ЗАПРЕЩЕНО внутри компонентов: window, document, fetch, браузерные хуки.

export { PhotoFrame } from "./PhotoFrame";
export { PropertyCard } from "./PropertyCard";
export { ObjectPage } from "./ObjectPage";
export { Visitka } from "./Visitka";
export { fmtPrice, perM2, roomsLabel, specRail } from "./format";
export { makeResolvePhoto } from "./resolvePhoto";
export type { ResolvePhoto, PhotoConfig } from "./resolvePhoto";
