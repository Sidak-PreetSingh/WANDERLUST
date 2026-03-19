mapboxgl.accessToken = mapToken;

    const map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v12',
        center: geometry.coordinates,
        zoom: 9
    });

    const marker = new mapboxgl.Marker({color: "red"})
        .setLngLat(geometry.coordinates) //[ lng,lat]
        .setPopup(new mapboxgl.Popup({offset: 25})
        
        .setHTML(`<h4>listing.location</h4><p>Exact Loaction will be provided after booking</p>`))
        .addTo(map);
