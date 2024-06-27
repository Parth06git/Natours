

export const displayMap = (locations) => {
  mapboxgl.accessToken =
    "pk.eyJ1IjoicGFydGgwNjAyIiwiYSI6ImNseHJxNTUzYzE5Y2kycnFydjRvZjhocnMifQ.vPHpvDHHkzjJaIjHlBL9tw";
  var map = new mapboxgl.Map({
    container: "map",
    style:
      "mapbox://styles/parth0602/clxruo4po003401pfgrlk3h6r",
    // center: [-118.113491, 34.111745],
    // zoom: 8,
    // interactive: false,
    scrollZoom: false,
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach((loc) => {
    // Create a marker
    const el = document.createElement("div");
    el.className = "marker";

    // Add the marker
    new mapboxgl.Marker({
      element: el,
      anchor: "bottom",
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    // Add the popup
    new mapboxgl.Popup({
      offset: 30,
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    // extend the bound to include current locations
    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 100,
      left: 25,
      right: 50,
    },
  });
};
