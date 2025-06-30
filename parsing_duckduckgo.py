import argparse
import hashlib
import json
import logging
import os
import random
import sys
import time
import urllib.parse
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Union

import requests
from bs4 import BeautifulSoup

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("duckduckgo_search.log", encoding="utf-8"),
    ],
)
logger = logging.getLogger("duckduckgo_searcher")

# Constants
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 12_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.2 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:96.0) Gecko/20100101 Firefox/96.0",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36",
]

CACHE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "cache")
CACHE_EXPIRATION = timedelta(hours=24)

class DuckDuckGoSearcher:
    """A class to search DuckDuckGo and extract results."""

    def __init__(
        self,
        use_cache: bool = True,
        use_proxy: bool = False,
        max_retries: int = 5,
        verbose: bool = False,
    ) -> None:
        """Initialize the searcher."""
        self.use_cache = use_cache
        self.use_proxy = use_proxy
        self.max_retries = max_retries
        self.verbose = verbose

        if use_cache and not os.path.exists(CACHE_DIR):
            os.makedirs(CACHE_DIR)

        logger.setLevel(logging.DEBUG if verbose else logging.INFO)

    def get_random_user_agent(self) -> str:
        """Return a random User-Agent."""
        return random.choice(USER_AGENTS)

    def get_proxies(self) -> Optional[Dict[str, str]]:
        """Get a random proxy (placeholder)."""
        if not self.use_proxy:
            return None

        proxy_list = [
            "http://proxy1.example.com:8080",
            "http://proxy2.example.com:8080",
        ]

        if not proxy_list or all("example.com" in proxy for proxy in proxy_list):
            logger.warning("No valid proxies found. Using direct connection.")
            return None

        proxy_address = random.choice(proxy_list)
        proxies = {"http": proxy_address, "https": proxy_address}
        logger.info(f"Using proxy: {proxy_address}")
        return proxies

    def get_cache_path(self, query: str) -> str:
        """Get the cache file path for a query."""
        query_hash = hashlib.md5(query.encode()).hexdigest()
        return os.path.join(CACHE_DIR, f"{query_hash}.json")

    def get_cached_results(self, query: str) -> Optional[List[Dict]]:
        """Get cached results if not expired."""
        if not self.use_cache:
            return None

        cache_path = self.get_cache_path(query)
        if not os.path.exists(cache_path):
            return None

        try:
            with open(cache_path, "r", encoding="utf-8") as f:
                cached_data = json.load(f)

            cached_time = datetime.fromisoformat(cached_data["timestamp"])
            if datetime.now() - cached_time > CACHE_EXPIRATION:
                logger.debug(f"Cache for '{query}' has expired.")
                return None

            logger.info(f"Using cached results for '{query}'")
            return cached_data["results"]
        except Exception as e:
            logger.warning(f"Error reading cache: {e}")
            return None

    def save_to_cache(self, query: str, results: List[Dict]) -> None:
        """Save search results to cache."""
        if not self.use_cache or not results:
            return

        cache_path = self.get_cache_path(query)
        try:
            cache_data = {
                "query": query,
                "timestamp": datetime.now().isoformat(),
                "results": results,
            }
            with open(cache_path, "w", encoding="utf-8") as f:
                json.dump(cache_data, f, ensure_ascii=False, indent=2)
            logger.debug(f"Results for '{query}' saved to cache")
        except Exception as e:
            logger.warning(f"Error saving to cache: {e}")

    def search(self, query: str) -> List[Dict]:
        """Search DuckDuckGo for the given query."""
        cached_results = self.get_cached_results(query)
        if cached_results is not None:
            return cached_results

        logger.info(f"Searching DuckDuckGo for: {query}")
        results = self._search_html_version(query)

        if not results:
            logger.info("HTML version failed, trying lite version")
            results = self._search_lite_version(query)

        if results:
            self.save_to_cache(query, results)

        return results

    def _search_html_version(self, query: str) -> List[Dict]:
        """Search using the HTML version of DuckDuckGo."""
        encoded_query = urllib.parse.quote(query)
        url = f"https://duckduckgo.com/html/?q={encoded_query}"
        response = self._make_request(url)
        return self._extract_html_results(response.text) if response else []

    def _search_lite_version(self, query: str) -> List[Dict]:
        """Search using the lite version of DuckDuckGo."""
        encoded_query = urllib.parse.quote(query)
        url = f"https://lite.duckduckgo.com/lite/?q={encoded_query}"
        response = self._make_request(url)
        return self._extract_lite_results(response.text) if response else []

    def _make_request(self, url: str) -> Optional[requests.Response]:
        """Make an HTTP request with retries."""
        retry_count = 0
        while retry_count < self.max_retries:
            try:
                time.sleep(random.uniform(1.0, 3.0))
                user_agent = self.get_random_user_agent()
                headers = {
                    "User-Agent": user_agent,
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                    "Accept-Language": "en-US,en;q=0.9",
                    "Referer": "https://duckduckgo.com/",
                }
                proxies = self.get_proxies()
                response = requests.get(
                    url,
                    headers=headers,
                    proxies=proxies,
                    timeout=30,
                )

                if response.status_code == 200:
                    if any(
                        term in response.text.lower()
                        for term in ["captcha", "blocked", "too many requests"]
                    ):
                        logger.warning("CAPTCHA or blocking detected. Retrying...")
                        retry_count += 1
                        time.sleep(2**retry_count + random.uniform(1, 3))
                        continue
                    return response

                elif response.status_code == 429 or response.status_code >= 500:
                    logger.warning(f"Got status code {response.status_code}. Retrying...")
                    retry_count += 1
                    time.sleep(2**retry_count + random.uniform(1, 3))
                else:
                    logger.error(f"Error: Got status code {response.status_code}")
                    debug_path = f"debug_response_{response.status_code}.html"
                    with open(debug_path, "w", encoding="utf-8") as f:
                        f.write(response.text)
                    logger.debug(f"Saved error response to {debug_path}")
                    return None

            except requests.exceptions.RequestException as e:
                logger.warning(f"Request error: {e}")
                retry_count += 1
                time.sleep(2**retry_count + random.uniform(1, 3))
            except Exception as e:
                logger.error(f"Unexpected error: {e}")
                return None

        logger.error(f"Failed to make request after {self.max_retries} retries")
        return None

    def _extract_html_results(self, html_content: str) -> List[Dict]:
        """Extract search results from HTML version."""
        results = []
        try:
            soup = BeautifulSoup(html_content, "html.parser")
            if self.verbose:
                with open("debug_html_content.html", "w", encoding="utf-8") as f:
                    f.write(html_content)

            selectors_to_try = [
                "div.result",
                "div.results_links",
                "div.web-result",
                "article.result",
            ]

            for selector in selectors_to_try:
                result_elements = soup.select(selector)
                if result_elements:
                    logger.debug(f"Found {len(result_elements)} results using selector: {selector}")
                    break
            else:
                result_elements = []

            for result in result_elements:
                try:
                    title_element = self._find_element(
                        result,
                        [
                            "a.result__a",
                            "a.result__url",
                            "h2 a",
                            ".result__title a",
                        ],
                    )
                    if not title_element:
                        continue

                    title = title_element.get_text().strip()
                    link = title_element.get("href", "")
                    if not link or link.startswith("javascript:") or link == "#":
                        continue

                    if "/y.js?" in link or "/l.js?" in link or "uddg=" in link:
                        parsed_url = urllib.parse.urlparse(link)
                        query_params = urllib.parse.parse_qs(parsed_url.query)
                        if "uddg" in query_params:
                            link = urllib.parse.unquote(query_params["uddg"][0])
                        elif "u" in query_params:
                            link = urllib.parse.unquote(query_params["u"][0])
                        else:
                            continue

                    desc_element = self._find_element(
                        result,
                        [
                            "a.result__snippet",
                            "div.result__snippet",
                            ".snippet",
                        ],
                    )
                    description = desc_element.get_text().strip() if desc_element else ""

                    if title and link:
                        results.append({"title": title, "link": link, "description": description})
                except Exception as e:
                    logger.debug(f"Error processing result element: {e}")
                    continue
        except Exception as e:
            logger.error(f"Error extracting HTML results: {e}")

        return results

    def _extract_lite_results(self, html_content: str) -> List[Dict]:
        """Extract search results from lite version."""
        results = []
        try:
            soup = BeautifulSoup(html_content, "html.parser")
            if self.verbose:
                with open("debug_lite_content.html", "w", encoding="utf-8") as f:
                    f.write(html_content)

            result_rows = soup.select("table tr:has(a)")
            for row in result_rows:
                try:
                    link_elem = row.find("a")
                    if not link_elem:
                        continue

                    title = link_elem.get_text().strip()
                    link = link_elem.get("href", "")
                    if not link or link.startswith("/"):
                        continue

                    description = ""
                    next_row = row.find_next_sibling("tr")
                    if next_row:
                        desc_cells = [cell for cell in next_row.find_all("td") if not cell.find("a")]
                        if desc_cells:
                            description = desc_cells[0].get_text().strip()

                    if title and link:
                        results.append({"title": title, "link": link, "description": description})
                except Exception as e:
                    logger.debug(f"Error processing lite result row: {e}")
                    continue
        except Exception as e:
            logger.error(f"Error extracting lite results: {e}")

        return results

    def _find_element(self, parent_element, selectors: List[str]):
        """Try multiple selectors to find an element."""
        for selector in selectors:
            found = parent_element.select_one(selector)
            if found:
                return found
        return None

