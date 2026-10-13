/* Eleventy build.
 * Pages live in src/pages as .liquid files whose front matter holds a `sections`
 * list. Each section is rendered by the matching template in
 * src/_includes/sections/<type>.liquid — that is what lets CloudCannon add,
 * duplicate, delete and reorder sections without a developer.
 *
 * Build command in CloudCannon:  npx @11ty/eleventy
 * Output folder in CloudCannon:  _site
 */
const pluginBookshop = require("@bookshop/eleventy-bookshop");

module.exports = function (eleventyConfig) {
  // Bookshop resolves bookshopLocations from the project root, but LiquidJS
  // resolves includes from the input dir (src). Adding "." lets Liquid find
  // the component library at the root, so both agree.
  eleventyConfig.setLiquidOptions({
    root: ["src/_includes", "src", "."],
    dynamicPartials: true,
    extname: ".liquid",
    strictFilters: true,
    jsTruthy: true
  });

  eleventyConfig.addPlugin(pluginBookshop({
    bookshopLocations: ["component-library"],
    pathPrefix: ''
  }));
  // Assets keep their current URLs (/css/..., /js/..., /images/..., /fonts/...)
  eleventyConfig.addPassthroughCopy({
    css: "css",
    js: "js",
    images: "images",
    fonts: "fonts"
  });

  // "a\nb" -> "a<br>b"  (used for labels that wrap onto two lines)
  eleventyConfig.addFilter("nl2br", function (value) {
    if (value === undefined || value === null) return "";
    return String(value)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/\r\n|\r|\n/g, "<br/>");
  });

  // youtube / vimeo url -> embeddable player url
  eleventyConfig.addFilter("embedUrl", function (value) {
    var u = String(value || "").trim();
    var m = u.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/);
    if (m) return "https://www.youtube.com/embed/" + m[1];
    m = u.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (m) return "https://player.vimeo.com/video/" + m[1];
    return u;
  });

  return {
    dir: { input: "src", includes: "_includes", data: "_data", output: "_site" },
    htmlTemplateEngine: "liquid",
    markdownTemplateEngine: "liquid"
  };
};
