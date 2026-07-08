import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API_URL =
  "https://api.openbrewerydb.org/v1/breweries?by_state=new_york&per_page=50";

function App() {
  const [breweries, setBreweries] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [websiteOnly, setWebsiteOnly] = useState(false);
  const [maxResults, setMaxResults] = useState(50);
  const [sortBy, setSortBy] = useState("name");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchBreweries = async () => {
      try {
        const response = await fetch(API_URL);

        if (!response.ok) {
          throw new Error("I could not fetch brewery data.");
        }

        const data = await response.json();
        setBreweries(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBreweries();
  }, []);

  const breweryTypes = useMemo(() => {
    const types = breweries
      .map((brewery) => brewery.brewery_type)
      .filter(Boolean);

    return ["all", ...new Set(types)];
  }, [breweries]);

  const filteredBreweries = useMemo(() => {
    let results = breweries.filter((brewery) => {
      const searchText = searchInput.toLowerCase();

      const matchesSearch =
        brewery.name?.toLowerCase().includes(searchText) ||
        brewery.city?.toLowerCase().includes(searchText) ||
        brewery.brewery_type?.toLowerCase().includes(searchText);

      const matchesType =
        selectedType === "all" || brewery.brewery_type === selectedType;

      const matchesWebsite = !websiteOnly || brewery.website_url;

      return matchesSearch && matchesType && matchesWebsite;
    });

    results = [...results].sort((a, b) => {
      if (sortBy === "city") {
        return a.city.localeCompare(b.city);
      }

      if (sortBy === "type") {
        return a.brewery_type.localeCompare(b.brewery_type);
      }

      return a.name.localeCompare(b.name);
    });

    return results.slice(0, maxResults);
  }, [breweries, searchInput, selectedType, websiteOnly, maxResults, sortBy]);

  const totalBreweries = breweries.length;

  const uniqueCities = new Set(breweries.map((brewery) => brewery.city)).size;

  const breweriesWithWebsites = breweries.filter(
    (brewery) => brewery.website_url
  ).length;

  const mostCommonType = useMemo(() => {
    const typeCounts = {};

    breweries.forEach((brewery) => {
      const type = brewery.brewery_type || "unknown";
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    const topType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0];

    return topType ? formatType(topType[0]) : "N/A";
  }, [breweries]);

  return (
    <div className="app">
      <header className="hero">
        <p className="eyebrow">Project 5 Data Dashboard</p>
        <h1>New York Brewery Dashboard</h1>
        <p className="subtitle">
          Explore brewery's all across New York!
        </p>
      </header>

      {loading && <p className="status-message">Loading brewery data...</p>}

      {error && <p className="error-message">{error}</p>}

      {!loading && !error && (
        <>
          <section className="stats-grid">
            <StatCard title="Breweries Loaded" value={totalBreweries} />
            <StatCard title="Unique Cities" value={uniqueCities} />
            <StatCard title="With Websites" value={breweriesWithWebsites} />
            <StatCard title="Most Common Type" value={mostCommonType} />
          </section>

          <section className="controls-card">
            <div className="control-group">
              <label htmlFor="search">Search breweries</label>
              <input
                id="search"
                type="text"
                placeholder="Search by name, city, or type..."
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
              />
            </div>

            <div className="control-group">
              <label htmlFor="type-filter">Filter by type</label>
              <select
                id="type-filter"
                value={selectedType}
                onChange={(event) => setSelectedType(event.target.value)}
              >
                {breweryTypes.map((type) => (
                  <option key={type} value={type}>
                    {type === "all" ? "All Types" : formatType(type)}
                  </option>
                ))}
              </select>
            </div>

            <div className="control-group">
              <label htmlFor="sort">Sort by</label>
              <select
                id="sort"
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
              >
                <option value="name">Name</option>
                <option value="city">City</option>
                <option value="type">Type</option>
              </select>
            </div>

            <div className="control-group checkbox-control">
              <label>
                <input
                  type="checkbox"
                  checked={websiteOnly}
                  onChange={(event) => setWebsiteOnly(event.target.checked)}
                />
                Only show the breweries that have websites
              </label>
            </div>

            <div className="control-group slider-control">
              <label htmlFor="max-results">
                Max results shown: {maxResults}
              </label>
              <input
                id="max-results"
                type="range"
                min="10"
                max="50"
                value={maxResults}
                onChange={(event) => setMaxResults(Number(event.target.value))}
              />
            </div>
          </section>

          <section className="dashboard-list">
            <div className="list-header">
              <h2>Breweries</h2>
              <p>{filteredBreweries.length} result(s)</p>
            </div>

            <div className="table">
              <div className="table-row table-heading">
                <p>Name</p>
                <p>Type</p>
                <p>City</p>
                <p>Address</p>
                <p>Website</p>
              </div>

              {filteredBreweries.map((brewery) => (
                <div className="table-row" key={brewery.id}>
                  <p className="brewery-name">{brewery.name}</p>
                  <p>
                    <span className="type-pill">
                      {formatType(brewery.brewery_type)}
                    </span>
                  </p>
                  <p>{brewery.city || "Unknown"}</p>
                  <p>{brewery.address_1 || "No address listed"}</p>
                  <p>
                    {brewery.website_url ? (
                      <a
                        href={brewery.website_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Visit
                      </a>
                    ) : (
                      "N/A"
                    )}
                  </p>
                </div>
              ))}
            </div>

            {filteredBreweries.length === 0 && (
              <p className="status-message">
                No breweries match your current filters.
              </p>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <article className="stat-card">
      <p>{title}</p>
      <h2>{value}</h2>
    </article>
  );
}

function formatType(type) {
  if (!type) {
    return "Unknown";
  }

  return type
    .split("_")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

export default App;