def display_results(results: List[Dict], colorize: bool = True) -> None:
    """Display search results in the console."""
    if not results:
        print("No results found or an error occurred.")
        return

    print(f"\nFound {len(results)} results:\n")
    colors = {
        "title": "\033[1;36m",
        "link": "\033[0;32m",
        "desc": "\033[0;37m",
        "reset": "\033[0m",
    }

    if not colorize or (os.name == "nt" and not os.environ.get("ANSICON")):
        colors = {k: "" for k in colors}

    for i, result in enumerate(results, 1):
        print(f"{i}. {colors['title']}{result['title']}{colors['reset']}")
        print(f"   {colors['link']}{result['link']}{colors['reset']}")
        print(f"   {colors['desc']}{result['description']}{colors['reset']}")
        print()

def save_results_to_file(results: List[Dict], filename: str) -> bool:
    """Save search results to a text file."""
    if not results:
        return False

    try:
        with open(filename, "w", encoding="utf-8") as f:
            f.write(f"DuckDuckGo Search Results ({len(results)} items)\n")
            f.write("=" * 50 + "\n\n")
            for i, result in enumerate(results, 1):
                f.write(f"{i}. {result['title']}\n")
                f.write(f"   {result['link']}\n")
                f.write(f"   {result['description']}\n\n")
        print(f"Results saved to {filename}")
        return True
    except Exception as e:
        logger.error(f"Error saving results: {e}")
        return False

