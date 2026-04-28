import {
  nytFavicon,
  bbcFavicon,
  tcFavicon,
  wiredFavicon,
  espnFavicon,
  cbsFavicon,
} from "../images/favicons.js"

export const defaultFeeds = [
  {
    key: "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml",
    title: "NYT > Top Stories",
    html_url: "https://www.nytimes.com",
    language: "en-us",
    image: nytFavicon,
    defaultGroup: "News",
  },
  {
    key: "https://feeds.bbci.co.uk/news/world/rss.xml",
    title: "BBC News",
    html_url: "https://www.bbc.co.uk/news/world",
    language: "en-gb",
    image: bbcFavicon,
    defaultGroup: "News",
  },
  {
    key: "https://techcrunch.com/feed",
    title: "TechCrunch",
    html_url: "https://techcrunch.com",
    language: "en-US",
    image: tcFavicon,
    defaultGroup: "Tech",
  },
  {
    key: "https://www.wired.com/feed",
    title: "Wired",
    html_url: "https://www.wired.com",
    language: "en-US",
    image: wiredFavicon,
    defaultGroup: "Tech",
  },
  {
    key: "https://www.espn.com/espn/rss/news",
    title: "www.espn.com - TOP",
    html_url: "https://www.espn.com",
    language: "en",
    image: espnFavicon,
    defaultGroup: "Sport",
  },
  {
    key: "https://www.cbssports.com/rss/headlines",
    title: "CBSSports.com Headlines",
    html_url: "https://www.cbssports.com",
    language: "en-us",
    image: cbsFavicon,
    defaultGroup: "Sport",
  },
]

export const defaultGroups = ["News", "Tech", "Sport"]
