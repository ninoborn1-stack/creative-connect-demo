// @react-pdf/renderer im Browser: renderToBuffer/renderToStream über pdf().toBlob() nachgebildet.
import { pdf } from "@react-pdf/renderer";

export {
  Document, Page, View, Image, ImageBackground, Text, Link, FieldSet, TextInput, Checkbox, Select, List, Note, Canvas, Svg, Line,
  Polyline, Polygon, Path, Rect, Circle, Ellipse, Tspan, G, Stop, Defs, ClipPath, Marker, LinearGradient, RadialGradient,
  BlobProvider, PDFViewer, PDFDownloadLink, usePDF, Font, StyleSheet, version, pdf, renderToString,
} from "@react-pdf/renderer";

type Doc = Parameters<typeof pdf>[0];

export async function renderToBuffer(doc: Doc) {
  const blob = await pdf(doc).toBlob();
  return new Uint8Array(await blob.arrayBuffer());
}

export async function renderToStream(doc: Doc) {
  const blob = await pdf(doc).toBlob();
  return blob.stream();
}

export async function renderToFile(): Promise<never> {
  throw new Error("renderToFile ist in der Browser-Demo nicht verfügbar");
}
