/**
 * Pre-processes markdown content to group consecutive image paragraphs
 * into an HTML grid container so they render side by side (up to 4 per row).
 *
 * Input:  "text\n\n![a](url1)\n\n![b](url2)\n\nmore text"
 * Output: "text\n\n<div class=\"image-grid\"><img src=\"url1\" alt=\"a\" /><img src=\"url2\" alt=\"b\" /></div>\n\nmore text"
 */
export function groupConsecutiveImages(content: string): string {
  if (!content) return content;

  const imageRegex = /^!\[([^\]]*)\]\(([^)]+)\)$/;
  const paragraphs = content.split('\n\n');
  const result: string[] = [];
  let imageGroup: { alt: string; src: string }[] = [];

  const flushGroup = () => {
    if (imageGroup.length > 1) {
      const imgs = imageGroup
        .map(img => `<img src="${img.src}" alt="${img.alt}" />`)
        .join('');
      result.push(`<div class="image-grid">${imgs}</div>`);
    } else if (imageGroup.length === 1) {
      // Single image — leave as markdown so the normal img handler applies
      result.push(`![${imageGroup[0].alt}](${imageGroup[0].src})`);
    }
    imageGroup = [];
  };

  for (const para of paragraphs) {
    const trimmed = para.trim();
    const match = trimmed.match(imageRegex);
    if (match) {
      imageGroup.push({ alt: match[1], src: match[2] });
    } else {
      flushGroup();
      result.push(para);
    }
  }
  flushGroup();

  return result.join('\n\n');
}
