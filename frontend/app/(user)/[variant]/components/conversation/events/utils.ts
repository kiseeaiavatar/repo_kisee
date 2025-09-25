export const parseEventItem = (item: string) => {
  // Match all [tag] and <tag>
  const tagRegex = /(\[([^\]]+)\])|(<([^>]+)>)/g;

  let match, img, skill;
  while ((match = tagRegex.exec(item)) !== null) {
    if (match[2]) img = match[2];
    if (match[4]) skill = match[4];
  }

  if (skill) {
    const escoURLs = ["http://data.europa.eu/esco/", "https://data.europa.eu/esco/"];
    for (const url of escoURLs) {
      skill = skill.replace(url, "");
    }
  }

  // Remove tags from the string to get remaining text
  const text = item.replace(tagRegex, "").trim();

  return {
    img,
    skill,
    text,
  };
};
