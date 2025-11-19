// Profile Data API
async function fetchProfileData() {
  const [heatmap, blog] = await Promise.all([
    fetch('/data/heatmap.json').then(r => r.json()),
    fetch('/data/blog.json').then(r => r.json())
  ]);
  return { heatmap, blog };
}

// Example usage
fetchProfileData().then(data => {
  console.log('Heatmap:', data.heatmap);
  console.log('Blog:', data.blog);
});