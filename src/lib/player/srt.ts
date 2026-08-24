export function srtToVtt(srt: string): string {
  const body = srt
    .replace(/\r\n/g, "\n")
    .replace(/(\d+:\d+:\d+),(\d+)/g, "$1.$2")
    .trim();
  if (body.startsWith("WEBVTT")) return body;
  return `WEBVTT\n\n${body}`;
}