def save_results_to_json(results: List[Dict], filename: str) -> bool:
    """Save search results to a JSON file."""
    if not results:
        return False

    try:
        with open(filename, "w", encoding="utf-8") as f:
            json.dump(results, f, ensure_ascii=False, indent=2)
        print(f"Results saved to JSON format: {filename}")
        return True
    except Exception as e:
        logger.error(f"Error saving JSON: {e}")
        return False

def main() -> None:
    """Main function for the script."""
    parser = argparse.ArgumentParser(description="DuckDuckGo Search without Blocking")
    parser.add_argument("query", nargs="*", help="Search query (prompted if not provided)")
    parser.add_argument("--proxy", "-p", action="store_true", help="Use proxy rotation (requires setup)")
    parser.add_argument("--no-cache", "-n", action="store_true", help="Disable caching of results")
    parser.add_argument("--retries", "-r", type=int, default=5, help="Maximum number of retries")
    parser.add_argument("--output", "-o", help="Save results to a text file")
    parser.add_argument("--json", "-j", help="Save results to a JSON file")
    parser.add_argument("--verbose", "-v", action="store_true", help="Show detailed information")
    parser.add_argument("--limit", "-l", type=int, default=0, help="Limit the number of results")
    args = parser.parse_args()

    query = " ".join(args.query) if args.query else input("Enter search query: ")
    print(f"Performing DuckDuckGo search: {query}")
    print("Please wait...")

    searcher = DuckDuckGoSearcher(
        use_cache=not args.no_cache,
        use_proxy=args.proxy,
        max_retries=args.retries,
        verbose=args.verbose,
    )

    results = searcher.search(query)
    if args.limit > 0 and len(results) > args.limit:
        results = results[:args.limit]

    if results:
        display_results(results)
        if args.output:
            save_results_to_file(results, args.output)
        if args.json:
            save_results_to_json(results, args.json)
    else:
        print("Search failed or no results found.")
        print("Please check your internet connection and try again.")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nSearch interrupted by user.")
        sys.exit(0)
    except Exception as e:
        logger.error(f"An unexpected error occurred: {e}")
        sys.exit(1)