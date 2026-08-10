// test_wiki.js
async function test() {
  try {
    const query = encodeURIComponent("Lahore Fort");
    const url = `https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&generator=search&gsrsearch=${query}&gsrnamespace=6&gsrlimit=5&iiprop=url`;
    
    console.log("Querying url:", url);
    const res = await fetch(url);
    const data = await res.json();
    const pages = data?.query?.pages;
    if (!pages) {
      console.log("No pages found:", data);
      return;
    }
    
    const urls = [];
    for (const pageId in pages) {
      const page = pages[pageId];
      if (page.imageinfo && page.imageinfo[0]) {
        const imageUrl = page.imageinfo[0].url;
        if (/\.(jpg|jpeg|png)$/i.test(imageUrl)) {
          urls.push(imageUrl);
        }
      }
    }
    
    console.log("Found image URLs:", urls);
  } catch (error) {
    console.error("Error querying wiki:", error);
  }
}

test();
